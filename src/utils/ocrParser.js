// OCR Parser for receipts

// Mock data for immediate, high-fidelity sample receipt demonstration
export const SAMPLE_RECEIPTS_DATA = {
  starbucks: {
    merchant: "Starbucks Coffee",
    amount: 8.93,
    tax: 0.68,
    category: "food",
    date: new Date().toISOString().split('T')[0],
    items: [
      { name: "Caffe Latte", price: 4.75 },
      { name: "Blueberry Scone", price: 3.50 }
    ],
    rawText: `STARBUCKS COFFEE #1234
101 BROADWAY, NEW YORK NY
STORE # 01234  REG 01
--------------------------
CAFFE LATTE         4.75
BLUEBERRY SCONE     3.50
--------------------------
SUBTOTAL            8.25
TAX (8.25%)         0.68
TOTAL               8.93
--------------------------
THANK YOU FOR YOUR VISIT!`
  },
  target: {
    merchant: "Target Store",
    amount: 15.25,
    tax: 0.98,
    category: "food",
    date: new Date().toISOString().split('T')[0],
    items: [
      { name: "Organic Milk", price: 4.99 },
      { name: "Whole Wheat Bread", price: 3.29 },
      { name: "Apples 3lb", price: 5.99 }
    ],
    rawText: `TARGET STORES
2001 HWY 36 WEST
ROSEVILLE, MN 55113
--------------------------
ORGANIC MILK        4.99 F
WHEAT BREAD         3.29 F
APPLES 3LB          5.99 F
--------------------------
SUBTOTAL           14.27
TAX (6.875%)        0.98
TOTAL              15.25
--------------------------
ITEMS SOLD 3
08/06/2026 15:30`
  },
  uber: {
    merchant: "Uber Trip Ride",
    amount: 23.00,
    tax: 0.00,
    category: "transport",
    date: new Date().toISOString().split('T')[0],
    items: [
      { name: "Base Fare", price: 2.50 },
      { name: "Distance Fee", price: 12.40 },
      { name: "Time Fee", price: 5.10 },
      { name: "Tip", price: 3.00 }
    ],
    rawText: `Uber Trip Receipt
August 6, 2026

Trip Charge Details:
--------------------------
Base Fare           2.50
Distance           12.40
Time Fee            5.10
Tip                 3.00
--------------------------
SUBTOTAL           20.00
SURCHARGE           0.00
TOTAL              23.00
--------------------------
Paid with Personal Card`
  }
};

/**
 * Categorize a transaction based on merchant and items keywords
 */
export function autoCategorize(merchant, items = [], rawText = "") {
  const text = `${merchant} ${items.map(i => i.name).join(" ")} ${rawText}`.toLowerCase();
  
  if (
    text.includes("starbucks") || 
    text.includes("coffee") || 
    text.includes("cafe") || 
    text.includes("baker") || 
    text.includes("restaurant") || 
    text.includes("grocer") || 
    text.includes("food") || 
    text.includes("dinner") || 
    text.includes("lunch") || 
    text.includes("burger") || 
    text.includes("pizza") || 
    text.includes("supermarket") || 
    text.includes("market") || 
    text.includes("eats") || 
    text.includes("target") || 
    text.includes("walmart") || 
    text.includes("whole foods") || 
    text.includes("costco")
  ) {
    return "food";
  }
  
  if (
    text.includes("uber") || 
    text.includes("lyft") || 
    text.includes("cab") || 
    text.includes("taxi") || 
    text.includes("gas") || 
    text.includes("fuel") || 
    text.includes("shell") || 
    text.includes("chevron") || 
    text.includes("exxon") || 
    text.includes("flight") || 
    text.includes("airline") || 
    text.includes("train") || 
    text.includes("metro") || 
    text.includes("subway transit") || 
    text.includes("transport")
  ) {
    return "transport";
  }

  if (
    text.includes("rent") || 
    text.includes("lease") || 
    text.includes("housing") || 
    text.includes("landlord") || 
    text.includes("apartment") || 
    text.includes("mortgage")
  ) {
    return "housing";
  }

  if (
    text.includes("electric") || 
    text.includes("power") || 
    text.includes("water") || 
    text.includes("sewer") || 
    text.includes("gas bill") || 
    text.includes("utility") || 
    text.includes("utilities") || 
    text.includes("internet") || 
    text.includes("wifi") || 
    text.includes("comcast") || 
    text.includes("at&t") || 
    text.includes("verizon")
  ) {
    return "utilities";
  }

  if (
    text.includes("netflix") || 
    text.includes("spotify") || 
    text.includes("hulu") || 
    text.includes("disney") || 
    text.includes("movie") || 
    text.includes("cinema") || 
    text.includes("theatre") || 
    text.includes("ticket") || 
    text.includes("concert") || 
    text.includes("game") || 
    text.includes("steam") || 
    text.includes("playstation") || 
    text.includes("xbox") || 
    text.includes("entertainment")
  ) {
    return "entertainment";
  }

  if (
    text.includes("salary") || 
    text.includes("payroll") || 
    text.includes("wage") || 
    text.includes("freelance") || 
    text.includes("upwork") || 
    text.includes("fiverr") || 
    text.includes("invoice") || 
    text.includes("payment received")
  ) {
    return "salary";
  }

  return "other";
}

/**
 * Parses raw OCR text using regex heuristics to extract merchant, items, tax, and total.
 */
export function parseReceiptText(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  
  let merchant = "Receipt Purchase";
  let items = [];
  let tax = 0;
  let total = 0;
  
  // Try to find a merchant name (first 3 non-empty lines that don't look like dates/numbers)
  const candidateMerchantLines = lines.slice(0, 3).filter(line => {
    return !line.match(/\d/) && line.length > 3;
  });
  if (candidateMerchantLines.length > 0) {
    merchant = candidateMerchantLines[0];
  }

  // Regexes for totals
  const totalRegex = /(?:total|grand\s*total|net\s*total|amount\s*paid|due|pay|sum)[\s:]*[$€£]?\s*(\d+[.,]\d{2})/i;
  const taxRegex = /(?:tax|sales\s*tax|gst|vat|hst)[\s:]*[$€£]?\s*(\d+[.,]\d{2})/i;

  // Let's sweep the lines to find items and totals
  for (const line of lines) {
    // Check for total
    const totalMatch = line.match(totalRegex);
    if (totalMatch) {
      const val = parseFloat(totalMatch[1].replace(',', '.'));
      if (val > total) total = val;
    }
    
    // Check for tax
    const taxMatch = line.match(taxRegex);
    if (taxMatch) {
      tax = parseFloat(taxMatch[1].replace(',', '.'));
    }

    // Attempt to parse item lines: "item name [optional code] amount" or similar
    // Match line ending in a price like: "item desc $12.34" or "item desc 12.34"
    const priceMatch = line.match(/(.+?)[\s$€£:-]+(\d+[.,]\d{2})\s*(?:[A-Z])?$/);
    if (priceMatch) {
      const nameCandidate = priceMatch[1].trim();
      const priceVal = parseFloat(priceMatch[2].replace(',', '.'));
      
      // Filter out total/tax/subtotal lines from being listed as individual items
      const isHeaderOrFooter = /subtotal|tax|total|due|change|cash|visa|mastercard|card|tender|paid|cashier|items|phone|tel|invoice/i.test(nameCandidate);
      
      if (!isHeaderOrFooter && priceVal > 0) {
        items.push({
          name: nameCandidate,
          price: priceVal
        });
      }
    }
  }

  // If we couldn't parse a total but have items, let's sum them plus tax
  if (total === 0 && items.length > 0) {
    total = items.reduce((sum, item) => sum + item.price, 0) + tax;
  }

  // Auto-categorize
  const category = autoCategorize(merchant, items, rawText);

  return {
    merchant: merchant || "Receipt Purchase",
    items,
    tax: Number(tax.toFixed(2)),
    amount: Number(total.toFixed(2)),
    category,
    date: new Date().toISOString().split('T')[0],
  };
}
