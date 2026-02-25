import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../page/sidenav";
import { useAuth } from '../context/AuthContext';

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

export default function LoansPage() {
  const { userData } = useAuth();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [headers, setHeaders] = useState([]);
  
  // Property name filter state
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [tempSelectedProperties, setTempSelectedProperties] = useState([]);
  const [isPropertyFilterOpen, setIsPropertyFilterOpen] = useState(false);
  const [propertySearchTerm, setPropertySearchTerm] = useState("");

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
        
        // Get the original headers from the first loan's _headers array
        if (parsed[0]?._headers && Array.isArray(parsed[0]._headers)) {
          setHeaders(parsed[0]._headers);
        } else {
          // Fallback: extract unique column names
          const columnsSet = new Set();
          parsed.forEach(loan => {
            Object.keys(loan).forEach(key => {
              if (!key.startsWith('_')) {
                columnsSet.add(key);
              }
            });
          });
          setHeaders(Array.from(columnsSet));
        }
        
        console.log(`Loaded ${parsed.length} loans`);
      }
    } catch (error) {
      console.error("Error loading loans from localStorage:", error);
    }
  }, []);

  // Get unique property names
  const uniqueProperties = useMemo(() => {
    const properties = new Set();
    
    rows.forEach(loan => {
      // Try to find property name in various possible locations
      let propertyName = loan.propertyName || 
                        loan.property_name || 
                        loan.PropertyName ||
                        loan._rawData?.propertyName ||
                        loan._rawData?.property_name ||
                        loan._rawData?.PropertyName;
      
      // Also check _rawData with normalized headers
      if (!propertyName && loan._headers) {
        const propertyHeaderIndex = loan._headers.findIndex(h => 
          (typeof h === 'object' ? h.original : h).toLowerCase().includes('property name')
        );
        if (propertyHeaderIndex >= 0) {
          const headerObj = loan._headers[propertyHeaderIndex];
          const normalizedHeader = typeof headerObj === 'object' ? headerObj.normalized : 
            headerObj.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '_');
          propertyName = loan._rawData?.[normalizedHeader];
        }
      }
      
      if (propertyName && propertyName !== '') {
        properties.add(String(propertyName));
      }
    });
    
    return Array.from(properties).sort();
  }, [rows]);

  // Filtered property names based on search
  const filteredProperties = useMemo(() => {
    if (!propertySearchTerm) return uniqueProperties;
    return uniqueProperties.filter(p => 
      p.toLowerCase().includes(propertySearchTerm.toLowerCase())
    );
  }, [uniqueProperties, propertySearchTerm]);

  // Search/filter with property filter applied
  const filtered = useMemo(() => {
    // First apply property filter if any properties are selected
    let filteredRows = rows;
    
    if (selectedProperties.length > 0) {
      filteredRows = rows.filter(loan => {
        // Try to find property name in various possible locations
        let propertyName = loan.propertyName || 
                          loan.property_name || 
                          loan.PropertyName ||
                          loan._rawData?.propertyName ||
                          loan._rawData?.property_name ||
                          loan._rawData?.PropertyName;
        
        // Also check _rawData with normalized headers
        if (!propertyName && loan._headers) {
          const propertyHeaderIndex = loan._headers.findIndex(h => 
            (typeof h === 'object' ? h.original : h).toLowerCase().includes('property name')
          );
          if (propertyHeaderIndex >= 0) {
            const headerObj = loan._headers[propertyHeaderIndex];
            const normalizedHeader = typeof headerObj === 'object' ? headerObj.normalized : 
              headerObj.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '_');
            propertyName = loan._rawData?.[normalizedHeader];
          }
        }
        
        return propertyName && selectedProperties.includes(String(propertyName));
      });
    }
    
    // Then apply text search
    const t = q.trim().toLowerCase();
    if (!t) return filteredRows;
    
    return filteredRows.filter((loan) => {
      const searchableText = JSON.stringify(loan).toLowerCase();
      return searchableText.includes(t);
    });
  }, [q, rows, selectedProperties]);

  // Summary KPIs
// Summary KPIs - FIXED number conversion

// Format large numbers with B/M/T suffixes
const formatLargeNumber = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return value;
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1e9) {
    return (value / 1e9).toFixed(2) + 'B';
  } else {
    // Show regular number with commas for smaller values
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }
};

// In your KPI card, replace {kpis.total} with:

const kpis = useMemo(() => {
  const totalLoans = rows.length;
  
  let total = 0;
  rows.forEach(r => {
    const balance = r.principalBalance;
    console.log('Raw balance:', balance);
    
    if (balance != null && balance !== '') {
      // Handle different types of values
      let num;
      
      if (typeof balance === 'string') {
        // Remove $, commas, and any other non-numeric characters except decimal point
        // This handles "$1,234,567.89", "1,234,567", etc.
        const cleaned = balance.replace(/[^0-9.-]/g, '');
        console.log('Cleaned string:', cleaned);
        num = parseFloat(cleaned);
      } else if (typeof balance === 'number') {
        num = balance;
      } else {
        // Try to convert anything else
        num = parseFloat(String(balance));
      }
      
      console.log('Converted number:', num);
      
      if (!isNaN(num)) {
        total += num;
        console.log('Running total:', total);
      }
    }
  });
  
  console.log('Final total:', total);
  
  let performing = 0, wl = 0, def = 0;
  rows.forEach(r => {
    const status = r.status;
    if (status) {
      const statusStr = String(status).toLowerCase();
      if (statusStr.includes('perform')) performing++;
      else if (statusStr.includes('watch')) wl++;
      else if (statusStr.includes('default')) def++;
    }
  });
  
  return { total, performing, wl, def, totalLoans };
}, [rows]);

  // Navigation functions
  const navigateToImport = () => {
    window.location.href = "/import";
  };

  // Navigate to loan detail
  const navigateToLoanDetail = (loan) => {
    localStorage.setItem("selected_loan_detail", JSON.stringify(loan));
    window.location.href = `/dashboard?loan=${encodeURIComponent(loan.id || loan.loanNumber || '')}`;
  };

  // Get value for display
  const getValueForColumn = (loan, header, index) => {
    // Try to find the value using the normalized column name
    if (loan._headers && loan._headers[index]) {
      const headerObj = loan._headers[index];
      const normalizedHeader = typeof headerObj === 'object' ? headerObj.normalized : 
        headerObj.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '_');
      
      let value = loan[normalizedHeader];
      if (value === undefined && loan._rawData) {
        value = loan._rawData[normalizedHeader];
      }
      
      if (value != null && value !== '') {
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
      }
    }
    
    // Fallback
    let value = loan[header];
    if (value === undefined && loan._rawData) {
      value = loan._rawData[header];
    }
    
    if (value == null || value === '') {
      return <span className="text-gray-400 italic">-</span>;
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  // Open filter dropdown and initialize temp selections
  const openFilterDropdown = () => {
    setTempSelectedProperties([...selectedProperties]);
    setPropertySearchTerm("");
    setIsPropertyFilterOpen(true);
  };

  // Toggle property selection in temp state
  const toggleTempProperty = (property) => {
    setTempSelectedProperties(prev => 
      prev.includes(property)
        ? prev.filter(p => p !== property)
        : [...prev, property]
    );
  };

  // Apply the filter
  const applyFilter = () => {
    setSelectedProperties(tempSelectedProperties);
    setIsPropertyFilterOpen(false);
    setPropertySearchTerm("");
  };

  // Cancel filter
  const cancelFilter = () => {
    setTempSelectedProperties([]);
    setIsPropertyFilterOpen(false);
    setPropertySearchTerm("");
  };

  // Select all filtered properties in temp state
  const selectAllFilteredTemp = () => {
    setTempSelectedProperties(filteredProperties);
  };

  // Clear all temp selections
  const clearAllTemp = () => {
    setTempSelectedProperties([]);
  };

  // Clear all property selections
  const clearAllProperties = () => {
    setSelectedProperties([]);
  };

  const getUserInitials = (fullName) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isPropertyFilterOpen && !e.target.closest('.property-filter-dropdown')) {
        cancelFilter();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPropertyFilterOpen]);
  console.log(kpis)
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
                {selectedProperties.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    • Filtering by {selectedProperties.length} proper{selectedProperties.length !== 1 ? 'ties' : 'ty'}
                  </span>
                )}
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
              <div className="pp-right">
                <div className="pp-user">
                  <div className="gg-icon">
                    {getUserInitials(userData?.fullName)}
                  </div>
                  <span>{userData?.fullName || 'User'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
            <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6 shadow-sm">
              <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                Total Balance
              </div>
              <div className="text-xl lg:text-2xl font-semibold truncate">
              {formatLargeNumber(kpis.total)}
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
            </div>
            <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6 shadow-sm">
              <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                Watchlist
              </div>
              <div className="text-xl lg:text-2xl font-semibold text-amber-600">
                {kpis.wl}
              </div>
            </div>
            <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6 shadow-sm">
              <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                Default
              </div>
              <div className="text-xl lg:text-2xl font-semibold text-red-600">
                {kpis.def}
              </div>
            </div>
          </div>

          {/* Loans Table */}
          <div className="rounded-xl lg:rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="px-4 py-3 text-slate-600 text-xs font-medium whitespace-nowrap sticky left-0 bg-slate-50 z-10">
                      Row
                    </TableHead>
                    {headers.map((header, index) => {
                      const headerText = typeof header === 'object' ? header.original : header;
                      const isPropertyColumn = headerText.toLowerCase().includes('property name');
                      
                      return (
                        <TableHead 
                          key={index} 
                          className={`px-4 py-3 text-slate-600 text-xs font-medium whitespace-nowrap min-w-[120px] ${
                            index === 0 ? 'sticky left-12 bg-slate-50 z-10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{headerText}</span>
                            {isPropertyColumn && (
                              <div className="relative property-filter-dropdown">
                                <button
                                  onClick={openFilterDropdown}
                                  className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                                    selectedProperties.length > 0 ? 'text-blue-600' : 'text-slate-400'
                                  }`}
                                  title="Filter by property"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                  </svg>
                                </button>
                                
                                {/* Filter Dropdown */}
                                {isPropertyFilterOpen && (
                                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <div className="p-2 border-b">
                                      <Input
                                        placeholder="Search properties..."
                                        value={propertySearchTerm}
                                        onChange={(e) => setPropertySearchTerm(e.target.value)}
                                        className="w-full px-2 py-1 text-sm border rounded text-gray-900 bg-white"
                                        autoFocus
                                      />
                                    </div>
                                    
                                    <div className="p-2 border-b flex justify-between text-xs">
                                      <button
                                        onClick={selectAllFilteredTemp}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        Select All
                                      </button>
                                      <button
                                        onClick={clearAllTemp}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        Clear All
                                      </button>
                                    </div>
                                    
                                    <div className="max-h-60 overflow-y-auto p-2">
                                      {filteredProperties.length === 0 ? (
                                        <div className="text-sm text-gray-700 text-center py-4">
                                          No properties found
                                        </div>
                                      ) : (
                                        filteredProperties.map(property => (
                                          <label
                                            key={property}
                                            className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={tempSelectedProperties.includes(property)}
                                              onChange={() => toggleTempProperty(property)}
                                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-900 truncate" title={property}>
                                              {property}
                                            </span>
                                          </label>
                                        ))
                                      )}
                                    </div>
                                    
                                    <div className="p-2 border-t bg-slate-50 flex justify-between items-center">
                                      <span className="text-xs text-gray-700">
                                        {tempSelectedProperties.length} selected
                                      </span>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={cancelFilter}
                                          className="text-xs px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={applyFilter}
                                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                        >
                                          Apply
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((loan, rowIndex) => (
                    <TableRow
                      key={loan.id || loan.loanNumber || rowIndex}
                      className="border-b hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="px-4 py-3 text-xs text-slate-500 sticky left-0 bg-white z-5">
                        {rowIndex + 1}
                      </TableCell>
                      {headers.map((header, colIndex) => {
                        const value = getValueForColumn(loan, header, colIndex);
                        
                        // Make the first column (loan number) clickable
                        if (colIndex === 0) {
                          return (
                            <TableCell 
                              key={colIndex} 
                              className={`px-4 py-3 text-xs whitespace-nowrap min-w-[120px] ${
                                colIndex === 0 ? 'sticky left-12 bg-white z-5' : ''
                              }`}
                            >
                              <button
                                onClick={() => navigateToLoanDetail(loan)}
                                className="text-blue-600 hover:text-blue-800 hover:underline text-left w-full text-start"
                              >
                                {value}
                              </button>
                            </TableCell>
                          );
                        }
                        
                        return (
                          <TableCell 
                            key={colIndex} 
                            className={`px-4 py-3 text-xs text-slate-700 whitespace-nowrap min-w-[120px] ${
                              colIndex === 0 ? 'sticky left-12 bg-white z-5' : ''
                            }`}
                          >
                            {value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filtered.length === 0 && (
                <div className="px-4 lg:px-6 py-12 text-center text-slate-500 text-sm w-full">
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
                    <div>
                      No loans match your filters.{" "}
                      {selectedProperties.length > 0 && (
                        <button
                          onClick={clearAllProperties}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          Clear property filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <div>
              Showing {filtered.length} of {rows.length} loan{rows.length !== 1 ? 's' : ''} • 
              {headers.length} column{headers.length !== 1 ? 's' : ''}
              {selectedProperties.length > 0 && (
                <button
                  onClick={clearAllProperties}
                  className="ml-4 text-red-600 hover:text-red-800 underline text-xs"
                >
                  Clear filters
                </button>
              )}
            </div>
            <button
              onClick={navigateToImport}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Import More Data
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Loan Details</h2>
              <button
                onClick={() => setSelectedLoan(null)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {headers.map((header, index) => {
                  const headerText = typeof header === 'object' ? header.original : header;
                  const value = getValueForColumn(selectedLoan, header, index);
                  
                  if (value === '-' || value === '') return null;
                  
                  return (
                    <div key={index} className="border-b pb-2">
                      <div className="text-xs text-slate-500 font-medium">{headerText}</div>
                      <div className="text-sm text-slate-800 break-words">
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigateToLoanDetail(selectedLoan);
                    setSelectedLoan(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Full Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}