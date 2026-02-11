import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../page/sidenav";

// Mock UI components
const Table = ({ children }) => <div className="table-container"><table className="table w-full">{children}</table></div>;
const TableHeader = ({ children }) => <thead>{children}</thead>;
const TableBody = ({ children }) => <tbody>{children}</tbody>;
const TableRow = ({ children, className }) => <tr className={className}>{children}</tr>;
const TableHead = ({ children, className }) => <th className={className}>{children}</th>;
const TableCell = ({ children, className }) => <td className={className}>{children}</td>;
const Input = ({ placeholder, value, onChange, className }) => (
  <input
    type="text"
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={className}
  />
);

const statusChip = (s) => {
  let className = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ";
  
  if (s === "performing") {
    className += "bg-emerald-50 text-emerald-700";
  } else if (s === "watchlist") {
    className += "bg-amber-50 text-amber-700";
  } else if (s === "default") {
    className += "bg-red-50 text-red-700";
  } else {
    className += "bg-gray-50 text-gray-700";
  }
  
  return className;
};

// Format currency - handles both numbers and formatted strings
const fmtUSD = (value) => {
  if (value == null || value === "") return "";
  
  // If it's already a string with $, return as is
  if (typeof value === 'string' && value.includes('$')) {
    return value;
  }
  
  const num = Number(value);
  if (isNaN(num)) return String(value);
  
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
};

// Format percentage - handles both numbers and formatted strings
const fmtPercent = (value) => {
  if (value == null || value === "") return "";
  
  // If it's already a string with %, return as is
  if (typeof value === 'string' && value.includes('%')) {
    return value;
  }
  
  const num = Number(value);
  if (isNaN(num)) return String(value);
  
  return `${num.toFixed(2)}%`;
};

// Format ratio - handles both numbers and formatted strings
const fmtRatio = (value) => {
  if (value == null || value === "") return "";
  
  // If it's already a string with x, return as is
  if (typeof value === 'string' && value.includes('x')) {
    return value;
  }
  
  const num = Number(value);
  if (isNaN(num)) return String(value);
  
  return `${num.toFixed(2)}x`;
};

// Format Excel serial dates and add relative text
const fmtDate = (d) => {
  if (d == null || d === "") return null;

  let date = null;
  
  // Handle Date objects
  if (d instanceof Date) {
    date = d;
  } else if (typeof d === 'number') {
    // Excel serial date
    if (d > 30000 && d < 60000) {
      date = new Date(1900, 0, d - 1);
    } else {
      date = new Date(d);
    }
  } else if (typeof d === 'string') {
    // Check if it's already formatted
    if (d.includes('/') || d.includes('-')) {
      date = new Date(d);
    } else {
      return d; // Return as-is if can't parse
    }
  }
  
  if (!date || isNaN(date.getTime())) return d; // Return original if can't parse

  const main = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const now = new Date();
  const diffDays = Math.floor((date.getTime() - now.getTime()) / 86400000);

  let rel = "";
  if (diffDays === 0) rel = "today";
  else if (diffDays === 1) rel = "tomorrow";
  else if (diffDays === -1) rel = "yesterday";
  else if (diffDays > 1) {
    rel = diffDays < 30 ? `in ${diffDays} days` : `in ${Math.round(diffDays / 30)} months`;
  } else {
    const a = Math.abs(diffDays);
    rel = a < 30 ? `${a} days ago` : `${Math.round(a / 30)} months ago`;
  }

  return { main, rel };
};

export default function LoansPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [allColumns, setAllColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  // Load imported data from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bynops_loans");
      if (!raw) {
        console.log("No loans found in localStorage");
        return;
      }
      
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        setRows(parsed);
        
        // Extract ALL unique columns from all loans
        const columnsSet = new Set();
        
        parsed.forEach(loan => {
          // Add standard loan fields
          Object.keys(loan).forEach(key => {
            if (!key.startsWith('_')) { // Skip internal fields
              columnsSet.add(key);
            }
          });
          
          // Also add raw data fields if they exist
          if (loan._rawData) {
            Object.keys(loan._rawData).forEach(key => {
              if (!key.startsWith('_')) {
                columnsSet.add(key);
              }
            });
          }
        });
        
        const columnsArray = Array.from(columnsSet);
        setAllColumns(columnsArray);
        
        // Default visible columns - REMOVED: id, riskScore, nextReviewAt
        // Now showing: loanNumber, propertyName, city, state, principalBalance, status, borrowerName, maturityDate, interestRate, propertyType, loanToValue, debtServiceCoverageRatio
        const defaultColumns = [
          'loanNumber',
          'propertyName',
          'city',
          'state',
          'principalBalance',
          'status',
          'borrowerName',
          'maturityDate',
          'interestRate',
          'propertyType',
          'loanToValue',
          'debtServiceCoverageRatio',
          'loanTerm'
        ].filter(col => columnsArray.includes(col)); // Only include columns that actually exist in the data
        
        setVisibleColumns(defaultColumns.slice(0, 15));
        console.log(`Loaded ${parsed.length} loans with ${columnsArray.length} unique columns`);
      }
    } catch (error) {
      console.error("Error loading loans from localStorage:", error);
    }
  }, []);

  // Search/filter
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    
    return rows.filter((loan) => {
      // Search in all string fields
      const searchableText = [
        loan.loanNumber || "",
        loan.propertyName || "",
        loan.city || "",
        loan.state || "",
        loan.borrowerName || "",
        loan.propertyType || "",
        loan.status || "",
      ].join(" ").toLowerCase();
      
      return searchableText.includes(t);
    });
  }, [q, rows]);

  // Summary KPIs
  const kpis = useMemo(() => {
    // Handle both raw numbers and formatted strings
    const total = rows.reduce((sum, r) => {
      const balance = r.principalBalance;
      if (balance == null) return sum;
      
      // If it's a string with $, remove $ and commas
      if (typeof balance === 'string') {
        const num = Number(balance.replace(/[$,]/g, ''));
        return sum + (isNaN(num) ? 0 : num);
      }
      
      // If it's a number
      return sum + (Number(balance) || 0);
    }, 0);
    
    const performing = rows.filter((r) => {
      const status = r.status;
      if (typeof status === 'string') {
        return status.toLowerCase() === 'performing';
      }
      return r.status === 'performing';
    }).length;
    
    const wl = rows.filter((r) => {
      const status = r.status;
      if (typeof status === 'string') {
        return status.toLowerCase() === 'watchlist';
      }
      return r.status === 'watchlist';
    }).length;
    
    const def = rows.filter((r) => {
      const status = r.status;
      if (typeof status === 'string') {
        return status.toLowerCase() === 'default' || status.toLowerCase().includes('default');
      }
      return r.status === 'default';
    }).length;
    
    const totalLoans = rows.length;
    
    return { 
      total, 
      performing, 
      wl, 
      def, 
      totalLoans,
      avgBalance: totalLoans > 0 ? total / totalLoans : 0
    };
  }, [rows]);

  // Navigation functions
  const navigateToImport = () => {
    window.location.href = "/import";
  };

  // Navigate to loan detail
// Navigate to loan detail - PASS THE ENTIRE LOAN OBJECT
const navigateToLoanDetail = (loan) => {
  // Find the full loan object from rows array using the loan number or id
  const fullLoan = rows.find(l => 
    (l.id && l.id === loan.id) || 
    (l.loanNumber && l.loanNumber === loan.loanNumber)
  ) || loan; // Fallback to the passed loan if not found
  
  localStorage.setItem("selected_loan_detail", JSON.stringify(fullLoan));
  window.location.href = `/dashboard?loan=${encodeURIComponent(fullLoan.id || fullLoan.loanNumber)}`;
};

  // Get display name for column
  const getColumnDisplayName = (column) => {
    const displayNames = {
      loanNumber: 'Loan #',
      propertyName: 'Property',
      city: 'City',
      state: 'State',
      principalBalance: 'Balance',
      status: 'Status',
      riskScore: 'Risk Score',
      nextReviewAt: 'Next Review',
      borrowerName: 'Borrower',
      maturityDate: 'Maturity Date',
      interestRate: 'Interest Rate',
      propertyType: 'Property Type',
      loanToValue: 'LTV',
      debtServiceCoverageRatio: 'DSCR',
      loanTerm: 'Loan Term',
      ownerName: 'Owner',
      propertyAddress: 'Address',
      buildingSqft: 'Square Feet',
      noi: 'NOI',
      annualDebtService: 'Annual Debt Service',
      tenants: 'Tenants Count'
    };
    
    return displayNames[column] || 
      column.replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
  };

  // Format cell value based on column type - UPDATED for non-parse import
  const formatCellValue = (loan, column) => {
    let value = loan[column];
    
    // If not found in main object, check _rawData
    if (value === undefined && loan._rawData) {
      value = loan._rawData[column];
    }
    
    if (value == null || value === '') {
      return <span className="text-gray-400 italic">-</span>;
    }
    
    // Special formatting for specific columns - but respect pre-formatted values
    if (column.includes('balance') || column.includes('amount') || 
        column.includes('noi') || column.includes('debt') || 
        column.includes('principal') || column.includes('value')) {
      return fmtUSD(value);
    }
    
    if (column === 'status' || column.toLowerCase().includes('status')) {
      const statusStr = String(value).toLowerCase();
      let status = 'performing';
      if (statusStr.includes('watch') || statusStr.includes('monitor')) status = 'watchlist';
      if (statusStr.includes('default') || statusStr.includes('delinquent')) status = 'default';
      
      return (
        <span className={statusChip(status)}>
          {String(value)}
        </span>
      );
    }
    
    if (column.includes('date') || column.includes('review') || column.includes('maturity') || column.includes('due')) {
      const dateInfo = fmtDate(value);
      if (dateInfo && typeof dateInfo === 'object') {
        return (
          <div className="whitespace-nowrap">
            <div>{dateInfo.main}</div>
            <div className="text-xs text-slate-400">{dateInfo.rel}</div>
          </div>
        );
      }
      // Return as-is if can't parse
      return String(value);
    }
    
    if (column.includes('rate') || column.includes('percentage') || column.includes('ltv')) {
      return fmtPercent(value);
    }
    
    if (column.includes('dscr') || column.includes('coverage')) {
      return fmtRatio(value);
    }
    
    if (column.includes('score') || column.includes('rating') || column.includes('risk')) {
      const num = Number(value);
      if (!isNaN(num)) {
        let color = 'text-gray-600';
        if (num >= 70) color = 'text-red-600 font-semibold';
        else if (num >= 50) color = 'text-amber-600';
        else if (num >= 30) color = 'text-emerald-600';
        return <span className={color}>{num}</span>;
      }
      return String(value);
    }
    
    if (column === 'tenants' && Array.isArray(value)) {
      return value.length;
    }
    
    // For boolean values
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // Default string representation - truncate if too long
    const str = String(value);
    if (str.length > 50) {
      return (
        <span title={str}>
          {str.substring(0, 47)}...
        </span>
      );
    }
    
    return str;
  };

  // Toggle column visibility - preserves original column order
  const toggleColumn = (column) => {
    if (visibleColumns.includes(column)) {
      setVisibleColumns(visibleColumns.filter(c => c !== column));
    } else {
      // Find the index of this column in allColumns
      const columnIndexInAllColumns = allColumns.indexOf(column);
      
      // Insert the column at its correct position based on allColumns order
      const newVisibleColumns = [...visibleColumns];
      
      // Find where to insert based on allColumns order
      let insertIndex = 0;
      for (let i = 0; i < newVisibleColumns.length; i++) {
        const currentColumnIndex = allColumns.indexOf(newVisibleColumns[i]);
        if (currentColumnIndex < columnIndexInAllColumns) {
          insertIndex = i + 1;
        }
      }
      
      newVisibleColumns.splice(insertIndex, 0, column);
      setVisibleColumns(newVisibleColumns);
    }
  };

  // Get all column values for a loan
  const getAllLoanData = (loan) => {
    const allData = { ...loan };
    if (loan._rawData) {
      Object.keys(loan._rawData).forEach(key => {
        if (!allData[key]) {
          allData[key] = loan._rawData[key];
        }
      });
    }
    return allData;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isColumnDropdownOpen && !e.target.closest('.column-dropdown')) {
        setIsColumnDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isColumnDropdownOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 overflow-hidden">
        <div className="p-4 lg:p-6 xl:p-8 w-full h-full overflow-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900">
                Loans
              </h1>
              <p className="text-slate-500 text-sm lg:text-base mt-1">
                {rows.length} loan{rows.length !== 1 ? 's' : ''} 
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Input
                placeholder="Search loans..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-64 lg:w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={navigateToImport}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition whitespace-nowrap"
              >
                + Import Data
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
            <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6 shadow-sm">
              <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                Total Balance
              </div>
              <div className="text-xl lg:text-2xl font-semibold truncate">
                {fmtUSD(kpis.total)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {kpis.totalLoans} loans
              </div>
            </div>
            <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6 shadow-sm">
              <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                Performing
              </div>
              <div className="text-xl lg:text-2xl font-semibold text-emerald-600">
                {kpis.performing}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {kpis.totalLoans > 0 ? Math.round((kpis.performing / kpis.totalLoans) * 100) : 0}% of portfolio
              </div>
            </div>
            <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6 shadow-sm">
              <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                Watchlist
              </div>
              <div className="text-xl lg:text-2xl font-semibold text-amber-600">
                {kpis.wl}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {kpis.totalLoans > 0 ? Math.round((kpis.wl / kpis.totalLoans) * 100) : 0}% of portfolio
              </div>
            </div>
            <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6 shadow-sm">
              <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                Default
              </div>
              <div className="text-xl lg:text-2xl font-semibold text-red-600">
                {kpis.def}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {kpis.totalLoans > 0 ? Math.round((kpis.def / kpis.totalLoans) * 100) : 0}% of portfolio
              </div>
            </div>
          </div>

          {/* Column Filter - Changed to Dropdown */}
          <div className="mb-4 p-4 bg-slate-50 rounded-lg column-dropdown relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-900">Visible Columns ({visibleColumns.length} of {allColumns.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setVisibleColumns(allColumns)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Show All
                </button>
                <button
                  onClick={() => setVisibleColumns([])}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Hide All
                </button>
                <button
                  onClick={() => setVisibleColumns([
                    'loanNumber',
                    'propertyName',
                    'city',
                    'state',
                    'principalBalance',
                    'status',
                    'borrowerName',
                    'maturityDate',
                    'interestRate',
                    'propertyType',
                    'loanToValue',
                    'debtServiceCoverageRatio',
                    'loanTerm'
                  ].filter(col => allColumns.includes(col)))}
                  className="text-xs text-slate-600 hover:text-slate-800"
                >
                  Default View
                </button>
              </div>
            </div>
            
            {/* Dropdown Button */}
            <button
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className="w-full px-3 py-2 text-left text-sm bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <span className="text-slate-700">Select columns to display...</span>
              <svg className={`w-5 h-5 text-slate-500 transition-transform ${isColumnDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isColumnDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-2">
                  <div className="flex flex-wrap gap-2">
                    {allColumns.map(column => (
                      <label key={column} className="inline-flex items-center p-1.5 hover:bg-slate-50 rounded w-full sm:w-auto cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(column)}
                          onChange={() => toggleColumn(column)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-xs text-slate-700">
                          {getColumnDisplayName(column)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Loans Table - Shows ALL columns */}
          <div className="rounded-xl lg:rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="px-4 py-3 text-slate-600 text-xs font-medium whitespace-nowrap sticky left-0 bg-slate-50 z-10">
                      Row
                    </TableHead>
                    {visibleColumns.map((column, index) => (
                      <TableHead 
                        key={column} 
                        className={`px-4 py-3 text-slate-600 text-xs font-medium whitespace-nowrap min-w-[120px] ${
                          index === 0 ? 'sticky left-12 bg-slate-50 z-10' : ''
                        }`}
                        title={column}
                      >
                        {getColumnDisplayName(column)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((loan, rowIndex) => {
                    const allData = getAllLoanData(loan);
                    return (
                      <TableRow
                        key={loan.id || loan.loanNumber}
                        className="border-b hover:bg-slate-50 transition-colors"
                      >
                        <TableCell className="px-4 py-3 text-xs text-slate-500 sticky left-0 bg-white z-5">
                          {rowIndex + 1}
                        </TableCell>
                        {visibleColumns.map((column, colIndex) => (
                          <TableCell 
                            key={`${loan.id}-${column}`} 
                            className={`px-4 py-3 text-xs text-slate-700 whitespace-nowrap min-w-[120px] ${
                              colIndex === 0 ? 'sticky left-12 bg-white z-5' : ''
                            }`}
                            title={allData[column] != null ? String(allData[column]) : ''}
                          >
                            {colIndex === 0 ? (
                              <button
                                onClick={() => navigateToLoanDetail(loan)}
                                className="text-blue-600 hover:text-blue-800 hover:underline text-left w-full text-start"
                              >
                                {formatCellValue(loan, column)}
                              </button>
                            ) : (
                              formatCellValue(loan, column)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}

                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length + 1} 
                        className="px-4 lg:px-6 py-12 text-center text-slate-500 text-sm">
                        {rows.length === 0 ? (
                          <div>
                            No loans found.{" "}
                            <button
                              onClick={navigateToImport}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Import your first data file
                            </button>
                          </div>
                        ) : (
                          "No loans match your search. Try a different search term."
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Summary Footer */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <div>
              Showing {filtered.length} of {rows.length} loan{rows.length !== 1 ? 's' : ''} • 
              {visibleColumns.length} of {allColumns.length} column{allColumns.length !== 1 ? 's' : ''} visible
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(rows, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `loans-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Export JSON
              </button>
              <button
                onClick={() => {
                  const headers = visibleColumns.map(getColumnDisplayName);
                  const csvRows = filtered.map(loan => 
                    visibleColumns.map(col => {
                      const val = loan[col] || (loan._rawData ? loan._rawData[col] : '');
                      return val != null ? `"${String(val).replace(/"/g, '""')}"` : '';
                    }).join(',')
                  );
                  const csv = [headers.join(','), ...csvRows].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `loans-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Export CSV
              </button>
              <button
                onClick={navigateToImport}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Import More Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Detail Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Loan Details: {selectedLoan.loanNumber}</h2>
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="text-slate-500 hover:text-slate-700 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-3">Loan Information</h3>
                  <div className="space-y-4">
                    {['loanNumber', 'propertyName', 'borrowerName', 'status', 'riskScore', 'propertyType'].map(field => (
                      <div key={field}>
                        <div className="text-xs text-slate-500 font-medium mb-1">{getColumnDisplayName(field)}</div>
                        <div className="text-sm text-slate-800">
                          {formatCellValue(selectedLoan, field)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-3">Financial Details</h3>
                  <div className="space-y-4">
                    {['principalBalance', 'interestRate', 'loanToValue', 'debtServiceCoverageRatio', 'loanTerm', 'maturityDate'].map(field => (
                      <div key={field}>
                        <div className="text-xs text-slate-500 font-medium mb-1">{getColumnDisplayName(field)}</div>
                        <div className="text-sm text-slate-800">
                          {formatCellValue(selectedLoan, field)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* All Data Section */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-medium text-slate-500 mb-3">All Data Fields</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                  {allColumns.map(field => {
                    const value = selectedLoan[field] || (selectedLoan._rawData ? selectedLoan._rawData[field] : null);
                    if (value == null) return null;
                    
                    return (
                      <div key={field} className="border rounded p-3">
                        <div className="text-xs text-slate-500 font-medium mb-1 truncate" title={field}>
                          {getColumnDisplayName(field)}
                        </div>
                        <div className="text-sm text-slate-800 break-words">
                          {String(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedLoan(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLoan(null);
                      navigateToLoanDetail(loan);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    View Full Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}