import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { SAMPLE_RECEIPTS_DATA, parseReceiptText } from '../utils/ocrParser';
import { CATEGORIES } from '../constants';

function ReceiptScanner({ onAddTransaction, onShowToast }) {
  const [imageUrl, setImageUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0: Idle, 1: Loading image, 2: OCR, 3: Parsing, 4: Done
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null); // { merchant, date, category, tax, amount, items }
  
  const fileInputRef = useRef(null);

  // Handlers for File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file) => {
    if (!file.type.startsWith('image/')) {
      onShowToast("Please upload an image file", "info");
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setScanResult(null);
    runRealOCR(file);
  };

  // Run Tesseract OCR on custom uploaded files
  const runRealOCR = async (file) => {
    setIsScanning(true);
    setScanStep(1);
    setScanProgress(10);

    try {
      // Step 2: OCR Engine Init & Recognition
      setScanStep(2);
      setScanProgress(30);
      
      const result = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setScanProgress(Math.min(30 + Math.round(m.progress * 50), 80));
            }
          }
        }
      );

      // Step 3: Parsing unstructured data
      setScanStep(3);
      setScanProgress(90);
      await new Promise(r => setTimeout(r, 600)); // Dramatic pause for user feel

      const parsed = parseReceiptText(result.data.text);
      
      // Step 4: Finished
      setScanStep(4);
      setScanProgress(100);
      setScanResult(parsed);
      onShowToast("Receipt parsed successfully!", "success");
    } catch (error) {
      console.error("OCR Error:", error);
      onShowToast("Failed to read image. Falling back to manual entry.", "error");
      
      // Fallback result if OCR fails entirely
      setScanResult({
        merchant: file.name.split('.')[0] || "Uploaded Receipt",
        amount: 0.00,
        tax: 0.00,
        category: "other",
        date: new Date().toISOString().split('T')[0],
        items: []
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Quick scan for the 3 beautiful predefined samples (with 100% accuracy and speed)
  const handleSelectSample = async (key) => {
    const mockData = SAMPLE_RECEIPTS_DATA[key];
    if (!mockData) return;

    setImageUrl(`/samples/${key}_receipt.png`);
    setScanResult(null);
    setIsScanning(true);
    setScanStep(1);
    setScanProgress(15);

    // Simulate scanning stages with a timer for beautiful UX
    await new Promise(r => setTimeout(r, 600));
    setScanStep(2);
    setScanProgress(45);
    await new Promise(r => setTimeout(r, 800));
    setScanStep(3);
    setScanProgress(80);
    await new Promise(r => setTimeout(r, 600));
    setScanStep(4);
    setScanProgress(100);
    setIsScanning(false);

    // Deep copy to prevent mutating sample data
    setScanResult(JSON.parse(JSON.stringify(mockData)));
    onShowToast(`Sample "${mockData.merchant}" scanned successfully!`, "success");
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Edit scan result handlers
  const handleFieldChange = (field, val) => {
    setScanResult(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleItemChange = (index, field, val) => {
    const updatedItems = [...scanResult.items];
    updatedItems[index][field] = field === 'price' ? parseFloat(val) || 0 : val;
    
    // Recalculate total if items list changes
    const newItemsSum = updatedItems.reduce((sum, item) => sum + item.price, 0);
    const newTotal = Number((newItemsSum + scanResult.tax).toFixed(2));

    setScanResult(prev => ({
      ...prev,
      items: updatedItems,
      amount: newTotal
    }));
  };

  const handleAddItem = () => {
    const updatedItems = [...scanResult.items, { name: "New Item", price: 0.00 }];
    setScanResult(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const handleDeleteItem = (index) => {
    const updatedItems = scanResult.items.filter((_, i) => i !== index);
    const newItemsSum = updatedItems.reduce((sum, item) => sum + item.price, 0);
    const newTotal = Number((newItemsSum + scanResult.tax).toFixed(2));
    
    setScanResult(prev => ({
      ...prev,
      items: updatedItems,
      amount: newTotal
    }));
  };

  const handleTaxChange = (val) => {
    const newTax = parseFloat(val) || 0;
    const itemsSum = scanResult.items.reduce((sum, item) => sum + item.price, 0);
    const newTotal = Number((itemsSum + newTax).toFixed(2));

    setScanResult(prev => ({
      ...prev,
      tax: newTax,
      amount: newTotal
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!scanResult.merchant.trim()) {
      onShowToast("Please enter a merchant description", "info");
      return;
    }
    if (scanResult.amount <= 0) {
      onShowToast("Please enter an amount greater than 0", "info");
      return;
    }

    // Add as expense transaction
    onAddTransaction({
      description: scanResult.merchant.trim(),
      amount: scanResult.amount,
      type: "expense",
      category: scanResult.category,
      date: scanResult.date
    });

    // Reset scanner
    handleReset();
  };

  const handleReset = () => {
    setImageUrl("");
    setIsScanning(false);
    setScanStep(0);
    setScanProgress(0);
    setScanResult(null);
  };

  // Helper for scanning stage text
  const getStepText = () => {
    switch (scanStep) {
      case 1: return "Reading uploaded image...";
      case 2: return "Executing OCR text extraction...";
      case 3: return "Heuristically parsing items & tax...";
      case 4: return "Finalizing expense details...";
      default: return "Initializing scanner...";
    }
  };

  return (
    <section className="panel receipt-scanner-panel" aria-labelledby="ocr-title">
      <h2 id="ocr-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
        Smart AI OCR Receipt Scanner
      </h2>

      {/* Main scanner viewport */}
      {!imageUrl && !isScanning && (
        <div className="upload-container">
          <div 
            className="dropzone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*"
              style={{ display: 'none' }}
            />
            <div className="dropzone-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <p className="dropzone-text">Drag & drop receipt photo, or click to upload</p>
            <span className="dropzone-sub">Supports PNG, JPG, JPEG</span>
          </div>

          <div className="sample-receipts-section">
            <h3>Quick-Test with Sample Receipts</h3>
            <p className="samples-intro">Test the scanner instantly with high-fidelity receipt examples:</p>
            <div className="samples-grid">
              <button onClick={() => handleSelectSample('starbucks')} className="btn-sample starbucks-sample">
                <span className="sample-icon">☕</span>
                <span className="sample-name">Starbucks Coffee</span>
                <span className="sample-cost">$8.93</span>
              </button>
              <button onClick={() => handleSelectSample('target')} className="btn-sample target-sample">
                <span className="sample-icon">🎯</span>
                <span className="sample-name">Target Store</span>
                <span className="sample-cost">$15.25</span>
              </button>
              <button onClick={() => handleSelectSample('uber')} className="btn-sample uber-sample">
                <span className="sample-icon">🚗</span>
                <span className="sample-name">Uber Ride</span>
                <span className="sample-cost">$23.00</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OCR Scan Animation Interface */}
      {imageUrl && (isScanning || !scanResult) && (
        <div className="scanner-active-view">
          <div className="receipt-view-frame">
            <img src={imageUrl} alt="Receipt preview" className="receipt-preview-img" />
            {isScanning && <div className="laser-beam" />}
            {isScanning && (
              <div className="scan-overlay-blur">
                <div className="scanner-status-spinner">
                  <div className="spinner-arc" />
                  <span className="progress-percentage">{scanProgress}%</span>
                </div>
                <p className="scan-step-text">{getStepText()}</p>
              </div>
            )}
          </div>
          {isScanning && (
            <div className="scan-progress-bar-container">
              <div className="scan-progress-bar-fill" style={{ width: `${scanProgress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* OCR Editing & Adding Form */}
      {scanResult && !isScanning && (
        <form onSubmit={handleSubmit} className="ocr-result-form">
          <div className="ocr-preview-header">
            <div className="receipt-thumbnail">
              <img src={imageUrl} alt="Receipt Thumbnail" />
            </div>
            <div className="ocr-header-details">
              <h4>Scan Output Complete</h4>
              <p>Review and adjust extracted items/totals below.</p>
            </div>
            <button type="button" className="btn-secondary btn-reset-scan" onClick={handleReset}>
              Discard
            </button>
          </div>

          <div className="ocr-grid">
            <div className="form-group">
              <label htmlFor="ocr-merchant">Merchant / Description</label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </span>
                <input
                  id="ocr-merchant"
                  type="text"
                  value={scanResult.merchant}
                  onChange={(e) => handleFieldChange('merchant', e.target.value)}
                  placeholder="Merchant name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ocr-date">Receipt Date</label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </span>
                <input
                  id="ocr-date"
                  type="date"
                  value={scanResult.date}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ocr-cat">Category Auto-Assigned</label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                </span>
                <select 
                  id="ocr-cat" 
                  value={scanResult.category} 
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Items Extraction List */}
          <div className="ocr-items-container">
            <div className="ocr-items-header">
              <h5>Extracted Line Items</h5>
              <button type="button" className="btn-add-item" onClick={handleAddItem}>
                + Add Item
              </button>
            </div>

            {scanResult.items.length === 0 ? (
              <p className="no-items-placeholder">No line items parsed. You can manually add items or adjust the tax and total directly.</p>
            ) : (
              <div className="ocr-items-list">
                {scanResult.items.map((item, index) => (
                  <div key={index} className="ocr-item-row">
                    <input 
                      type="text"
                      className="ocr-item-name-input"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="Item name"
                    />
                    <div className="ocr-item-price-wrapper">
                      <span className="currency-symbol">$</span>
                      <input 
                        type="number"
                        step="0.01"
                        className="ocr-item-price-input"
                        value={item.price || ""}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <button 
                      type="button" 
                      className="btn-delete-item"
                      onClick={() => handleDeleteItem(index)}
                      aria-label="Remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="ocr-totals-group">
              <div className="ocr-total-row">
                <span>Tax ($):</span>
                <input 
                  type="number" 
                  step="0.01" 
                  className="ocr-tax-input"
                  value={scanResult.tax}
                  onChange={(e) => handleTaxChange(e.target.value)}
                />
              </div>
              <div className="ocr-total-row total-highlight">
                <span>Total Amount:</span>
                <span className="total-amount-val">${scanResult.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary btn-submit-ocr" id="btn-submit-ocr-tx">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Confirm & Log Expense
          </button>
        </form>
      )}
    </section>
  );
}

export default ReceiptScanner;
