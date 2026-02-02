import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../page/sidenav";

// Mock functions
const saveFile = async (file, metadata) => {
  console.log("Saving file:", file.name, metadata);
  
  // Get existing documents
  const existingDocs = JSON.parse(localStorage.getItem("bynops_documents") || "[]");
  
  const newDoc = {
    id: `doc-${Date.now()}`,
    title: file.name,
    filename: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    loanId: metadata.loanId || null,
    loanNumber: metadata.loanNumber || null,
    category: metadata.category || "Uncategorized",
    description: metadata.description || "",
    uploadedBy: "User",
    tags: metadata.tags || [],
    status: "Active",
    version: "1.0",
    mime: file.type,
    extension: file.name.split('.').pop().toLowerCase(),
    
    // Additional metadata
    _source: "manual_upload",
    _importDate: new Date().toISOString(),
    _fileObject: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }
  };
  
  existingDocs.push(newDoc);
  localStorage.setItem("bynops_documents", JSON.stringify(existingDocs));
  
  return newDoc;
};

const removeDoc = (id) => {
  console.log("Removing document:", id);
  
  const docs = JSON.parse(localStorage.getItem("bynops_documents") || "[]");
  const updatedDocs = docs.filter(doc => doc.id !== id);
  localStorage.setItem("bynops_documents", JSON.stringify(updatedDocs));
  
  return true;
};

const listDocsByLoan = (loanNumber) => {
  const allDocs = JSON.parse(localStorage.getItem("bynops_documents") || "[]");
  return allDocs.filter(doc => doc.loanNumber === loanNumber);
};

const getDocumentsSummary = (loans) => {
  const allDocs = JSON.parse(localStorage.getItem("bynops_documents") || "[]");
  const excelData = JSON.parse(localStorage.getItem("bynops_excel_data") || "null");
  
  return loans.map(loan => {
    const loanDocs = allDocs.filter(doc => doc.loanNumber === loan.loanNumber);
    return {
      ...loan,
      documentCount: loanDocs.length,
      lastUploaded: loanDocs.length > 0 
        ? new Date(Math.max(...loanDocs.map(d => new Date(d.uploadedAt))))
        : null,
      categories: [...new Set(loanDocs.map(d => d.category))],
      totalSize: loanDocs.reduce((sum, doc) => sum + (doc.size || 0), 0)
    };
  });
};

export default function DocumentsPage() {
  const [q, setQ] = useState("");
  const [loans, setLoans] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [allColumns, setAllColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    category: "",
    description: "",
    tags: ""
  });
  const [viewMode, setViewMode] = useState("loans"); // "loans" or "documents"

  useEffect(() => {
    try {
      // Load loans
      const raw = localStorage.getItem("bynops_loans");
      const arr = raw ? JSON.parse(raw) : [];
      
      // Add document summary to each loan
      const loansWithDocs = getDocumentsSummary(arr);
      setLoans(loansWithDocs);
      
      // Extract ALL unique columns from all loans
      const columnsSet = new Set();
      
      loansWithDocs.forEach(loan => {
        Object.keys(loan).forEach(key => {
          if (!key.startsWith('_')) {
            columnsSet.add(key);
          }
        });
      });
      
      const columnsArray = Array.from(columnsSet);
      setAllColumns(columnsArray);
      setVisibleColumns([
        'loanNumber', 
        'propertyName', 
        'city', 
        'state', 
        'principalBalance', 
        'status',
        'documentCount',
        'lastUploaded',
        'totalSize',
        'categories'
      ]);
      
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);

  // Search/filter
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return loans;
    
    return loans.filter((loan) => {
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
  }, [q, loans]);

  // Summary KPIs
  const kpis = useMemo(() => {
    const totalLoans = loans.length;
    const totalDocs = loans.reduce((sum, loan) => sum + (loan.documentCount || 0), 0);
    const totalSize = loans.reduce((sum, loan) => sum + (loan.totalSize || 0), 0);
    const loansWithDocs = loans.filter(loan => loan.documentCount > 0).length;
    
    return { 
      totalLoans, 
      totalDocs,
      loansWithDocs,
      loansWithoutDocs: totalLoans - loansWithDocs,
      totalSize,
      avgDocsPerLoan: totalLoans > 0 ? totalDocs / totalLoans : 0
    };
  }, [loans]);

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      await saveFile(file, { 
        title: file.name,
        loanId: null, // Will be assigned when viewing specific loan
        loanNumber: null,
        category: uploadMetadata.category,
        description: uploadMetadata.description,
        tags: uploadMetadata.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      });
      
      // Reset metadata
      setUploadMetadata({
        category: "",
        description: "",
        tags: ""
      });
      
      // Refresh loans list
      const raw = localStorage.getItem("bynops_loans");
      const arr = raw ? JSON.parse(raw) : [];
      const loansWithDocs = getDocumentsSummary(arr);
      setLoans(loansWithDocs);
      
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
      riskScore: 'Risk',
      nextReviewAt: 'Next Review',
      borrowerName: 'Borrower',
      documentCount: 'Documents',
      lastUploaded: 'Last Upload',
      totalSize: 'Total Size',
      categories: 'Categories',
      propertyType: 'Property Type',
      maturityDate: 'Maturity',
      interestRate: 'Rate',
      loanToValue: 'LTV',
      debtServiceCoverageRatio: 'DSCR'
    };
    
    return displayNames[column] || 
      column.replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
  };

  // Format cell value based on column type
  const formatCellValue = (loan, column) => {
    const value = loan[column];
    
    if (value == null || value === '') {
      return <span className="text-gray-400 italic">-</span>;
    }
    
    // Special formatting for specific columns
    if (column.includes('balance') || column.includes('amount') || 
        column.includes('principal')) {
      const num = Number(value);
      if (!isNaN(num)) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(num);
      }
    }
    
    if (column === 'status') {
      let className = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ";
      
      if (value === "performing") {
        className += "bg-emerald-50 text-emerald-700";
      } else if (value === "watchlist") {
        className += "bg-amber-50 text-amber-700";
      } else if (value === "default") {
        className += "bg-red-50 text-red-700";
      } else {
        className += "bg-gray-50 text-gray-700";
      }
      
      return <span className={className}>{value}</span>;
    }
    
    if (column === 'documentCount') {
      if (value === 0) {
        return <span className="text-gray-400">No documents</span>;
      }
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium text-blue-600">{value}</span>
          <span className="text-xs text-gray-500">docs</span>
        </div>
      );
    }
    
    if (column === 'totalSize') {
      return formatFileSize(value);
    }
    
    if (column === 'lastUploaded') {
      return formatDate(value);
    }
    
    if (column === 'categories' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((cat, i) => (
            <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
              {cat}
            </span>
          ))}
          {value.length > 2 && (
            <span className="text-xs text-gray-500">+{value.length - 2}</span>
          )}
        </div>
      );
    }
    
    if (column.includes('date') || column.includes('review') || column.includes('maturity')) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return formatDate(value);
      }
    }
    
    if (column.includes('rate') || column.includes('percentage') || column.includes('ltv') || column.includes('dscr')) {
      const num = Number(value);
      if (!isNaN(num)) {
        return `${num.toFixed(2)}%`;
      }
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
    }
    
    // Default string representation
    const str = String(value);
    if (str.length > 30) {
      return (
        <span title={str} className="truncate max-w-[150px] inline-block">
          {str.substring(0, 27)}...
        </span>
      );
    }
    
    return str;
  };

  // Navigate to loan documents page
  const navigateToLoanDocuments = (loan) => {
    localStorage.setItem("current_loan_documents", JSON.stringify(loan));
    window.location.href = `/loan-documents?loan=${encodeURIComponent(loan.loanNumber)}`;

  };

  // Toggle column visibility
  const toggleColumn = (column) => {
    if (visibleColumns.includes(column)) {
      setVisibleColumns(visibleColumns.filter(c => c !== column));
    } else {
      setVisibleColumns([...visibleColumns, column]);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 overflow-auto">
        <div className="p-4 lg:p-6 xl:p-8 w-full h-full overflow-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900">
                Loan Documents
              </h1>
              <p className="text-slate-500 text-sm lg:text-base mt-1">
                Manage documents for each loan. Click on a loan to view and upload its documents.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative">
                <input 
                  type="file" 
                  onChange={onUpload} 
                  disabled={uploading} 
                  className="hidden"
                  id="file-upload"
                  multiple
                />
                <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer">
                  {uploading ? "Uploading..." : "+ Upload General Document"}
                </div>
                {uploading && (
                  <span className="absolute -bottom-6 left-0 text-xs text-gray-500 whitespace-nowrap">
                    Uploading...
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
            <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6 shadow-sm">
              <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                Total Loans
              </div>
              <div className="text-xl lg:text-2xl font-semibold truncate">
                {kpis.totalLoans}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {kpis.totalDocs} total documents
              </div>
            </div>
            <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6 shadow-sm">
              <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                With Documents
              </div>
              <div className="text-xl lg:text-2xl font-semibold text-emerald-600">
                {kpis.loansWithDocs}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {kpis.totalLoans > 0 ? Math.round((kpis.loansWithDocs / kpis.totalLoans) * 100) : 0}% covered
              </div>
            </div>
            <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6 shadow-sm">
              <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                Without Documents
              </div>
              <div className="text-xl lg:text-2xl font-semibold text-amber-600">
                {kpis.loansWithoutDocs}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {kpis.avgDocsPerLoan.toFixed(1)} avg docs per loan
              </div>
            </div>
            <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6 shadow-sm">
              <div className="text-xs uppercase text-slate-400 font-medium mb-1">
                Total Storage
              </div>
              <div className="text-xl lg:text-2xl font-semibold truncate">
                {formatFileSize(kpis.totalSize)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                All loan documents
              </div>
            </div>
          </div>

          {/* Search and View Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <input
              placeholder="Search loans..."
              value={q}
              onChange={e => setQ(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("loans")}
                className={`px-4 py-2 text-sm ${viewMode === "loans" ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Loans View
              </button>
              <button
                onClick={() => setViewMode("documents")}
                className={`px-4 py-2 text-sm ${viewMode === "documents" ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                All Documents
              </button>
            </div>
          </div>

          {/* Column Filter */}
          <div className="mb-4 p-4 bg-slate-50 rounded-lg">
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
                  onClick={() => setVisibleColumns(['loanNumber', 'propertyName', 'documentCount', 'lastUploaded', 'totalSize', 'status', 'principalBalance'])}
                  className="text-xs text-slate-600 hover:text-slate-800"
                >
                  Default View
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {allColumns.map(column => (
                <label key={column} className="inline-flex items-center">
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

          {/* Loans Table */}
          <div className="rounded-xl lg:rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium whitespace-nowrap sticky left-0 bg-slate-50 z-10">
                      #
                    </th>
                    {visibleColumns.map((column, index) => (
                      <th 
                        key={column} 
                        className={`text-left px-4 py-3 text-xs font-medium whitespace-nowrap min-w-[120px] ${
                          index === 0 ? 'sticky left-12 bg-slate-50 z-10' : ''
                        }`}
                        title={column}
                      >
                        {getColumnDisplayName(column)}
                      </th>
                    ))}
                    <th className="text-left px-4 py-3 text-xs font-medium whitespace-nowrap sticky right-0 bg-slate-50 z-10 min-w-[100px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((loan, index) => (
                    <tr 
                      key={loan.id || loan.loanNumber}
                      className="border-t hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-slate-500 sticky left-0 bg-white z-5">
                        {index + 1}
                      </td>
                      {visibleColumns.map((column, colIndex) => (
                        <td 
                          key={`${loan.id}-${column}`} 
                          className={`px-4 py-3 text-xs text-slate-700 whitespace-nowrap min-w-[120px] ${
                            colIndex === 0 ? 'sticky left-12 bg-white z-5' : ''
                          }`}
                          title={loan[column] != null ? String(loan[column]) : ''}
                        >
                          {colIndex === 0 ? (
                            <button
                              onClick={() => navigateToLoanDocuments(loan)}
                              className="text-blue-600 hover:text-blue-800 hover:underline text-left w-full text-start font-medium"
                            >
                              {formatCellValue(loan, column)}
                            </button>
                          ) : (
                            formatCellValue(loan, column)
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-xs sticky right-0 bg-white z-5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigateToLoanDocuments(loan)}
                            className="text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          >
                            View Docs
                          </button>
                          {loan.documentCount === 0 && (
                            <span className="text-xs text-gray-400">No docs</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={visibleColumns.length + 2} 
                        className="px-4 lg:px-6 py-12 text-center text-slate-500 text-sm">
                        {loans.length === 0 ? (
                          <div>
                            No loans found.{" "}
                            <a
                              href="/import"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Import loans first
                            </a>
                          </div>
                        ) : (
                          "No loans match your search. Try a different search term."
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Footer */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <div>
              Showing {filtered.length} of {loans.length} loan{loans.length !== 1 ? 's' : ''} • 
              {kpis.totalDocs} total document{kpis.totalDocs !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-4">
              <a
                href="/import"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Import More Loans
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Documents Preview Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Documents for {selectedLoan.loanNumber}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedLoan.propertyName} • {selectedLoan.documentCount || 0} document{selectedLoan.documentCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLoan(null)}
                  className="text-slate-500 hover:text-slate-700 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Quick upload for this loan */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-slate-900 mb-3">Upload to this loan</h3>
                <div className="flex items-center gap-3">
                  <label className="flex-1">
                    <input 
                      type="file" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        await saveFile(file, { 
                          title: file.name,
                          loanId: selectedLoan.loanNumber,
                          loanNumber: selectedLoan.loanNumber,
                          category: "Loan Document",
                          description: `Document for ${selectedLoan.loanNumber}`
                        });
                        
                        // Refresh
                        const raw = localStorage.getItem("bynops_loans");
                        const arr = raw ? JSON.parse(raw) : [];
                        const loansWithDocs = getDocumentsSummary(arr);
                        setLoans(loansWithDocs);
                        e.target.value = "";
                      }}
                      className="hidden"
                      id={`upload-${selectedLoan.loanNumber}`}
                    />
                    <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer text-center">
                      Choose File
                    </div>
                  </label>
                  <button
                    onClick={() => navigateToLoanDocuments(selectedLoan)}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm"
                  >
                    View All Documents
                  </button>
                </div>
              </div>

              {/* Loan Documents List */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-3">Recent Documents</h3>
                {selectedLoan.documentCount > 0 ? (
                  <div className="space-y-3">
                    {listDocsByLoan(selectedLoan.loanNumber)
                      .slice(0, 5)
                      .map(doc => (
                        <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-slate-900">{doc.title}</h4>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                <span>{formatFileSize(doc.size)}</span>
                                <span>•</span>
                                <span>{doc.category}</span>
                                <span>•</span>
                                <span>{formatDate(doc.uploadedAt)}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button className="text-blue-600 hover:text-blue-800 text-sm">
                                Download
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {selectedLoan.documentCount > 5 && (
                      <div className="text-center pt-2">
                        <button
                          onClick={() => navigateToLoanDocuments(selectedLoan)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View all {selectedLoan.documentCount} documents →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No documents for this loan yet.</p>
                    <p className="text-sm mt-1">Upload your first document above.</p>
                  </div>
                )}
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
                    onClick={() => navigateToLoanDocuments(selectedLoan)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Manage Documents
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