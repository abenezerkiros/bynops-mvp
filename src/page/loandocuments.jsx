import React, { useEffect, useState } from "react";
import Sidebar from "../page/sidenav";
import { useLocation, useNavigate } from "react-router-dom";

const LoanDocumentsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploadingTenant, setUploadingTenant] = useState(false);
  const [uploadingInspection, setUploadingInspection] = useState(false);
  const [tenantData, setTenantData] = useState([]);
  const [inspectionData, setInspectionData] = useState([]);

  // Get loanNumber from query parameter
  const getLoanNumberFromQuery = () => {
    const params = new URLSearchParams(location.search);
    return params.get('loan');
  };

  // OR get from localStorage if you prefer
  const getLoanFromStorage = () => {
    const stored = localStorage.getItem("current_loan_documents");
    return stored ? JSON.parse(stored) : null;
  };

  useEffect(() => {
    console.log("LoanDocumentsPage useEffect triggered");
    
    const loadData = () => {
      // Try to get loan number from query parameter first
      const loanNumberFromQuery = getLoanNumberFromQuery();
      
      // Try to get loan from localStorage
      const loanFromStorage = getLoanFromStorage();
      
      // Determine which loan to use
      let targetLoanNumber = loanNumberFromQuery;
      let targetLoan = loanFromStorage;
      
      console.log("Initial load:", {
        loanNumberFromQuery,
        loanFromStorage: loanFromStorage ? loanFromStorage.loanNumber : 'none',
        targetLoanNumber,
        hasTargetLoan: !!targetLoan
      });
      
      // If we have a loan number from query but not full loan data,
      // try to find it in localStorage loans
      if (targetLoanNumber && !targetLoan) {
        const rawLoans = localStorage.getItem("bynops_loans");
        console.log("Raw loans from localStorage:", rawLoans ? "exists" : "null");
        if (rawLoans) {
          try {
            const loans = JSON.parse(rawLoans);
            console.log("Parsed loans count:", loans.length);
            targetLoan = loans.find(l => l.loanNumber === targetLoanNumber);
            console.log("Found loan in loans list:", targetLoan ? "Yes" : "No");
          } catch (e) {
            console.error("Error parsing loans:", e);
          }
        }
      }
      
      // If we have full loan data but need the number
      if (targetLoan && !targetLoanNumber) {
        targetLoanNumber = targetLoan.loanNumber;
      }
      
      // If still no loan number, try to get from localStorage directly
      if (!targetLoanNumber) {
        targetLoanNumber = localStorage.getItem("current_loan_number");
        console.log("Got loan number from localStorage.current_loan_number:", targetLoanNumber);
      }
      
      if (!targetLoanNumber) {
        console.error("No loan number found");
        return;
      }
      
      // If we don't have full loan data, try to find it
      if (!targetLoan) {
        const rawLoans = localStorage.getItem("bynops_loans");
        if (rawLoans) {
          try {
            const loans = JSON.parse(rawLoans);
            targetLoan = loans.find(l => l.loanNumber === targetLoanNumber);
          } catch (e) {
            console.error("Error parsing loans:", e);
          }
        }
      }
      
      // Set the loan state
      if (targetLoan) {
        console.log("Setting loan:", targetLoan.loanNumber);
        setLoan(targetLoan);
      } else {
        // Create a minimal loan object with just the number
        console.log("Creating minimal loan for:", targetLoanNumber);
        setLoan({
          loanNumber: targetLoanNumber,
          propertyName: "Unknown Property",
          city: "",
          state: ""
        });
      }
      
      // Load all data
      loadAllData(targetLoanNumber);
    };
    
    const loadAllData = (loanNumber) => {
      loadDocuments(loanNumber);
      loadTenantData(loanNumber);
      loadInspectionData(loanNumber);
    };
    
    const loadDocuments = (loanNumber) => {
      console.log("Loading documents for loan:", loanNumber);
      
      try {
        const rawDocs = localStorage.getItem("bynops_documents");
        console.log("Raw docs from localStorage:", rawDocs ? "exists" : "null");
        
        if (!rawDocs || rawDocs === "[]") {
          console.log("No documents found in localStorage");
          setDocuments([]);
          return;
        }
        
        const allDocs = JSON.parse(rawDocs);
        console.log("Total documents in localStorage:", allDocs.length);
        
        if (allDocs.length === 0) {
          console.log("Parsed documents array is empty");
          setDocuments([]);
          return;
        }
        
        // Filter for this loan
        const loanDocs = allDocs.filter(doc => {
          if (!doc.loanNumber) return false;
          return doc.loanNumber.toString() === loanNumber.toString();
        });
        
        console.log("Documents found for loan:", loanDocs.length);
        setDocuments([...loanDocs]);
      } catch (error) {
        console.error("Error loading documents:", error);
        setDocuments([]);
      }
    };
    
    const loadTenantData = (loanNumber) => {
      console.log("Loading tenant data for loan:", loanNumber);
      
      try {
        const rawTenantData = localStorage.getItem("bynops_tenant_data");
        if (!rawTenantData || rawTenantData === "[]") {
          setTenantData([]);
          return;
        }
        
        const allTenantData = JSON.parse(rawTenantData);
        const loanTenantData = allTenantData.filter(data => 
          data.loanNumber && data.loanNumber.toString() === loanNumber.toString()
        );
        
        console.log("Tenant data found for loan:", loanTenantData.length);
        setTenantData(loanTenantData);
      } catch (error) {
        console.error("Error loading tenant data:", error);
        setTenantData([]);
      }
    };
    
    const loadInspectionData = (loanNumber) => {
      console.log("Loading inspection data for loan:", loanNumber);
      
      try {
        const rawInspectionData = localStorage.getItem("bynops_inspection_data");
        if (!rawInspectionData || rawInspectionData === "[]") {
          setInspectionData([]);
          return;
        }
        
        const allInspectionData = JSON.parse(rawInspectionData);
        const loanInspectionData = allInspectionData.filter(data => 
          data.loanNumber && data.loanNumber.toString() === loanNumber.toString()
        );
        
        console.log("Inspection data found for loan:", loanInspectionData.length);
        setInspectionData(loanInspectionData);
      } catch (error) {
        console.error("Error loading inspection data:", error);
        setInspectionData([]);
      }
    };
    
    loadData();
    
    // Add an event listener for when we come back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Page became visible, refreshing data");
        if (loan) {
          loadAllData(loan.loanNumber);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.search]);

  // Function to parse Excel/CSV data
  const parseFileData = async (file) => {
    return new Promise((resolve, reject) => {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          file.type === 'application/vnd.ms-excel') {
        // For Excel files
        import("xlsx").then(xlsx => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target.result);
              const workbook = xlsx.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = xlsx.utils.sheet_to_json(worksheet);
              resolve(jsonData);
            } catch (error) {
              reject(error);
            }
          };
          reader.readAsArrayBuffer(file);
        });
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        // For CSV files
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const jsonData = lines.slice(1).filter(line => line.trim()).map(line => {
              const values = line.split(',');
              const obj = {};
              headers.forEach((header, index) => {
                obj[header] = values[index] ? values[index].trim() : '';
              });
              return obj;
            });
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsText(file);
      } else {
        reject(new Error('Unsupported file type. Please upload Excel (.xlsx) or CSV files.'));
      }
    });
  };

  // Handle Tenant Data upload
  const handleTenantUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !loan) {
      console.log("Tenant upload aborted - no file or loan");
      return;
    }
    
    console.log("Starting tenant data upload for loan:", loan.loanNumber);
    setUploadingTenant(true);
    
    try {
      // Parse the file data
      const parsedData = await parseFileData(file);
      console.log("Parsed tenant data:", parsedData);
      
      // Add loan number to each row
      const tenantDataWithLoan = parsedData.map(row => ({
        ...row,
        loanNumber: loan.loanNumber,
        propertyName: loan.propertyName,
        uploadedAt: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size
      }));
      
      // Get existing tenant data
      const existingData = JSON.parse(localStorage.getItem("bynops_tenant_data") || "[]");
      
      // Remove old data for this loan
      const filteredData = existingData.filter(data => data.loanNumber !== loan.loanNumber);
      
      // Add new data
      const updatedData = [...filteredData, ...tenantDataWithLoan];
      
      // Save to localStorage
      localStorage.setItem("bynops_tenant_data", JSON.stringify(updatedData));
      
      // Update state
      setTenantData(tenantDataWithLoan);
      
      console.log("Tenant data saved successfully. Total records:", tenantDataWithLoan.length);
      
      // Show success message
      alert(`Successfully uploaded ${tenantDataWithLoan.length} tenant records for ${loan.loanNumber}`);
      
    } catch (error) {
      console.error("Error uploading tenant data:", error);
      alert(`Error uploading tenant data: ${error.message}`);
    } finally {
      setUploadingTenant(false);
      e.target.value = "";
    }
  };

  // Handle Inspection Data upload
  const handleInspectionUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !loan) {
      console.log("Inspection upload aborted - no file or loan");
      return;
    }
    
    console.log("Starting inspection data upload for loan:", loan.loanNumber);
    setUploadingInspection(true);
    
    try {
      // Parse the file data
      const parsedData = await parseFileData(file);
      console.log("Parsed inspection data:", parsedData);
      
      // Add loan number to each row
      const inspectionDataWithLoan = parsedData.map(row => ({
        ...row,
        loanNumber: loan.loanNumber,
        propertyName: loan.propertyName,
        uploadedAt: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size,
        inspectionType: file.name.toLowerCase().includes('physical') ? 'Physical' : 
                       file.name.toLowerCase().includes('environmental') ? 'Environmental' : 'General'
      }));
      
      // Get existing inspection data
      const existingData = JSON.parse(localStorage.getItem("bynops_inspection_data") || "[]");
      
      // Remove old data for this loan
      const filteredData = existingData.filter(data => data.loanNumber !== loan.loanNumber);
      
      // Add new data
      const updatedData = [...filteredData, ...inspectionDataWithLoan];
      
      // Save to localStorage
      localStorage.setItem("bynops_inspection_data", JSON.stringify(updatedData));
      
      // Update state
      setInspectionData(inspectionDataWithLoan);
      
      console.log("Inspection data saved successfully. Total records:", inspectionDataWithLoan.length);
      
      // Show success message
      alert(`Successfully uploaded ${inspectionDataWithLoan.length} inspection records for ${loan.loanNumber}`);
      
    } catch (error) {
      console.error("Error uploading inspection data:", error);
      alert(`Error uploading inspection data: ${error.message}`);
    } finally {
      setUploadingInspection(false);
      e.target.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const navigateBack = () => {
    navigate('/documents');
  };

  const deleteTenantData = () => {
    if (window.confirm("Are you sure you want to delete all tenant data for this loan?")) {
      const existingData = JSON.parse(localStorage.getItem("bynops_tenant_data") || "[]");
      const filteredData = existingData.filter(data => data.loanNumber !== loan.loanNumber);
      localStorage.setItem("bynops_tenant_data", JSON.stringify(filteredData));
      setTenantData([]);
    }
  };

  const deleteInspectionData = () => {
    if (window.confirm("Are you sure you want to delete all inspection data for this loan?")) {
      const existingData = JSON.parse(localStorage.getItem("bynops_inspection_data") || "[]");
      const filteredData = existingData.filter(data => data.loanNumber !== loan.loanNumber);
      localStorage.setItem("bynops_inspection_data", JSON.stringify(filteredData));
      setInspectionData([]);
    }
  };

  if (!loan) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-0 lg:ml-64 p-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold text-slate-900">Loading loan...</h1>
            <p className="text-slate-500 mt-2">Please wait while we load the loan data.</p>
            <button
              onClick={navigateBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back to Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 overflow-auto">
        <div className="p-4 lg:p-6 xl:p-8 w-full max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={navigateBack}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to All Loans
                </button>
              </div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900">
                Data for {loan.loanNumber}
              </h1>
              <div className="text-slate-500 text-sm lg:text-base mt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{loan.propertyName}</span>
                  {loan.city && loan.state && (
                    <span className="text-slate-400">•</span>
                  )}
                  {loan.city && <span>{loan.city}</span>}
                  {loan.state && <span>, {loan.state}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Upload Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Tenant Data Upload */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Tenant Data</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Upload tenant roll, lease information, and occupancy data
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600">Records</div>
                  <div className="text-lg font-semibold text-slate-900">
                    {tenantData.length}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="block">
                  <input 
                    type="file" 
                    accept=".xlsx,.xls,.csv"
                    onChange={handleTenantUpload}
                    disabled={uploadingTenant}
                    className="hidden"
                    id="tenant-upload"
                  />
                  <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors cursor-pointer text-center">
                    {uploadingTenant ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        Uploading Tenant Data...
                      </div>
                    ) : (
                      "+ Upload Tenant Excel/CSV"
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Upload Excel (.xlsx) or CSV files with tenant information
                  </p>
                </label>
                
                {tenantData.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-slate-700">Uploaded Data Preview</h4>
                      <button
                        onClick={deleteTenantData}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete All
                      </button>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm text-slate-600">
                        File: {tenantData[0]?.fileName}
                      </div>
                      <div className="text-sm text-slate-600">
                        Records: {tenantData.length} • Uploaded: {formatDate(tenantData[0]?.uploadedAt)}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-medium text-slate-500 mb-1">Sample Fields:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(tenantData[0] || {}).slice(0, 5).map(key => (
                            <span key={key} className="px-2 py-0.5 bg-white border rounded text-xs">
                              {key}
                            </span>
                          ))}
                          {Object.keys(tenantData[0] || {}).length > 5 && (
                            <span className="text-xs text-slate-500">
                              +{Object.keys(tenantData[0] || {}).length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inspection Data Upload */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Inspection Data</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Upload property inspection reports and findings
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600">Records</div>
                  <div className="text-lg font-semibold text-slate-900">
                    {inspectionData.length}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="block">
                  <input 
                    type="file" 
                    accept=".xlsx,.xls,.csv"
                    onChange={handleInspectionUpload}
                    disabled={uploadingInspection}
                    className="hidden"
                    id="inspection-upload"
                  />
                  <div className="px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors cursor-pointer text-center">
                    {uploadingInspection ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Uploading Inspection Data...
                      </div>
                    ) : (
                      "+ Upload Inspection Excel/CSV"
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Upload Excel (.xlsx) or CSV files with inspection results
                  </p>
                </label>
                
                {inspectionData.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-slate-700">Uploaded Data Preview</h4>
                      <button
                        onClick={deleteInspectionData}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete All
                      </button>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-sm text-slate-600">
                        File: {inspectionData[0]?.fileName}
                      </div>
                      <div className="text-sm text-slate-600">
                        Records: {inspectionData.length} • Uploaded: {formatDate(inspectionData[0]?.uploadedAt)}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-medium text-slate-500 mb-1">Sample Fields:</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(inspectionData[0] || {}).slice(0, 5).map(key => (
                            <span key={key} className="px-2 py-0.5 bg-white border rounded text-xs">
                              {key}
                            </span>
                          ))}
                          {Object.keys(inspectionData[0] || {}).length > 5 && (
                            <span className="text-xs text-slate-500">
                              +{Object.keys(inspectionData[0] || {}).length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data Preview Tables */}
          {tenantData.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Tenant Data Preview</h3>
                <span className="text-sm text-slate-500">{tenantData.length} records</span>
              </div>
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {Object.keys(tenantData[0] || {}).slice(0, 8).map((key, index) => (
                          <th key={key} className="text-left px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tenantData.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t hover:bg-gray-50">
                          {Object.keys(tenantData[0] || {}).slice(0, 8).map((key, colIndex) => (
                            <td key={colIndex} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                              {String(row[key] || '').substring(0, 30)}
                              {String(row[key] || '').length > 30 && '...'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tenantData.length > 5 && (
                    <div className="px-4 py-3 border-t bg-slate-50 text-sm text-slate-500">
                      Showing 5 of {tenantData.length} records
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {inspectionData.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Inspection Data Preview</h3>
                <span className="text-sm text-slate-500">{inspectionData.length} records</span>
              </div>
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {Object.keys(inspectionData[0] || {}).slice(0, 8).map((key, index) => (
                          <th key={key} className="text-left px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inspectionData.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t hover:bg-gray-50">
                          {Object.keys(inspectionData[0] || {}).slice(0, 8).map((key, colIndex) => (
                            <td key={colIndex} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                              {String(row[key] || '').substring(0, 30)}
                              {String(row[key] || '').length > 30 && '...'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {inspectionData.length > 5 && (
                    <div className="px-4 py-3 border-t bg-slate-50 text-sm text-slate-500">
                      Showing 5 of {inspectionData.length} records
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data Summary */}
          <div className="bg-slate-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-sm text-slate-600">Tenant Data</div>
                <div className="text-2xl font-semibold text-emerald-600 mt-1">
                  {tenantData.length} records
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {tenantData.length > 0 ? `Last upload: ${formatDate(tenantData[0]?.uploadedAt)}` : 'No data'}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-sm text-slate-600">Inspection Data</div>
                <div className="text-2xl font-semibold text-blue-600 mt-1">
                  {inspectionData.length} records
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {inspectionData.length > 0 ? `Last upload: ${formatDate(inspectionData[0]?.uploadedAt)}` : 'No data'}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <div className="text-sm text-slate-600">Total Data</div>
                <div className="text-2xl font-semibold text-slate-900 mt-1">
                  {tenantData.length + inspectionData.length} records
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Available for analysis
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDocumentsPage;