import { useState, useEffect } from 'react'
import Summary from './components/Summary'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import ExpenseChart from './components/ExpenseChart'
import { CATEGORIES } from './constants'
import './App.css'

const DEFAULT_TRANSACTIONS = [
  { id: 1, description: "Salary", amount: 5000, type: "income", category: "salary", date: "2025-01-01" },
  { id: 2, description: "Rent", amount: 1200, type: "expense", category: "housing", date: "2025-01-02" },
  { id: 3, description: "Groceries", amount: 150, type: "expense", category: "food", date: "2025-01-03" },
  { id: 4, description: "Freelance Work", amount: 800, type: "income", category: "salary", date: "2025-01-05" },
  { id: 5, description: "Electric Bill", amount: 95, type: "expense", category: "utilities", date: "2025-01-06" },
  { id: 6, description: "Dinner Out", amount: 65, type: "expense", category: "food", date: "2025-01-07" },
  { id: 7, description: "Gas", amount: 45, type: "expense", category: "transport", date: "2025-01-08" },
  { id: 8, description: "Netflix", amount: 15, type: "expense", category: "entertainment", date: "2025-01-10" },
];

function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("transactions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Sanitize loaded transactions (fix Freelance Work type bug and convert amount strings to numbers)
          return parsed.map(t => {
            let updatedType = t.type;
            if (t.id === 4 && t.description === "Freelance Work" && t.type === "expense") {
              updatedType = "income";
            }
            return {
              ...t,
              amount: Number(t.amount || 0),
              type: updatedType
            };
          });
        }
      } catch (e) {
        console.error("Error parsing local storage transactions", e);
      }
    }
    return DEFAULT_TRANSACTIONS;
  });

  // Toasts
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const showToast = (message, toastType = "success") => {
    setToast({ message, type: toastType });
    setTimeout(() => setToast(null), 3000);
  };

  // Calculations needed for local Expense Analysis rendering
  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Category Breakdown for Expenses
  const expensesByCategory = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      const val = t.amount;
      acc[t.category] = (acc[t.category] || 0) + val;
      return acc;
    }, {});

  // Form submission handler callback
  const handleAddTransaction = (newTx) => {
    const transaction = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      ...newTx,
    };

    setTransactions([transaction, ...transactions]);
    showToast("Transaction added successfully!");
  };

  // Deletion handler callback
  const handleDeleteTransaction = (id) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    setTransactions(transactions.filter(t => t.id !== id));
    showToast(
      `Deleted "${transactionToDelete?.description || 'transaction'}"`,
      "info"
    );
  };

  return (
    <div className="app">
      <header>
        <h1>SpendWise</h1>
        <p className="subtitle">Track your wealth, control your expenses</p>
      </header>

      {/* Summary dashboard component */}
      <Summary transactions={transactions} />

      {/* Main interaction grid */}
      <div className="dashboard-grid">
        {/* Left column: input form & statistics breakdown */}
        <div className="left-panel-group">
          <TransactionForm 
            onAddTransaction={handleAddTransaction} 
            onShowToast={showToast} 
          />

          {/* Pure CSS Breakdown statistics */}
          {totalExpenses > 0 && (
            <section className="panel category-breakdown" aria-labelledby="breakdown-title">
              <h2 id="breakdown-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                Expense Analysis
              </h2>
              <ExpenseChart transactions={transactions} />
              <div className="breakdown-list">
                {CATEGORIES.map(cat => {
                  const amt = expensesByCategory[cat] || 0;
                  if (amt === 0) return null;
                  const pct = Math.round((amt / totalExpenses) * 100);
                  return (
                    <div key={cat} className="breakdown-item" id={`breakdown-cat-${cat}`}>
                      <div className="breakdown-info">
                        <span className="breakdown-name">{cat}</span>
                        <span className="breakdown-values">
                          ${amt.toLocaleString('en-US', { maximumFractionDigits: 2 })} ({pct}%)
                        </span>
                      </div>
                      <div className="breakdown-bar-bg" aria-hidden="true">
                        <div 
                          className={`breakdown-bar-fill bar-${cat}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right column: ledger list history component */}
        <TransactionList 
          transactions={transactions} 
          onDeleteTransaction={handleDeleteTransaction} 
        />
      </div>

      {/* Dynamic Action Toast Notifications */}
      {toast && (
        <div className={`toast toast-${toast.type || 'success'}`} role="alert" aria-live="polite">
          <span className="toast-icon" aria-hidden="true">
            {toast.type === 'info' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            )}
          </span>
          <p className="toast-message">{toast.message}</p>
          <div className="toast-progress" />
        </div>
      )}
    </div>
  );
}

export default App;
