import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { TransactionContext } from '../../context/TransactionContext';
import supabase from "../../config/supabaseClient";
import { Link } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, Tooltip 
} from 'recharts';
import { 
  Wallet, TrendingUp, PieChart as PieIcon, Target, Moon, 
  Sun,  ArrowUpRight, ArrowDownRight, ArrowRight,
  Laptop, User, RefreshCw, Megaphone, CheckCircle2,
  Briefcase, Plane, ShoppingCart, FileText,
  AlertTriangle, Settings, ShieldAlert, Search, Calendar, ChevronDown
} from 'lucide-react';
import './dashboardOverview.css';
import { ThemeContext } from '../../context/ThemeContext';

const CATEGORY_COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#cbd5e1'];

const getCategoryStyling = (category) => {
  switch (category) {
    case 'Technology & IT': return { icon: Laptop, bg: '#e0e7ff', color: '#4338ca' };
    case 'Payroll & HR': return { icon: User, bg: '#ffedd5', color: '#c2410c' };
    case 'Sales & Marketing': return { icon: Megaphone, bg: '#dcfce7', color: '#15803d' };
    case 'Facilities & Overhead': return { icon: Briefcase, bg: '#f3e8ff', color: '#7e22ce' };
    case 'Travel & Entertainment (T&E)': return { icon: Plane, bg: '#e0f2fe', color: '#0369a1' };
    case 'Professional Fees': return { icon: FileText, bg: '#fce7f3', color: '#be185d' };
    case 'COGS & Logistics': return { icon: ShoppingCart, bg: '#fef3c7', color: '#b45309' };
    default: return { icon: RefreshCw, bg: '#f1f5f9', color: '#64748b' };
  }
};

export default function DashboardOverview() {
  const { transactions, addTransaction, setTransactions } = useContext(TransactionContext);
  const todayForInput = new Date().toISOString().split('T')[0];
  const { isDarkTheme, toggleTheme } = useContext(ThemeContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const [userProfile, setUserProfile] = useState({
    username: 'User',
    avatarUrl: null
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [formError, setFormError] = useState('');

  const [budgetLimit, setBudgetLimit] = useState(1500000);
  const [budgetDescription, setBudgetDescription] = useState(
    'Standard operational spending cap. Single expenses over ₦250k require VP sign-off.'
  );

  const [formData, setFormData] = useState({
    desc: '',
    amount: '',
    category: 'Payroll & HR',
    method: 'Card',
    date: todayForInput
  });

  useEffect(() => {
  document.title = "Dashboard Overview | E-Tracker";
}, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (user && !authError) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setUserProfile({
            username: profile.username || profile.full_name?.split(' ')[0] || 'User',
            avatarUrl: profile.avatar_url
          });
        }
      }
    };
    
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
      } else if (setTransactions) {
        setTransactions(data);
      }
    };

    fetchTransactions();
  }, [setTransactions]);

  const totalExpenses = useMemo(() => {
    return transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  const avgExpense = useMemo(() => {
    return transactions.length > 0 ? Math.round(totalExpenses / transactions.length) : 0;
  }, [transactions, totalExpenses]);

  const filteredSearchTransactions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return transactions.filter(t => 
      (t.description || t.desc || '').toLowerCase().includes(query) ||
      (t.category || '').toLowerCase().includes(query) ||
      (t.method || '').toLowerCase().includes(query) ||
      String(t.amount).includes(query) ||
      (t.date || '').includes(query)
    );
  }, [transactions, searchQuery]);

  const budgetUsagePercent = Math.min(100, Math.round((totalExpenses / budgetLimit) * 100));

  const getBudgetColor = (percent) => {
    if (percent < 60) return '#10b981'; 
    if (percent < 85) return '#f59e0b'; 
    return '#ef4444'; 
  };

  const budgetColor = getBudgetColor(budgetUsagePercent);
  const isBudgetExhausted = totalExpenses >= budgetLimit;
  const recentTransactions = transactions.slice(0, 5);

  const categoryDataEnhanced = useMemo(() => {
    const totals = {};
    transactions.forEach(t => {
      const cat = t.category || 'Others';
      totals[cat] = (totals[cat] || 0) + Number(t.amount);
    });
    
    return Object.keys(totals)
      .map((key, index) => ({
        name: key,
        value: totals[key],
        percentage: totalExpenses > 0 ? ((totals[key] / totalExpenses) * 100).toFixed(1) + '%' : '0%',
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value); 
  }, [transactions, totalExpenses]);

  const trendData = useMemo(() => {
    const grouped = transactions.reduce((acc, t) => {
      acc[t.date] = (acc[t.date] || 0) + Number(t.amount);
      return acc;
    }, {});
    
    return Object.keys(grouped)
      .sort()
      .slice(-30)
      .map(dateStr => ({
        date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: grouped[dateStr]
      }));
  }, [transactions]);

  const topCategory = categoryDataEnhanced[0] || { name: 'N/A', percentage: '0%' };
  const lowestCategory = categoryDataEnhanced[categoryDataEnhanced.length - 1] || { name: 'N/A', percentage: '0%' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const newAmount = Number(formData.amount);
    if (!newAmount || !formData.desc || !formData.date) return;

    if (totalExpenses + newAmount > budgetLimit) {
      setFormError(
        `Expense Blocked: Adding ₦${newAmount.toLocaleString()} exceeds your monthly cap of ₦${budgetLimit.toLocaleString()}.`
      );
      return;
    }

    const newExpense = {
      date: formData.date,
      description: formData.desc,
      category: formData.category,
      method: formData.method,
      amount: newAmount
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([newExpense])
      .select();

    if (error) {
      console.error("Error saving to Supabase:", error);
      alert("Failed to save transaction.");
      return;
    }

    if (data) {
      addTransaction(data[0]); 
    }

    setFormData({ desc: '', amount: '', category: 'Payroll & HR', method: 'Card', date: todayForInput });
    setShowAddForm(false);
  };

  return (
    <div className={`dashboard-wrapper fade-in ${isDarkTheme ? 'dark-theme' : ''}`}>
      
      {/* --- Top Navbar Header Section --- */}
      <div className="dash-top-bar">
        
        {/* Search Bar */}
        <div ref={searchRef} className="search-container">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search transactions, tags, vendors..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear-btn">
                ✕
              </button>
            )}
          </div>

          {/* Live Search Dropdown */}
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div className="search-dropdown">
              <div className="search-dropdown-label">
                Matching Results ({filteredSearchTransactions.length})
              </div>
              {filteredSearchTransactions.length > 0 ? (
                filteredSearchTransactions.map((tx) => {
                  const style = getCategoryStyling(tx.category);
                  const IconComp = style.icon;
                  return (
                    <div 
                      key={tx.id || Math.random()} 
                      onClick={() => setIsSearchOpen(false)}
                      className="search-dropdown-item"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IconComp size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: isDarkTheme ? '#f8fafc' : '#1e293b' }}>
                            {tx.description || tx.desc}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {tx.category} • {tx.method} • {tx.date}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: isDarkTheme ? '#f8fafc' : '#0f172a' }}>
                        -₦{Number(tx.amount).toLocaleString()}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                  No matching transactions found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Toolbar: Add Expense FIRST, then All Time Filter */}
        <div className="dash-actions">
          {/* 1. Add Expense Button FIRST */}
          <button 
            className={`btn-add-primary ${isBudgetExhausted ? 'btn-disabled' : ''}`} 
            onClick={() => { setFormError(''); setShowAddForm(true); }}
            title={isBudgetExhausted ? 'Budget Limit Reached' : 'Add Expense'}
          >
            +
          </button>

          {/* 2. All Time Filter Dropdown SECOND */}
          <div className="filter-select-wrapper">
            <Calendar size={16} className="filter-icon" />
            <select className="date-picker-select" defaultValue="All Time">
              <option value="All Time">All Time</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
            </select>
            <ChevronDown size={14} className="filter-chevron" />
          </div>

          {/* 3. Theme Toggle Button */}
          <button 
            className="icon-btn" 
            aria-label="Toggle Theme"
            onClick={toggleTheme}
          >
            {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* 4. User Avatar Button */}
          <div 
            className="avatar-icon-btn"
            title={`${userProfile.username}'s Profile`}
          >
            {userProfile.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt={`${userProfile.username}'s avatar`} />
            ) : (
              userProfile.username.charAt(0).toUpperCase()
            )}
          </div>
        </div>
      </div>

      {/* --- Page Header Greeting --- */}
      <header className="dash-header">
        <div>
          <h1 className="dash-greeting">Welcome back, {userProfile.username}!</h1>
          <p className="dash-subtext">Real-time financial telemetry, enterprise budget limits, and expense distribution.</p>
        </div>
      </header>

      {/* --- Over Budget Warning Banner --- */}
      {isBudgetExhausted && (
        <div style={{
          backgroundColor: '#fef2f2', 
          borderLeft: '4px solid #ef4444', 
          padding: '12px 16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#991b1b'
        }}>
          <ShieldAlert size={22} color="#ef4444" />
          <div style={{ fontSize: '14px' }}>
            <strong>Monthly Budget Limit Reached!</strong> New expense submissions are restricted until existing expenses are reduced or the limit is raised.
          </div>
        </div>
      )}

      {/* --- Top KPI Cards --- */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-head">
            <div className="kpi-icon-box" style={{ background: '#fce7f3', color: '#be185d' }}><Wallet size={20} /></div>
            <span className="kpi-title">Total Expenses</span>
          </div>
          <div className="kpi-value">₦{totalExpenses.toLocaleString()}</div>
          <div className="kpi-trend trend-purple"><ArrowUpRight size={14} /> Tracking live</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-head">
            <div className="kpi-icon-box" style={{ background: '#dcfce7', color: '#15803d' }}><TrendingUp size={20} /></div>
            <span className="kpi-title">Total Transactions</span>
          </div>
          <div className="kpi-value">{transactions.length}</div>
          <div className="kpi-trend trend-green"><ArrowUpRight size={14} /> Active ledger</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-head">
            <div className="kpi-icon-box" style={{ background: '#ffedd5', color: '#c2410c' }}><PieIcon size={20} /></div>
            <span className="kpi-title">Average Expense</span>
          </div>
          <div className="kpi-value">₦{avgExpense.toLocaleString()}</div>
          <div className="kpi-trend trend-red"><ArrowDownRight size={14} /> Per transaction</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-head" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="kpi-icon-box" style={{ background: '#e0f2fe', color: '#0369a1' }}><Target size={20} /></div>
              <span className="kpi-title">Budget Usage</span>
            </div>
            <button 
              onClick={() => setShowBudgetModal(true)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              title="Configure Budget Policy"
            >
              <Settings size={16} />
            </button>
          </div>

          <div className="kpi-value" style={{ color: budgetColor }}>
            {budgetUsagePercent}%
          </div>

          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ 
                width: `${budgetUsagePercent}%`, 
                backgroundColor: budgetColor,
                transition: 'width 0.4s ease, background-color 0.4s ease'
              }}
            ></div>
          </div>

          <span className="budget-subtext">₦{totalExpenses.toLocaleString()} of ₦{budgetLimit.toLocaleString()}</span>
          
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', lineHeight: '1.3' }}>
            📋 {budgetDescription}
          </p>
        </div>
      </div>

      {/* --- Middle Charts Grid --- */}
      <div className="charts-grid">
        <div className="card-panel">
          <div className="card-header">
            <h3>Expenses by Category</h3>
          </div>
          {categoryDataEnhanced.length > 0 ? (
            <div className="donut-content">
              <div className="donut-chart-wrapper">
                <PieChart width={190} height={190}>
                  <Pie 
                    data={categoryDataEnhanced} 
                    innerRadius={62} 
                    outerRadius={84} 
                    dataKey="value" 
                    paddingAngle={3}
                  >
                    {categoryDataEnhanced.map((item, index) => (
                      <Cell key={index} fill={item.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="donut-center-text">
                  <span className="donut-amount">₦{(totalExpenses/1000).toFixed(0)}k</span>
                  <span className="donut-label">Total</span>
                </div>
              </div>
              <ul className="category-legend">
                {categoryDataEnhanced.slice(0, 5).map((cat, idx) => (
                  <li key={idx} className="legend-item">
                    <span className="dot-indicator" style={{ backgroundColor: cat.color }}></span>
                    <span className="cat-name">{cat.name}</span>
                    <span className="cat-amount">₦{cat.value.toLocaleString()}</span>
                    <span className="cat-percent">{cat.percentage}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>No data available to chart.</div>
          )}
        </div>

        <div className="card-panel">
          <div className="card-header">
            <h3>Expenses Overview (Last 30 Active Days)</h3>
          </div>
          <div className="line-chart-wrapper">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `₦${(val/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                  <Area type="monotone" dataKey="amount" stroke="#0c0c0e" strokeWidth={3} fill="url(#purpleGradient)" dot={{ r: 4, fill: '#6366f1' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ padding: '80px 0', textAlign: 'center', color: '#94a3b8' }}>No trend data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* --- Bottom Row Grid --- */}
      <div className="bottom-grid">
        <div className="card-panel">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <Link className="card-link" to="/dashboard/transactions" >View All <ArrowRight size={14} /> </Link>
          </div>
          <div className="tx-list">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => {
                const style = getCategoryStyling(tx.category);
                const IconComp = style.icon;
                return (
                  <div key={tx.id || Math.random()} className="tx-item">
                    <div className="tx-left">
                      <div className="tx-icon" style={{ backgroundColor: style.bg, color: style.color }}>
                        <IconComp size={18} />
                      </div>
                      <div className="tx-info">
                        <span className="tx-title">{tx.description || tx.desc}</span>
                        <span className="tx-cat">{tx.category || 'Others'} • {tx.method}</span>
                      </div>
                    </div>
                    <div className="tx-right">
                      <span className="tx-date">{tx.date}</span>
                      <span className="tx-amount">-₦{Number(tx.amount).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No recent transactions.</div>
            )}
          </div>
        </div>

        <div className="card-panel">
          <div className="card-header">
            <h3>Spending Insights</h3>
          </div>
          <div className="insight-banner">
            <div className="insight-banner-left">
              <div className="insight-icon"><CheckCircle2 size={22} /></div>
              <div>
                <h4>Ledger Active</h4>
                <p>Dashboard is actively syncing with Supabase</p>
              </div>
            </div>
          </div>
          <div className="insight-tiles-grid">
            <div className="insight-tile">
              <span className="tile-label">Highest spending</span>
              <span className="tile-value" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{topCategory.name}</span>
              <span className="tile-highlight">{topCategory.percentage}</span>
            </div>
            <div className="insight-tile">
              <span className="tile-label">Lowest spending</span>
              <span className="tile-value" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{lowestCategory.name}</span>
              <span className="tile-highlight">{lowestCategory.percentage}</span>
            </div>
            <div className="insight-tile">
              <span className="tile-label">Total Logs</span>
              <span className="tile-value">Transactions</span>
              <span className="tile-highlight">{transactions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Add Quick Expense Modal --- */}
      {showAddForm && (
        <div className="db-modal-overlay">
          <div className="db-modal-card">
            <div className="db-modal-header">
              <h2>Add Quick Expense</h2>
              <button className="db-modal-close" onClick={() => setShowAddForm(false)}>&times;</button>
            </div>

            {formError && (
              <div style={{
                backgroundColor: '#fef2f2', 
                border: '1px solid #fca5a5', 
                color: '#991b1b', 
                padding: '10px 14px', 
                borderRadius: '6px', 
                marginBottom: '15px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="db-modal-form">
              <div className="db-form-row">
                <div className="db-form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required 
                  />
                </div>
                <div className="db-form-group">
                  <label>Amount (₦)</label>
                  <input 
                    type="number" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00" 
                    required 
                  />
                </div>
              </div>

              <div className="db-form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  value={formData.desc}
                  onChange={(e) => setFormData({...formData, desc: e.target.value})}
                  placeholder="e.g., Bonuses & Commissions" 
                  required 
                />
              </div>

              <div className="db-form-row">
                <div className="db-form-group">
                  <label>Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Payroll & HR">Payroll & HR</option>
                    <option value="Facilities & Overhead">Facilities & Overhead</option>
                    <option value="Technology & IT">Technology & Infrastructure</option>
                    <option value="Travel & Entertainment (T&E)">Travel & Entertainment (T&E)</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Professional Fees">Professional Fees</option>
                    <option value="COGS & Logistics">COGS & Logistics</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="db-form-group">
                  <label>Payment Method</label>
                  <select 
                    value={formData.method}
                    onChange={(e) => setFormData({...formData, method: e.target.value})}
                  >
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="db-modal-actions">
                <button type="button" className="db-btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="db-btn-primary">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Configure Budget Limit Modal --- */}
      {showBudgetModal && (
        <div className="db-modal-overlay">
          <div className="db-modal-card">
            <div className="db-modal-header">
              <h2>Organization Budget Controls</h2>
              <button className="db-modal-close" onClick={() => setShowBudgetModal(false)}>&times;</button>
            </div>
            
            <div className="db-modal-form">
              <div className="db-form-group">
                <label>Monthly Spending Limit (₦)</label>
                <input 
                  type="number" 
                  value={budgetLimit} 
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                  required 
                />
              </div>

              <div className="db-form-group">
                <label>Policy & Description Guidance</label>
                <textarea 
                  rows="3"
                  value={budgetDescription} 
                  onChange={(e) => setBudgetDescription(e.target.value)}
                  placeholder="Describe approval rules or purpose for this limit..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div className="db-modal-actions">
                <button className="db-btn-primary" onClick={() => setShowBudgetModal(false)}>
                  Apply Controls
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}