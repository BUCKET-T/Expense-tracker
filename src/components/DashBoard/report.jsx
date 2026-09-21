import React, { useState, useMemo, useContext } from 'react';
import { TransactionContext } from '../../context/TransactionContext'; 
import { ThemeContext } from '../../context/ThemeContext';
import './report.css';
import { useEffect } from 'react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Report() {
  useEffect(() => {
  document.title = "Report / Analytics  | E-Tracker";
}, []);

  const { transactions } = useContext(TransactionContext);
  const { isDarkTheme } = useContext(ThemeContext);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) return transactions;
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const start = startDate ? new Date(startDate) : new Date('2000-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-01-01');
      if (endDate) end.setHours(23, 59, 59, 999);
      return tDate >= start && tDate <= end;
    });
  }, [transactions, startDate, endDate]);

  // Monthly data calculation for line chart
  const monthlyData = useMemo(() => {
    const monthlyTotals = MONTH_NAMES.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});
    
    filteredTransactions.forEach(t => {
      const dateObj = new Date(t.date); 
      if (!isNaN(dateObj)) {
        const monthName = MONTH_NAMES[dateObj.getMonth()];
        if (monthlyTotals[monthName] !== undefined) {
          monthlyTotals[monthName] += Number(t.amount);
        }
      }
    });

    return MONTH_NAMES.map(name => ({
      month: name,
      total: monthlyTotals[name]
    })).filter(m => m.total > 0 || m.month === 'Jan'); 
  }, [filteredTransactions]);

  // Category data calculation for the new Bar Chart
  const categoryData = useMemo(() => {
    const catTotals = {};
    filteredTransactions.forEach(t => {
      const cat = t.category || 'Others';
      catTotals[cat] = (catTotals[cat] || 0) + Number(t.amount);
    });
    return Object.entries(catTotals).map(([category, total]) => ({ category, total }));
  }, [filteredTransactions]);

  const insights = useMemo(() => {
    if (filteredTransactions.length === 0 || monthlyData.length === 0) {
      return { highest: 'N/A', lowest: 'N/A', topCategory: 'N/A' };
    }

    let highestMonth = monthlyData[0];
    let lowestMonth = monthlyData[0];
    monthlyData.forEach(m => {
      if (m.total > highestMonth.total) highestMonth = m;
      if (m.total < lowestMonth.total) lowestMonth = m;
    });

    const catCounts = {};
    filteredTransactions.forEach(t => {
      catCounts[t.category] = (catCounts[t.category] || 0) + 1;
    });
    
    let topCategory = 'N/A';
    let maxCount = 0;
    Object.entries(catCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    });

    return {
      highest: `${highestMonth.month} (₦${highestMonth.total.toLocaleString()})`,
      lowest: `${lowestMonth.month} (₦${lowestMonth.total.toLocaleString()})`,
      topCategory
    };
  }, [monthlyData, filteredTransactions]);

  const chartHeight = 220;
  const chartWidth = 600;
  const padding = 45;

  const maxTotal = useMemo(() => {
    if (monthlyData.length === 0) return 10000;
    const max = Math.max(...monthlyData.map(d => d.total), 10000);
    return Math.ceil(max / 5000) * 5000; 
  }, [monthlyData]);

  const maxCategoryTotal = useMemo(() => {
    if (categoryData.length === 0) return 10000;
    const max = Math.max(...categoryData.map(d => d.total), 10000);
    return Math.ceil(max / 5000) * 5000;
  }, [categoryData]);

  const points = useMemo(() => {
    const totalPoints = monthlyData.length;
    return monthlyData.map((d, index) => {
      const denominator = totalPoints === 1 ? 1 : totalPoints - 1;
      const x = padding + (index / denominator) * (chartWidth - padding * 2);
      const y = chartHeight - padding - (d.total / maxTotal) * (chartHeight - padding * 2);
      return { x, y, ...d };
    });
  }, [monthlyData, maxTotal]);

  const linePath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const baseY = chartHeight - padding;
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [points, linePath]);

  return (
    <div className={`report-wrapper fade-in ${isDarkTheme ? 'dark-theme' : ''}`}>
      <div className="report-page-header">
        <div>
          <h1 className="report-title">Financial Reports</h1>
          <p className="report-subtitle">Analyze dynamic visual trends and breakdowns of your metrics.</p>
        </div>

        <div className="report-filter-container">
          <div className="report-date-group">
            <input 
              type="date" 
              className="report-date-input" 
              aria-label="Start Date"
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
            <span className="report-date-separator">to</span>
            <input 
              type="date" 
              className="report-date-input" 
              aria-label="End Date"
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="btn-clear-filter"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Analytics Insights Dashboard Grid */}
      <div className="report-insights-grid">
        <div className="insight-card">
          <div className="insight-icon icon-highest">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>
          </div>
          <div className="insight-content">
            <p className="insight-label">Highest Expense Month</p>
            <h3 className="insight-value">{insights.highest}</h3>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon icon-lowest">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" /></svg>
          </div>
          <div className="insight-content">
            <p className="insight-label">Lowest Expense Month</p>
            <h3 className="insight-value">{insights.lowest}</h3>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon icon-frequent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
          </div>
          <div className="insight-content">
            <p className="insight-label">Mostly Inputted Category</p>
            <h3 className="insight-value">{insights.topCategory}</h3>
          </div>
        </div>
      </div>

      {/* Charts Grid Container */}
      <div className="report-charts-grid">
        {/* Line Chart Panel */}
        <div className="report-chart-card">
          <div className="chart-card-header">
            <h2>Expense Progression Flow</h2>
            <span className="live-indicator"><span className="dot"></span>Real-Time Syncing</span>
          </div>
          <div className="svg-chart-container">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="svg-linear-graph">
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16161d" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                </linearGradient>
              </defs>
              {[0, 0.5, 1].map((ratio, i) => {
                const yVal = padding + ratio * (chartHeight - padding * 2);
                const textVal = Math.round(maxTotal - ratio * maxTotal);
                return (
                  <g key={i}>
                    <line x1={padding} y1={yVal} x2={chartWidth - padding} y2={yVal} className="chart-grid-line" />
                    <text x={padding - 12} y={yVal + 4} className="chart-axis-text axis-y">₦{textVal.toLocaleString()}</text>
                  </g>
                );
              })}
              <path d={areaPath} fill="url(#chartGlow)" />
              <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((p, i) => (
                <g key={i} className="chart-node-group">
                  <circle cx={p.x} cy={p.y} r="4" className="chart-data-node" />
                  <text x={p.x} y={chartHeight - 12} className="chart-axis-text axis-x">{p.month}</text>
                  <text x={p.x} y={p.y - 14} className="chart-node-tooltip">₦{p.total.toLocaleString()}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* NEW: Category Bar Chart Panel */}
        <div className="report-chart-card">
          <div className="chart-card-header">
            <h2>Category Breakdown</h2>
            <span className="live-indicator"><span className="dot"></span>Expenses by Category</span>
          </div>
          <div className="svg-chart-container">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="svg-linear-graph">
              {[0, 0.5, 1].map((ratio, i) => {
                const yVal = padding + ratio * (chartHeight - padding * 2);
                const textVal = Math.round(maxCategoryTotal - ratio * maxCategoryTotal);
                return (
                  <g key={i}>
                    <line x1={padding} y1={yVal} x2={chartWidth - padding} y2={yVal} className="chart-grid-line" />
                    <text x={padding - 12} y={yVal + 4} className="chart-axis-text axis-y">₦{textVal.toLocaleString()}</text>
                  </g>
                );
              })}

              {/* Bar Elements */}
              {categoryData.map((d, index) => {
                const totalBars = categoryData.length || 1;
                const availableWidth = chartWidth - padding * 2;
                const barWidth = Math.max(12, Math.min(36, (availableWidth / totalBars) * 0.6));
                const spacing = availableWidth / totalBars;
                const x = padding + index * spacing + (spacing - barWidth) / 2;
                
                const barHeight = (d.total / maxCategoryTotal) * (chartHeight - padding * 2);
                const y = chartHeight - padding - barHeight;

                return (
                  <g key={index} className="chart-bar-group">
                    <rect 
                      x={x} 
                      y={y} 
                      width={barWidth} 
                      height={barHeight} 
                      rx="4" 
                      className="chart-bar-rect" 
                    />
                    <text 
                      x={x + barWidth / 2} 
                      y={chartHeight - 12} 
                      className="chart-axis-text axis-x" 
                      textAnchor="middle"
                    >
                      {d.category.length > 8 ? `${d.category.substring(0, 7)}...` : d.category}
                    </text>
                    <text 
                      x={x + barWidth / 2} 
                      y={y - 8} 
                      className="chart-node-tooltip" 
                      textAnchor="middle"
                    >
                      ₦{d.total.toLocaleString()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}