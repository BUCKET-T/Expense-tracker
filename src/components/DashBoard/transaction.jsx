import { useState, useMemo, useContext } from 'react';
import { TransactionContext } from '../../context/TransactionContext'; 
import './transaction.css';
import supabase from "../../config/supabaseClient"; // Ensure path is correct!
import { ThemeContext } from '../../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export default function Transaction() {
  const { transactions, addTransaction, deleteTransaction } = useContext(TransactionContext);
  
  const todayForInput = new Date().toISOString().split('T')[0];

  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: null });
  
  const [newExpense, setNewExpense] = useState({ 
    desc: '', 
    subDesc: '', 
    category: 'Payroll & HR', 
    method: 'Card', 
    amount: '',
    date: todayForInput 
  });

  // Safely check for description without crashing
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const textToSearch = t.description || t.desc || '';
      const matchesSearch = textToSearch.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [transactions, searchTerm, filterCategory]);

  const totalExpenses = filteredTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalCount = filteredTransactions.length;
  const averagePerDay = totalCount > 0 ? Math.round(totalExpenses / 30) : 0; 
  const highestExpense = totalCount > 0 ? Math.max(...filteredTransactions.map(t => Number(t.amount))) : 0;

  // INTEGRATED: Save to Supabase
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.desc || !newExpense.amount || !newExpense.date) return;

    // Format the payload exactly as Supabase 
    const expenseToSave = {
      date: newExpense.date, 
      description: newExpense.desc,
      category: newExpense.category,
      method: newExpense.method,
      amount: Number(newExpense.amount)
    };

    // 1. Send to Supabase
    const { data, error } = await supabase
      .from('transactions')
      .insert([expenseToSave])
      .select();

    if (error) {
      console.error("Error saving to Supabase:", error);
      alert("Failed to save transaction.");
      return;
    }

    // 2. Update local UI state
    if (data) {
      addTransaction(data[0]); 
    }

    setIsAddModalOpen(false);
    setNewExpense({ desc: '', subDesc: '', category: 'Food', method: 'Card', amount: '', date: todayForInput });
  };

  const initiateDelete = (id) => {
    setDeleteConfirmation({ isOpen: true, id: id });
  };

  // INTEGRATED: Delete from Supabase
  const confirmDelete = async () => {
    if (deleteConfirmation.id) {
      // 1. Tell Supabase to delete it
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', deleteConfirmation.id); 

      if (error) {
        console.error("Error deleting from Supabase:", error);
        alert("Failed to delete transaction.");
        return;
      }

      // 2. Update local UI state to remove it from the screen
      deleteTransaction(deleteConfirmation.id);
    }
    // Close modal and reset ID
    setDeleteConfirmation({ isOpen: false, id: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, id: null });
  };

  return (
    <div className={`tx-wrapper fade-in ${isDarkTheme ? 'dark-theme' : ''}`}>
      {/* Header & Controls */}
      <div className="tx-header">
        <div>
          <h1 className="tx-title">Transactions</h1>
          <p className="tx-subtitle">View and manage all your expenses in one place.</p>
        </div>
        <div className="tx-controls">
          <input 
            type="text" 
            placeholder="Search transactions..." 
            className="tx-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="tx-filter" 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Payroll & HR">Payroll & HR</option>
            <option value="Facilities & Overhead">Facilities & Overhead</option>
            <option value="Technology & IT">Technology & Infrastructure</option>
            <option value="Travel & Entertainment (T&E)">Travel & Entertainment (T&E)</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Professional Fees">Professional Fees</option>
            <option value="COGS & Logistics">COGS & Logistics</option>
            <option value="Others">Others</option>
          </select>

          <button className="icon-btn" aria-label="Toggle Theme" onClick={toggleTheme} style={{ padding: '10px', height: '100%' }}>
            {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn-rark" onClick={() => setIsAddModalOpen(true)}>+ Add Expense</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="tx-summary-grid">
        <div className="tx-summary-card">
          <p>Total Expenses</p>
          <h3>₦{totalExpenses.toLocaleString()}</h3>
        </div>
        <div className="tx-summary-card">
          <p>Average per Day</p>
          <h3>₦{averagePerDay.toLocaleString()}</h3>
        </div>
        <div className="tx-summary-card">
          <p>Total Transactions</p>
          <h3>{totalCount}</h3>
        </div>
        <div className="tx-summary-card">
          <p>Highest Expense</p>
          <h3>₦{highestExpense.toLocaleString()}</h3>
        </div>
      </div>

      {/* Data Table */}
      <div className="tx-table-container">
        <table className="tx-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Payment Method</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>
                  {/* FIXED: Uses t.description OR t.desc depending on data source */}
                  <div className="tx-desc">{t.description || t.desc}</div>
                  <div className="tx-subdesc">{t.subDesc}</div>
                </td>
                <td>
                  <span className={`badge category-${t.category ? t.category.toLowerCase() : 'others'}`}>
                    {t.category}
                  </span>
                </td>
                <td>
                  <span className={`badge method-${t.method ? t.method.toLowerCase() : 'card'}`}>
                    {t.method}
                  </span>
                </td>
                <td className="tx-amount">-₦{Number(t.amount).toLocaleString()}</td>
                
                <td className="tx-action-cell">
                  <button 
                    className="delete-btn" 
                    onClick={() => initiateDelete(t.id)}
                    title="Delete Transaction"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="6" className="tx-empty">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- ADD EXPENSE MODAL --- */}
      {isAddModalOpen && (
        <div className="tx-modal-overlay">
          <div className="tx-modal">
            <h2>Add New Expense</h2>
            <form onSubmit={handleAddExpense}>
              
              <input 
                type="date" 
                required 
                value={newExpense.date} 
                onChange={e => setNewExpense({...newExpense, date: e.target.value})} 
                className="tx-input" 
              />

              <input type="text" placeholder="Description (e.g. KFC)" required value={newExpense.desc} onChange={e => setNewExpense({...newExpense, desc: e.target.value})} className="tx-input" />
              <input type="text" placeholder="Note (optional)" value={newExpense.subDesc} onChange={e => setNewExpense({...newExpense, subDesc: e.target.value})} className="tx-input" />
              
              <div className="tx-modal-row">
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="tx-input">
                  <option value="Payroll & Human Resources">Payroll & Human Resources</option>
                    <option value="Facilities & Overhead">Facilities & Overhead</option>
                    <option value="Technology & Infrastructure">Technology & Infrastructure</option>
                    <option value="Travel & Entertainment (T&E)">Travel & Entertainment (T&E)</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Professional Fees & Compliance">Professional Fees & Compliance</option>
                    <option value="Cost of Goods Sold (COGS) & Logistics">Cost of Goods Sold (COGS) & Logistics</option>
                    <option value="Others">Others</option>
                </select>
                <select value={newExpense.method} onChange={e => setNewExpense({...newExpense, method: e.target.value})} className="tx-input">
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Transfer">Bank Transfer</option>
                </select>
              </div>
              
              <input type="number" placeholder="Amount (₦)" required value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="tx-input" />
              
              <div className="tx-modal-actions">
                <button type="button" className="btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-rark">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteConfirmation.isOpen && (
        <div className="tx-modal-overlay">
          <div className="tx-modal confirmation-modal">
            <h2 style={{ color: '#ef4444', marginBottom: '8px' }}>Confirm Deletion</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="tx-modal-actions">
              <button type="button" className="btn-outline" onClick={cancelDelete}>
                Cancel
              </button>
              
              <button type="button" className="btn-danger" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}