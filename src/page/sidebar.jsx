import React, { useState, useEffect, useRef } from 'react';
import "./chat.css";
import logo from "../assets/BynopsLogo.png";
import "./PropertyReport.css";
import chevron from "../assets/chevron.svg";
import { useNavigate, Link } from "react-router-dom";
const RightPanel = ({ 
  status: externalStatus,
  onStatusChange,
  loading = false,
  loans = [],
  selectedLoan,
  onSelectLoan,
  selectedLoanDetails
}) => {
  const [internalStatus, setInternalStatus] = useState("Performing");
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = React.useRef(null);
  const [showSponsorCard, setShowSponsorCard] = useState(false);
  const sponsorCardRef = useRef(null);
  const sponsorNameRef = useRef(null);


  const status = externalStatus !== undefined ? externalStatus : internalStatus;

  const statusColors = {
    Performing: "#1dbf52",
    Watchlist: "#f5a623",
    Defeased: "#0fa3e6",
    "Paid Off": "#777"
  };

  const statuses = ["Performing", "Watchlist", "Defeased", "Paid Off"];

  // Get sponsor data from selectedLoanDetails
  const sponsorName = selectedLoanDetails?._rawData?.sponsor_name || "Unknown Sponsor";
  const sponsorInformation = selectedLoanDetails?._rawData?.sponsor_information || "No sponsor information available";

  // Handle click outside to close sponsor card
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sponsorCardRef.current && 
        !sponsorCardRef.current.contains(event.target) &&
        sponsorNameRef.current && 
        !sponsorNameRef.current.contains(event.target)
      ) {
        setShowSponsorCard(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Parse Excel file with specific headers
  const parseExcelFile = async (file) => {
    if (!file) return null;
    
    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      
      const sheetNames = workbook.SheetNames;
      const tenantsSheetName = sheetNames.find(name => 
        name.toLowerCase().includes('tenant')
      );
      
      const tenantsSheet = tenantsSheetName ? workbook.Sheets[tenantsSheetName] : workbook.Sheets[workbook.SheetNames[0]];
      
      if (!tenantsSheet) {
        throw new Error("No sheet found in the Excel file");
      }
      
      const rows = XLSX.utils.sheet_to_json(tenantsSheet, { header: 1 });
      
      if (!rows || rows.length < 2) {
        throw new Error("Sheet is empty or has no data");
      }
      
      let headerRow = 0;
      while (headerRow < rows.length && 
             (!Array.isArray(rows[headerRow]) || 
              rows[headerRow].every(cell => !String(cell).trim()))) {
        headerRow++;
      }
      
      if (headerRow >= rows.length) {
        throw new Error("Could not find header row");
      }
      
      const headers = rows[headerRow].map(h => 
        String(h ?? "").trim().toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')
      );
      
      const getColumnIndex = (possibleNames) => {
        for (const name of possibleNames) {
          const index = headers.indexOf(name);
          if (index !== -1) return index;
        }
        return -1;
      };
      
      const tenantNameIndex = getColumnIndex(['tenant', 'tenant_name', 'name', 'tenantname']);
      const sqftIndex = getColumnIndex(['sqft', 'square_feet', 'squarefootage', 'area']);
      const nraIndex = getColumnIndex(['nra', 'percent', 'percentage', 'nra_percent']);
      const monthlyRentIndex = getColumnIndex(['monthly_rent', 'rent', 'monthlyrent', 'rent_monthly']);
      const leaseStartIndex = getColumnIndex(['lease_start', 'start_date', 'start', 'lease_start_date']);
      const leaseEndIndex = getColumnIndex(['lease_end', 'end_date', 'end', 'lease_end_date', 'lxd']);
      
      const dataRows = rows.slice(headerRow + 1);
      const parsedTenants = dataRows
        .filter(row => Array.isArray(row) && row.some(cell => String(cell).trim()))
        .map((row, index) => {
          const tenant = {
            id: index + 1,
            name: tenantNameIndex !== -1 ? String(row[tenantNameIndex] || "").trim() : "Unknown Tenant",
            sqft: sqftIndex !== -1 ? parseFloat(row[sqftIndex]) || 0 : 0,
            nra: nraIndex !== -1 ? parseFloat(row[nraIndex]) || 0 : 0,
            monthlyRent: monthlyRentIndex !== -1 ? parseFloat(String(row[monthlyRentIndex]).replace(/[$,]/g, '')) || 0 : 0,
            leaseStart: leaseStartIndex !== -1 ? row[leaseStartIndex] : null,
            leaseEnd: leaseEndIndex !== -1 ? row[leaseEndIndex] : null,
          };
          
          return {
            name: tenant.name || `Tenant ${index + 1}`,
            sqft: tenant.sqft ? tenant.sqft.toLocaleString() : "-",
            nra: tenant.nra ? `${tenant.nra}%` : "-",
            monthlyRent: tenant.monthlyRent ? `$${tenant.monthlyRent.toLocaleString()}` : "-",
            leaseStart: formatDate(tenant.leaseStart),
            leaseEnd: formatDate(tenant.leaseEnd),
            bankruptcy: false
          };
        })
        .filter(tenant => tenant.name && tenant.name !== "Unknown Tenant")
        .sort((a, b) => {
          const aSqft = parseInt(a.sqft.replace(/,/g, '') || "0");
          const bSqft = parseInt(b.sqft.replace(/,/g, '') || "0");
          return bSqft - aSqft;
        })
        .slice(0, 5);
      
      return parsedTenants;
      
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      throw error;
    }
  };
   
  // Helper function to format inspection dates
  const formatInspectionDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      // Handle Excel serial dates
      if (typeof dateString === 'number' && dateString > 30000 && dateString < 60000) {
        const date = new Date(1900, 0, dateString - 1);
        return date.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
      }
      
      // Handle string dates
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return String(dateString); // Return as-is if can't parse
      }
      
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return String(dateString);
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Helper functions for the UW table - UPDATED
  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    // Handle string values like "$1,234,567"
    if (typeof value === 'string') {
      // Remove $ and commas, then convert to number
      const num = Number(value.replace(/[$,]/g, ''));
      if (!isNaN(num)) {
        return `$${num.toLocaleString()}`;
      }
    }
    const num = Number(value);
    return isNaN(num) ? 'N/A' : `$${num.toLocaleString()}`;
  };

  const formatRatio = (value) => {
    if (!value && value !== 0) return 'N/A';
    if (typeof value === 'string' && value.includes('x')) {
      return value; // Already formatted with x
    }
    const num = Number(value);
    return isNaN(num) ? 'N/A' : `${num.toFixed(2)}x`;
  };

  const formatPercentage = (value) => {
    if (!value && value !== 0) return 'N/A';
    if (typeof value === 'string' && value.includes('%')) {
      return value; // Already formatted with %
    }
    const num = Number(value);
    return isNaN(num) ? 'N/A' : `${num.toFixed(2)}%`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    
    if (typeof dateValue === 'number' && dateValue > 30000) {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
      return date.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      });
    }
    
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric' 
        });
      }
    } catch (e) {
      console.error("Date parsing error:", e);
    }
    
    return String(dateValue);
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setUploadError("Please upload an Excel file (.xlsx, .xls) or CSV file");
      setTimeout(() => setUploadError(null), 3000);
      return;
    }
    
    if (file.size > 15 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 15MB.");
      setTimeout(() => setUploadError(null), 3000);
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    
    try {
      const parsedTenants = await parseExcelFile(file);
      
      if (parsedTenants && parsedTenants.length > 0) {
        setTenants(parsedTenants);
        localStorage.setItem("right_panel_tenants", JSON.stringify(parsedTenants));
      } else {
        setUploadError("No tenant data found in the file");
        setTimeout(() => setUploadError(null), 3000);
      }
    } catch (error) {
      setUploadError(error.message || "Failed to parse Excel file");
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setUploading(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Load saved tenants on component mount
  useEffect(() => {
    const savedTenants = localStorage.getItem("right_panel_tenants");
    if (savedTenants) {
      try {
        setTenants(JSON.parse(savedTenants));
      } catch (error) {
        console.error("Error loading saved tenants:", error);
      }
    }
  }, []);

  // Clear tenant data
  const clearTenantData = () => {
    if (window.confirm("Are you sure you want to clear all tenant data?")) {
      setTenants([]);
      localStorage.removeItem("right_panel_tenants");
    }
  };

  const handleStatusChange = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    } else {
      setInternalStatus(newStatus);
    }
    setOpen(false);
  };
  
  console.log(selectedLoanDetails)
  
  return (
    <div>
    <div className="sidebar">
      <div className="sidebar-header">
        <Link to="/overview">     
          <img src={logo} className="sidebar-logo" alt="" />
        </Link>
      </div>
  
      <div className="report-container">
        {/* Status Header */}
        <div className="status-bar mb-2" onClick={() => !loading && setOpen(!open)}>
          <div
            className="status-dot"
            style={{ background: statusColors[status] }}
          />
          <span>
            {status} 
            {loading && ' (Saving...)'}
          </span>
          <div className={`chevron ${open ? "chevron-up" : ""} ${loading ? 'disabled' : ''}`}>
            <img src={chevron} alt="dropdown" />
          </div>
        </div>
  
        {open && (
          <div className="dropdown-menu mb-2">
            {statuses.map((s) => (
              <div
                key={s}
                className={`dropdown-item ${loading ? 'disabled' : ''}`}
                onClick={() => !loading && handleStatusChange(s)}
              >
                <div
                  className="dropdown-dot"
                  style={{ background: statusColors[s] }}
                />
                {s}
              </div>
            ))}
          </div>
        )}
  
        {/* Loan Selector - MOVED INTO GRID */}
        <div className="report-grid">
          
          {/* Loan Selector - Now First Grid Item */}
          {loans.length > 0 && (
            <div className="grid-item">
              <div className="card">
                <div className="section-header">Loan Selection</div>
                <div className="loan-selector">
                  <select 
                    value={selectedLoan || ""}
                    onChange={(e) => onSelectLoan && onSelectLoan(e.target.value)}
                    className="loan-dropdown"
                    disabled={loading}
                  >
                    <option value="">-- Select a loan --</option>
                    {loans.map((loan) => (
                      <option key={loan.id || loan.loanNumber} value={loan.id || loan.loanNumber}>
                        {loan.loanNumber} - {loan.propertyName}
                        {loan.city && loan.state && ` (${loan.city}, ${loan.state})`}
                      </option>
                    ))}
                  </select>
                  
                  {selectedLoanDetails && (
                    <div className="selected-loan-info">
                      <div className="loan-info-row">
                        <span className="info-label">Property:</span>
                        <span className="info-value">
                          {selectedLoanDetails.propertyName || "N/A"}
                        </span>
                      </div>
                      <div className="loan-info-row">
                        <span className="info-label">Loan #:</span>
                        <span className="info-value font-medium">
                          {selectedLoanDetails.loanNumber || "N/A"}
                        </span>
                      </div>
                      <div className="loan-info-row">
                        <span className="info-label">Pool:</span>
                        <span className="info-value">
                          {selectedLoanDetails?._rawData?.pool || selectedLoanDetails.poolName || "N/A"}
                        </span>
                      </div>
                      <div className="loan-info-row">
                        <span className="info-label">Address:</span>
                        <span className="info-value">
                          {selectedLoanDetails.propertyAddress || 
                           `${selectedLoanDetails.address || ""} ${selectedLoanDetails.city || ""} ${selectedLoanDetails.state || ""}`.trim() || 
                           "N/A"}
                        </span>
                      </div>
                      <div className="loan-info-row">
                        <span className="info-label">Maturity Date:</span>
                        <span className="info-value">
                          {selectedLoanDetails.maturityDate 
                            ? (() => {
                                let date = null;
                                if (typeof selectedLoanDetails.maturityDate === 'number' && 
                                    selectedLoanDetails.maturityDate > 30000 && 
                                    selectedLoanDetails.maturityDate < 60000) {
                                  date = new Date(1900, 0, selectedLoanDetails.maturityDate - 1);
                                } else {
                                  date = new Date(selectedLoanDetails.maturityDate);
                                }
                                return !isNaN(date.getTime()) 
                                  ? date.toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })
                                  : String(selectedLoanDetails.maturityDate);
                              })()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="loan-info-row">
                        <span className="info-label">Interest Rate:</span>
                        <span className="info-value">
                          {selectedLoanDetails.interestRate 
                            ? (() => {
                                if (typeof selectedLoanDetails.interestRate === 'string' && 
                                    selectedLoanDetails.interestRate.includes('%')) {
                                  return selectedLoanDetails.interestRate;
                                }
                                const rate = Number(selectedLoanDetails.interestRate);
                                return !isNaN(rate) 
                                  ? `${rate.toFixed(2)}%`
                                  : String(selectedLoanDetails.interestRate);
                              })()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="loan-info-row">
                        <span className="info-label">Type:</span>
                        <span className="info-value">
                          {selectedLoanDetails.propertyType || 
                           selectedLoanDetails.type || 
                           selectedLoanDetails.loanType || 
                           "N/A"}
                        </span>
                      </div>
                      <div className="loan-info-row">
                        <span className="info-label">Unit/SqFt:</span>
                        <span className="info-value">
                          {selectedLoanDetails?._rawData?.units_sqft}
                        </span>
                      </div>
                      {/* Add Sponsor Name Row with Hover Card */}
                      <div className="loan-info-row sponsor-row">
                        <span className="info-label">Sponsor:</span>
                        <span 
                          ref={sponsorNameRef}
                          className="info-value sponsor-name"
                          onMouseEnter={() => setShowSponsorCard(true)}
                          onMouseLeave={() => {
                            setTimeout(() => {
                              if (!sponsorCardRef.current?.matches(':hover')) {
                                setShowSponsorCard(false);
                              }
                            }, 100);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSponsorCard(!showSponsorCard);
                          }}
                        >
                          {sponsorName}
                          <span style={{ marginLeft: '4px', fontSize: '12px' }}>ⓘ</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
  
          {/* Sponsor Information Card (Floating) */}
          {showSponsorCard && (
            <div 
              ref={sponsorCardRef}
              className="sponsor-card"
              onMouseEnter={() => setShowSponsorCard(true)}
              onMouseLeave={() => setShowSponsorCard(false)}
            >
              <div className="sponsor-card-header">
                <h3>Sponsor: {sponsorName}</h3>
              </div>
              
              <div className="sponsor-card-content">
                {sponsorInformation}
              </div>
            </div>
          )}
  
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
  
          {/* Rest of your grid items - EXACTLY AS THEY WERE */}
          
          {/* Top 5 Tenants */}
          {(selectedLoanDetails?.propertyType!=="Multifamily"&& selectedLoanDetails?.propertyType!=="multifamily") && <div className="grid-item">
            <div className="card">
              <div className="section-header">Tenant Data</div>
              
              {(() => {
                // Load tenant data from localStorage
                const tenantData = JSON.parse(localStorage.getItem("bynops_tenant_data") || "[]");
                
                // Filter for this specific loan
                const loanTenantData = tenantData.filter(data => 
                  data.loanNumber === (selectedLoanDetails?.loanNumber || selectedLoanDetails?._rawData?.loan_number)
                );
                
                if (loanTenantData.length > 0) {
                  // Get all unique column names from all tenant records
                  const allColumns = new Set();
                  loanTenantData.forEach(row => {
                    Object.keys(row).forEach(key => {
                      // Filter out metadata fields
                      if (!['loanNumber', 'propertyName', 'uploadedAt', 'fileName', 'fileSize'].includes(key)) {
                        allColumns.add(key);
                      }
                    });
                  });
                  
                  const columns = Array.from(allColumns);
                  
                  return (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-sm text-left font-medium text-slate-900">Tenant Roll</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {loanTenantData.length} tenants • {loanTenantData[0]?.fileName}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500">
                          Uploaded: {formatDate(loanTenantData[0]?.uploadedAt)}
                        </span>
                      </div>
                      
                      <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-xs">
                          <thead className="bg-black">
                            <tr>
                              {columns.map(column => (
                                <th 
                                  key={column} 
                                  className="text-left px-4 py-2 text-white font-medium whitespace-nowrap"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {loanTenantData.map((row, index) => (
                              <tr 
                                key={index} 
                                className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                              >
                                {columns.map(column => (
                                  <td 
                                    key={column} 
                                    className="px-4 py-2 text-slate-700 whitespace-nowrap border-r"
                                  >
                                    {row[column] || ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                } else {
                  return (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1.205a6 6 0 01-7.743 5.197" />
                      </svg>
                      <p className="text-sm text-slate-500 mb-2">No tenant data for this loan</p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>}
  
          {/* UW Table */}
          <div className="grid-item">
            <div className="card overflow-x-auto">
              <table className="table uw-table">
                <thead>
                  <tr>
                    <th>UW</th>
                    <th>12/31/2022</th>
                    <th>12/31/2023</th>
                    <th>12/31/2024</th>
                    <th>12/31/2025</th>
                  </tr>
                </thead>
                <tbody>
                  {/* EGI */}
                  <tr>
                    <td>EGI</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2022 EGI"] || 
                      selectedLoanDetails?._rawData?.["2022_EGI"] ||
                      selectedLoanDetails?._rawData?.["2022_egi"] ||
                      selectedLoanDetails?._rawData?.egi_2022 ||
                      selectedLoanDetails?._rawData?.egi || 
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2023 EGI"] || 
                      selectedLoanDetails?._rawData?.["2023_EGI"] ||
                      selectedLoanDetails?._rawData?.["2023_egi"] ||
                      selectedLoanDetails?._rawData?.egi_2023 ||
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2024 EGI"] || 
                      selectedLoanDetails?._rawData?.["2024_EGI"] ||
                      selectedLoanDetails?._rawData?.["2024_egi"] ||
                      selectedLoanDetails?._rawData?.egi_2024 ||
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2025 EGI"] || 
                      selectedLoanDetails?._rawData?.["2025_EGI"] ||
                      selectedLoanDetails?._rawData?.["2025_egi"] ||
                      selectedLoanDetails?._rawData?.egi_2025 ||
                      null
                    )}</td>
                  </tr>
                  
                  {/* Expenses */}
                  <tr>
                    <td>Expenses</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2022 Expenses"] || 
                      selectedLoanDetails?._rawData?.["2022_EXPENSES"] ||
                      selectedLoanDetails?._rawData?.["2022_expenses"] ||
                      selectedLoanDetails?._rawData?.expenses_2022 ||
                      selectedLoanDetails?._rawData?.expenses || 
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2023 Expenses"] || 
                      selectedLoanDetails?._rawData?.["2023_EXPENSES"] ||
                      selectedLoanDetails?._rawData?.["2023_expenses"] ||
                      selectedLoanDetails?._rawData?.expenses_2023 ||
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2024 Expenses"] || 
                      selectedLoanDetails?._rawData?.["2024_EXPENSES"] ||
                      selectedLoanDetails?._rawData?.["2024_expenses"] ||
                      selectedLoanDetails?._rawData?.expenses_2024 ||
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2025 Expenses"] || 
                      selectedLoanDetails?._rawData?.["2025_EXPENSES"] ||
                      selectedLoanDetails?._rawData?.["2025_expenses"] ||
                      selectedLoanDetails?._rawData?.expenses_2025 ||
                      null
                    )}</td>
                  </tr>
                  
                  {/* NOI */}
                  <tr>
                    <td>NOI</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2022 NOI"] || 
                      selectedLoanDetails?._rawData?.["2022_NOI"] ||
                      selectedLoanDetails?._rawData?.["2022_noi"] ||
                      selectedLoanDetails?._rawData?.noi_2022 ||
                      selectedLoanDetails?._rawData?.noi || 
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2023 NOI"] || 
                      selectedLoanDetails?._rawData?.["2023_NOI"] ||
                      selectedLoanDetails?._rawData?.["2023_noi"] ||
                      selectedLoanDetails?._rawData?.noi_2023 ||
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2024 NOI"] || 
                      selectedLoanDetails?._rawData?.["2024_NOI"] ||
                      selectedLoanDetails?._rawData?.["2024_noi"] ||
                      selectedLoanDetails?._rawData?.noi_2024 ||
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2025 NOI"] || 
                      selectedLoanDetails?._rawData?.["2025_NOI"] ||
                      selectedLoanDetails?._rawData?.["2025_noi"] ||
                      selectedLoanDetails?._rawData?.noi_2025 ||
                      null
                    )}</td>
                  </tr>
                  
                  {/* Debt Service */}
                  <tr>
                    <td>Debt Service</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2022 Debt Service"] || 
                      selectedLoanDetails?._rawData?.["2022_DEBT_SERVICE"] ||
                      selectedLoanDetails?._rawData?.["2022_debt_service"] ||
                      selectedLoanDetails?._rawData?.debt_service_2022 ||
                      selectedLoanDetails?._rawData?.debt_service || 
                      selectedLoanDetails?._rawData?.annual_debt_service ||
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2023 Debt Service"] || 
                      selectedLoanDetails?._rawData?.["2023_DEBT_SERVICE"] ||
                      selectedLoanDetails?._rawData?.["2023_debt_service"] ||
                      selectedLoanDetails?._rawData?.debt_service_2023 ||
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2024 Debt Service"] || 
                      selectedLoanDetails?._rawData?.["2024_DEBT_SERVICE"] ||
                      selectedLoanDetails?._rawData?.["2024_debt_service"] ||
                      selectedLoanDetails?._rawData?.debt_service_2024 ||
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2025 Debt Service"] || 
                      selectedLoanDetails?._rawData?.["2025_DEBT_SERVICE"] ||
                      selectedLoanDetails?._rawData?.["2025_debt_service"] ||
                      selectedLoanDetails?._rawData?.debt_service_2025 ||
                      null
                    )}</td>
                  </tr>
                  
                  {/* NOI DSCR */}
                  <tr>
                    <td>NOI DSCR</td>
                    <td>{formatRatio(
                      selectedLoanDetails?._rawData?.["2022 DSCR"] || 
                      selectedLoanDetails?._rawData?.["2022_DSCR"] ||
                      selectedLoanDetails?._rawData?.["2022_dscr"] ||
                      selectedLoanDetails?._rawData?.dscr_2022 ||
                      selectedLoanDetails?._rawData?.dscr || 
                      selectedLoanDetails?._rawData?.noi_dscr ||
                      null
                    )}</td>
                    <td>{formatRatio(
                      selectedLoanDetails?._rawData?.["2023 DSCR"] || 
                      selectedLoanDetails?._rawData?.["2023_DSCR"] ||
                      selectedLoanDetails?._rawData?.["2023_dscr"] ||
                      selectedLoanDetails?._rawData?.dscr_2023 ||
                      null
                    )}</td>
                    <td>{formatRatio(
                      selectedLoanDetails?._rawData?.["2024 DSCR"] || 
                      selectedLoanDetails?._rawData?.["2024_DSCR"] ||
                      selectedLoanDetails?._rawData?.["2024_dscr"] ||
                      selectedLoanDetails?._rawData?.dscr_2024 ||
                      null
                    )}</td>
                    <td>{formatRatio(
                      selectedLoanDetails?._rawData?.["2025 DSCR"] || 
                      selectedLoanDetails?._rawData?.["2025_DSCR"] ||
                      selectedLoanDetails?._rawData?.["2025_dscr"] ||
                      selectedLoanDetails?._rawData?.dscr_2025 ||
                      null
                    )}</td>
                  </tr>
                  
                  {/* NCF */}
                  <tr>
                    <td>NCF</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2022 NCF"] || 
                      selectedLoanDetails?._rawData?.["2022_NCF"] ||
                      selectedLoanDetails?._rawData?.["2022_ncf"] ||
                      selectedLoanDetails?._rawData?.ncf_2022 ||
                      selectedLoanDetails?._rawData?.ncf || 
                      selectedLoanDetails?._rawData?.net_cash_flow ||
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2023 NCF"] || 
                      selectedLoanDetails?._rawData?.["2023_NCF"] ||
                      selectedLoanDetails?._rawData?.["2023_ncf"] ||
                      selectedLoanDetails?._rawData?.ncf_2023 ||
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2024 NCF"] || 
                      selectedLoanDetails?._rawData?.["2024_NCF"] ||
                      selectedLoanDetails?._rawData?.["2024_ncf"] ||
                      selectedLoanDetails?._rawData?.ncf_2024 ||
                      null
                    )}</td>
                    <td>{formatCurrency(
                      selectedLoanDetails?._rawData?.["2025 NCF"] || 
                      selectedLoanDetails?._rawData?.["2025_NCF"] ||
                      selectedLoanDetails?._rawData?.["2025_ncf"] ||
                      selectedLoanDetails?._rawData?.ncf_2025 ||
                      null
                    )}</td>
                  </tr>
                  
                  {/* NCF DSCR */}
                  <tr>
                    <td>NCF DSCR</td>
                    <td>{formatRatio(
                      selectedLoanDetails?._rawData?.["2022 NCF DSCR"] || 
                      selectedLoanDetails?._rawData?.["2022_NCF_DSCR"] ||
                      selectedLoanDetails?._rawData?.["2022_ncf_dscr"] ||
                      selectedLoanDetails?._rawData?.ncf_dscr_2022 ||
                      selectedLoanDetails?._rawData?.ncf_dscr || 
                      selectedLoanDetails?._rawData?.net_cash_flow_dscr ||
                      null
                    )}</td>
                    <td>{formatRatio(
                      selectedLoanDetails?._rawData?.["2023 NCF DSCR"] || 
                      selectedLoanDetails?._rawData?.["2023_NCF_DSCR"] ||
                      selectedLoanDetails?._rawData?.["2023_ncf_dscr"] ||
                      selectedLoanDetails?._rawData?.ncf_dscr_2023 ||
                      null
                    )}</td>
                    <td>{formatRatio(
                      selectedLoanDetails?._rawData?.["2024 NCF DSCR"] || 
                      selectedLoanDetails?._rawData?.["2024_NCF_DSCR"] ||
                      selectedLoanDetails?._rawData?.["2024_ncf_dscr"] ||
                      selectedLoanDetails?._rawData?.ncf_dscr_2024 ||
                      null
                    )}</td>
                    <td>{formatRatio(
                      selectedLoanDetails?._rawData?.["2025 NCF DSCR"] || 
                      selectedLoanDetails?._rawData?.["2025_NCF_DSCR"] ||
                      selectedLoanDetails?._rawData?.["2025_ncf_dscr"] ||
                      selectedLoanDetails?._rawData?.ncf_dscr_2025 ||
                      null
                    )}</td>
                  </tr>
                  
                  {/* Debt Yield */}
                  <tr>
                    <td>Debt Yield</td>
                    <td>{formatPercentage(
                      selectedLoanDetails?._rawData?.["2022 Debt Yield"] || 
                      selectedLoanDetails?._rawData?.["2022_DEBT_YIELD"] ||
                      selectedLoanDetails?._rawData?.["2022_debt_yield"] ||
                      selectedLoanDetails?._rawData?.debt_yield_2022 ||
                      selectedLoanDetails?._rawData?.debt_yield || 
                      null
                    )}</td>
                    <td>{formatPercentage(
                      selectedLoanDetails?._rawData?.["2023 Debt Yield"] || 
                      selectedLoanDetails?._rawData?.["2023_DEBT_YIELD"] ||
                      selectedLoanDetails?._rawData?.["2023_debt_yield"] ||
                      selectedLoanDetails?._rawData?.debt_yield_2023 ||
                      null
                    )}</td>
                    <td>{formatPercentage(
                      selectedLoanDetails?._rawData?.["2024 Debt Yield"] || 
                      selectedLoanDetails?._rawData?.["2024_DEBT_YIELD"] ||
                      selectedLoanDetails?._rawData?.["2024_debt_yield"] ||
                      selectedLoanDetails?._rawData?.debt_yield_2024 ||
                      null
                    )}</td>
                    <td>{formatPercentage(
                      selectedLoanDetails?._rawData?.["2025 Debt Yield"] || 
                      selectedLoanDetails?._rawData?.["2025_DEBT_YIELD"] ||
                      selectedLoanDetails?._rawData?.["2025_debt_yield"] ||
                      selectedLoanDetails?._rawData?.debt_yield_2025 ||
                      null
                    )}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  
          {/* DSCR Card */}
          <div className="grid-item">
            <div className="card">
              <div className="dscr-label">DSCR</div>
              
              {(() => {
                const rawData = selectedLoanDetails?._rawData || {};
                
                let dscrValue = null;
                
                if (rawData.dscr_2024 !== undefined) dscrValue = Number(rawData.dscr_2024);
                else if (rawData.dscr_2023 !== undefined) dscrValue = Number(rawData.dscr_2023);
                else if (rawData.dscr_2022 !== undefined) dscrValue = Number(rawData.dscr_2022);
                else if (rawData.dscr !== undefined) dscrValue = Number(rawData.dscr);
                else if (rawData.noi_dscr !== undefined) dscrValue = Number(rawData.noi_dscr);
                else if (rawData.current_dscr !== undefined) dscrValue = Number(rawData.current_dscr);
                
                if (!dscrValue && rawData.noi && rawData.annual_debt_service) {
                  dscrValue = Number(rawData.noi) / Number(rawData.annual_debt_service);
                }
                
                dscrValue = dscrValue || 1.0;
                
                let barWidth = ((dscrValue - 1.0) / 0.5) * 100;
                barWidth = Math.min(Math.max(barWidth, 0), 100);
                
                let barColor = '#ef4444';
                if (dscrValue >= 1.0 && dscrValue < 1.25) barColor = '#f59e0b';
                else if (dscrValue >= 1.25 && dscrValue < 1.5) barColor = '#10b981';
                else if (dscrValue >= 1.5) barColor = '#059669';
                
                const triggerThreshold = 1.25;
                const isTrigger = dscrValue < triggerThreshold;
                
                return (
                  <>
                    <div className="dscr-bar">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${barWidth}%`,
                          backgroundColor: barColor
                        }}
                      ></div>
                    </div>
                    <div className="dscr-values">
                      <span className={dscrValue < 1.0 ? 'active' : ''}>1.0</span>
                      <span className={dscrValue >= 1.0 && dscrValue < 1.25 ? 'active' : ''}>1.25</span>
                      <span className={dscrValue >= 1.5 ? 'active' : ''}>1.5+</span>
                    </div>
                    {isTrigger && (
                      <div className="trigger-banner">
                        ⚠ DSCR TRIGGER ({dscrValue.toFixed(2)}x &lt; {triggerThreshold}x)
                      </div>
                    )}
                    <div className="dscr-current-value">
                      Current: <strong>{dscrValue.toFixed(2)}x</strong>
                    </div>
                  </>
                );
              })()}
              
              <div className="dscr-data-source">
                Source: {selectedLoanDetails?._rawData?.dscr_source || 
                         selectedLoanDetails?._rawData?.dscr_calculation || 
                         'Calculated from NOI & Debt Service'}
              </div>
            </div>
          </div>
  
          {/* Cash Management Details */}
          <div className="grid-item">
            <div className="card">
              <div className="details-row">
                <span className="details-title">Cash Management:</span>
                <span>During a DSCR Trigger Event the Cash Management Period shall be implemented</span>
              </div>
              <div className="details-row">
                <span className="details-title">DSCR Trigger Event:</span>
                <span>Shall be DSCR falling below the threshold of 1.25x</span>
              </div>
            </div>
          </div>
  
          {/* DSCR Trigger Table */}
          <div className="grid-item">
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>DSCR Trigger Event</th>
                    <th>Threshold</th>
                    <th>Triggered</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Event</td><td>1.25x</td><td>No</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  
          {/* Inspection */}
          <div className="grid-item">
            <div className="card">
              <div className="section-header">Inspection</div>
              
              {(() => {
                const inspectionData = JSON.parse(localStorage.getItem("bynops_inspection_data") || "[]");
                
                const loanInspectionData = inspectionData.filter(data => 
                  data.loanNumber === (selectedLoanDetails?.loanNumber || selectedLoanDetails?._rawData?.loan_number)
                );
                
                const latestInspection = loanInspectionData.length > 0 
                  ? loanInspectionData.reduce((latest, current) => {
                      const currentDate = new Date(current.uploadedAt || 0);
                      const latestDate = new Date(latest.uploadedAt || 0);
                      return currentDate > latestDate ? current : latest;
                    })
                  : null;
                
                const formatExcelDate = (excelSerial) => {
                  if (!excelSerial) return null;
                  const serial = Number(excelSerial);
                  if (isNaN(serial)) return null;
                  if (serial < 1) return null;
                  
                  const utc_days = Math.floor(serial - 25569);
                  const utc_value = utc_days * 86400;
                  const date_info = new Date(utc_value * 1000);
                  
                  const fractional_day = serial - Math.floor(serial) + 0.0000001;
                  let total_seconds = Math.floor(86400 * fractional_day);
                  const seconds = total_seconds % 60;
                  total_seconds -= seconds;
                  const hours = Math.floor(total_seconds / 3600);
                  const minutes = Math.floor(total_seconds / 60) % 60;
                  
                  date_info.setHours(hours);
                  date_info.setMinutes(minutes);
                  date_info.setSeconds(seconds);
                  
                  return date_info;
                };
                
                if (latestInspection) {
                  const company = latestInspection["Company "] || latestInspection.company || "Not specified";
                  const dateValue = latestInspection["Date "] || latestInspection.date || latestInspection.inspectionDate;
                  const fileName = latestInspection.fileName || "Unknown file";
                  const inspectionType = latestInspection.inspectionType || latestInspection["Inspection Type"] || "General";
                  const propertyName = latestInspection.propertyName || selectedLoanDetails?.propertyName || "Unknown Property";
                  
                  const grade = latestInspection.Grade || latestInspection.grade || 
                               latestInspection.Rating || latestInspection.rating || 
                               latestInspection.Score || latestInspection.score || "N/A";
                  
                  const deferredMaintenance = latestInspection["Deferred Maintenance"] || 
                                            latestInspection.deferredMaintenance || 
                                            latestInspection.DM || 
                                            latestInspection.dm || 
                                            latestInspection["DM Issues"] || 
                                            "Unknown";
                  
                  const lifeSafety = latestInspection["Life Safety"] || 
                                    latestInspection.lifeSafety || 
                                    latestInspection.LS || 
                                    latestInspection.ls || 
                                    latestInspection["LS Issues"] || 
                                    "Unknown";
                  
                  const notes = latestInspection.Notes || 
                               latestInspection.notes || 
                               latestInspection.Comments || 
                               latestInspection.comments || 
                               latestInspection.Findings || 
                               latestInspection.findings || 
                               latestInspection.Summary || 
                               latestInspection.summary;
                  
                  const condition = latestInspection.Condition || 
                                   latestInspection.condition || 
                                   latestInspection["Overall Condition"] || 
                                   latestInspection.overallCondition;
                  
                  const majorIssues = latestInspection["Major Issues"] || 
                                     latestInspection.majorIssues || 
                                     latestInspection.majorIssuesCount;
                  
                  const minorIssues = latestInspection["Minor Issues"] || 
                                     latestInspection.minorIssues || 
                                     latestInspection.minorIssuesCount;
                  
                  const safetyViolations = latestInspection["Safety Violations"] || 
                                          latestInspection.safetyViolations || 
                                          latestInspection["LS Violations"] || 
                                          latestInspection.lsViolations;
  
                  console.log(latestInspection)
                  
                  return (
                    <>
                      <div className="inspect-grid">
                        <div>
                          <b>Company:</b> {company}
                        </div>
                        <div>
                          <b>Date:</b> {formatInspectionDate(dateValue)}
                        </div>
                        <div>
                          <b>Grade:</b> {grade}
                        </div>
                        <div>
                          <b>Deferred Maintenance (DM):</b> {
                            String(deferredMaintenance).toLowerCase() === 'yes' || 
                            String(deferredMaintenance).toLowerCase() === 'true' ||
                            deferredMaintenance === true ? 
                              'Yes' : 
                            String(deferredMaintenance).toLowerCase() === 'no' || 
                            String(deferredMaintenance).toLowerCase() === 'false' ||
                            deferredMaintenance === false ? 
                              'No' : 
                            deferredMaintenance
                          }
                        </div>
                        <div>
                          <b>Life Safety (LS):</b> {
                            String(lifeSafety).toLowerCase() === 'yes' || 
                            String(lifeSafety).toLowerCase() === 'true' ||
                            lifeSafety === true ? 
                              'Yes' : 
                            String(lifeSafety).toLowerCase() === 'no' || 
                            String(lifeSafety).toLowerCase() === 'false' ||
                            lifeSafety === false ? 
                              'No' : 
                            lifeSafety
                          }
                        </div>
                        <div>
                          <b>Type:</b> {inspectionType}
                        </div>
                        {condition && (
                          <div>
                            <b>Condition:</b> {condition}
                          </div>
                        )}
                        <div>
                          <b>Property:</b> {propertyName}
                        </div>
                      </div>
                      
                      {notes && (
                        <div className="inspection-notes">
                          <b>Notes:</b> {notes}
                        </div>
                      )}
                      
                      <div className="attachments">
                        <span className="attachment-icon">📄</span>
                        <span className="attachment-name">{fileName}</span>
                        <span className="attachment-size">
                          ({formatFileSize(latestInspection.fileSize || 0)})
                        </span>
                        {latestInspection.uploadedAt && (
                          <span className="attachment-date">
                            • Uploaded: {formatInspectionDate(latestInspection.uploadedAt)}
                          </span>
                        )}
                      </div>
                      
                      {loanInspectionData.length > 1 && (
                        <div className="multiple-inspections">
                          <span className="warning-icon">⚠</span>
                          {loanInspectionData.length} inspections found. Showing most recent.
                          <button 
                            className="view-all-btn"
                            onClick={() => {
                              localStorage.setItem("current_loan_documents", JSON.stringify(selectedLoanDetails));
                              window.location.href = `/loan-documents?loan=${encodeURIComponent(selectedLoanDetails?.loanNumber || '')}`;
                            }}
                          >
                            View All
                          </button>
                        </div>
                      )}
                      
                      {(majorIssues || minorIssues || safetyViolations || condition) && (
                        <div className="inspection-findings">
                          <h4 className="findings-header">Key Findings:</h4>
                          <div className="findings-grid">
                            {majorIssues && parseInt(majorIssues) > 0 && (
                              <div className="finding-item finding-major">
                                <span className="finding-count">{majorIssues}</span>
                                <span className="finding-label">Major Issues</span>
                              </div>
                            )}
                            
                            {minorIssues && parseInt(minorIssues) > 0 && (
                              <div className="finding-item finding-minor">
                                <span className="finding-count">{minorIssues}</span>
                                <span className="finding-label">Minor Issues</span>
                              </div>
                            )}
                            
                            {safetyViolations && parseInt(safetyViolations) > 0 && (
                              <div className="finding-item finding-safety">
                                <span className="finding-count">{safetyViolations}</span>
                                <span className="finding-label">Safety Violations</span>
                              </div>
                            )}
                            
                            {condition && (
                              <div className="finding-item finding-condition">
                                <span className="finding-label">Condition:</span>
                                <span className="finding-value">{condition}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                } else {
                  return (
                    <div className="no-inspection-data">
                      <div className="inspect-grid">
                        <div><b>Company:</b> No inspection data</div>
                        <div><b>Date:</b> N/A</div>
                        <div><b>Grade:</b> N/A</div>
                        <div><b>Deferred Maintenance (DM):</b> Unknown</div>
                        <div><b>Life Safety (LS):</b> Unknown</div>
                        <div><b>Type:</b> N/A</div>
                      </div>
                      <div className="inspection-notes">
                        <b>Notes:</b> Upload inspection data in the Documents section
                      </div>
                      <div className="upload-prompt">
                        Go to Documents to upload inspection data 
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
  
        </div>
      </div>
    </div>
  </div>
  );
};

export default RightPanel;