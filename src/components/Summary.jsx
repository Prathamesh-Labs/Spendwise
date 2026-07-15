function Summary({ transactions }) {
  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  return (
    <section className="summary" aria-label="Financial Summary Dashboard">
      <div className="summary-card income-card">
        <div className="card-info">
          <span className="card-eyebrow">Active Cashflow</span>
          <h3>Income</h3>
          <p className="card-amount income-amount" id="total-income-val">
            ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
        </div>
      </div>
      
      <div className="summary-card expense-card">
        <div className="card-info">
          <span className="card-eyebrow">Total Outflow</span>
          <h3>Expenses</h3>
          <p className="card-amount expense-amount" id="total-expenses-val">
            ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
        </div>
      </div>

      <div className={`summary-card balance-card ${balance < 0 ? 'negative' : ''}`}>
        <div className="card-info">
          <span className="card-eyebrow">Stored Wealth</span>
          <h3>Net Balance</h3>
          <p className={`card-amount balance-amount ${balance < 0 ? 'negative' : ''}`} id="total-balance-val">
            {balance < 0 ? '-' : ''}${Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="18" y1="12" x2="18.01" y2="12"></line><line x1="2" y1="10" x2="22" y2="10"></line></svg>
        </div>
      </div>
    </section>
  );
}

export default Summary;
