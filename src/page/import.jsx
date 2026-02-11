import React, { useState } from "react";
import Sidebar from "../page/sidenav";

// ──────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────

function normalizeHeader(h) {
  // Handle various types of header values
  let headerStr = "";
  
  if (h == null) {
    headerStr = "";
  } else if (typeof h === 'string') {
    headerStr = h;
  } else if (typeof h === 'number') {
    headerStr = String(h);
  } else if (typeof h === 'boolean') {
    headerStr = String(h);
  } else if (typeof h === 'object' && h !== null) {
    // Handle Excel date objects or other objects
    if (h.t === 'n' || h.t === 'd' || h.t === 'b') {
      headerStr = String(h.v || "");
    } else {
      headerStr = String(h);
    }
  } else {
    headerStr = String(h);
  }
  
  const normalized = headerStr
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "_");
  
  return normalized || "_empty_";
}

function sheetToJSONNormalized(ws, XLSX) {
  // Get both raw values AND formatted text
  const rows = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: false, // Get formatted text instead of raw values
    defval: "",
  });

  if (!rows?.length) return { headers: [], rows: [] };

  // Find first non-empty header row
  let headerRow = 0;
  while (
    headerRow < rows.length &&
    (!Array.isArray(rows[headerRow]) ||
      rows[headerRow].every((c) => {
        const val = c != null ? String(c) : "";
        return val.trim() === "";
      }))
  ) {
    headerRow++;
  }
  
  if (headerRow >= rows.length) return { headers: [], rows: [] };

  const headerRaw = rows[headerRow];
  
  // Find the last non-empty header column
  let lastColumnIndex = headerRaw.length - 1;
  while (lastColumnIndex >= 0) {
    const headerValue = headerRaw[lastColumnIndex];
    const headerStr = headerValue != null ? String(headerValue).trim() : "";
    if (headerStr !== "") {
      break;
    }
    lastColumnIndex--;
  }
  
  // If no headers found, return empty
  if (lastColumnIndex < 0) return { headers: [], rows: [] };
  
  // Trim to only include columns with non-empty headers
  const trimmedHeaderRaw = headerRaw.slice(0, lastColumnIndex + 1);
  
  // Create headers array (only for non-empty header columns)
  const headers = trimmedHeaderRaw.map((h, i) => {
    let original = "";
    
    if (h == null) {
      original = `Column ${i + 1}`;
    } else if (typeof h === 'string') {
      original = h.trim() || `Column ${i + 1}`;
    } else if (typeof h === 'number') {
      original = String(h);
    } else if (typeof h === 'boolean') {
      original = String(h);
    } else if (typeof h === 'object' && h !== null) {
      // Handle Excel objects
      if (h.t === 'n' || h.t === 'd' || h.t === 'b') {
        original = String(h.v || "").trim() || `Column ${i + 1}`;
      } else {
        original = String(h).trim() || `Column ${i + 1}`;
      }
    } else {
      original = String(h).trim() || `Column ${i + 1}`;
    }
    
    return {
      original: original,
      normalized: normalizeHeader(h),
      index: i
    };
  });
  
  // Process rows - only include cells up to the last header column
  const data = rows.slice(headerRow + 1);
  
  const processedRows = data
    .filter(
      (r) =>
        Array.isArray(r) &&
        r.some((c, idx) => idx <= lastColumnIndex && c != null && String(c).trim() !== "")
    )
    .map((r) => {
      const obj = {};
      headers.forEach((h) => {
        const cellValue = r[h.index];
        // Store the value AS IS - no conversion
        obj[h.normalized] = cellValue != null ? cellValue : "";
      });
      return obj;
    });

  return {
    headers,
    rows: processedRows
  };
}

// ──────────────────────────────────────────────
// COMPONENT
// ──────────────────────────────────────────────

export default function ImportComponent() {
  const [sheetData, setSheetData] = useState({});
  const [error, setError] = useState(null);
  const [filename, setFilename] = useState(null);
  const [isOver, setIsOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSheet, setActiveSheet] = useState(null);

  async function handleFile(file) {
    try {
      setError(null);
      setFilename(file.name);
      setUploading(true);
      setSheetData({});
      setActiveSheet(null);
  
      if (file.size > 15 * 1024 * 1024) {
        throw new Error("File too large (limit ~15MB for this demo).");
      }
  
      const xlsxMod = await import("xlsx");
      const XLSX = xlsxMod.default || xlsxMod;
  
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
  
      const sheetNames = wb.SheetNames;
      
      if (sheetNames.length === 0) {
        throw new Error("No sheets found in file.");
      }
  
      // Parse ALL sheets dynamically
      const allSheets = {};
      
      sheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const parsedData = sheetToJSONNormalized(ws, XLSX);
        allSheets[sheetName] = parsedData;
      });
  
      // ✅ SAVE TO LOCALSTORAGE FOR LOANS PAGE
      // Find the "Loans" sheet (case insensitive)
      const loansSheetName = sheetNames.find(name => 
        name.toLowerCase().includes('loan') || 
        (allSheets[name]?.headers?.some(h => 
          h.original.toLowerCase().includes('loan') ||
          h.normalized.includes('loan')
        ))
      );
  
      if (loansSheetName && allSheets[loansSheetName]?.rows?.length > 0) {
        const loansData = allSheets[loansSheetName];
        const loansForStorage = loansData.rows.map((row, index) => {
          // Map the dynamic columns to our expected loan structure
          // Try to find common loan fields in the headers
          const headers = loansData.headers;
          
          const findValue = (searchTerms) => {
            for (const term of searchTerms) {
              const header = headers.find(h => 
                h.original.toLowerCase().includes(term) ||
                h.normalized.includes(term)
              );
              if (header && row[header.normalized] !== undefined) {
                return row[header.normalized];
              }
            }
            return null;
          };
  
          // ⚠️ NO PARSING - store values EXACTLY as they appear in Excel
          return {
            id: `loan-${index + 1}-${Date.now()}`,
            loanNumber: findValue(['loan_number', 'loan_no', 'loan', 'id', 'loanid', 'loan#', 'loan #']) || `LN-${index + 1}`,
            propertyName: findValue(['property_name', 'property', 'address', 'property_address', 'property name', 'property_name', 'asset_name', 'asset']) || 'Unknown Property',
            city: findValue(['city', 'location_city', 'city_name', 'property_city']) || '',
            state: findValue(['state', 'location_state', 'state_name', 'property_state']) || '',
            principalBalance: findValue(['principal_balance', 'balance', 'loan_amount', 'amount', 'principal', 'current_balance', 'outstanding', 'loan_balance']),
            status: (() => {
              const statusVal = findValue(['status', 'loan_status', 'current_status', 'performance', 'performing_status']);
              if (!statusVal) return 'performing';
              const statusStr = String(statusVal).toLowerCase();
              if (statusStr.includes('performing') || statusStr.includes('current') || statusStr.includes('active')) return 'performing';
              if (statusStr.includes('watch') || statusStr.includes('watchlist') || statusStr.includes('monitor')) return 'watchlist';
              if (statusStr.includes('default') || statusStr.includes('delinquent') || statusStr.includes('non-performing')) return 'default';
              return 'performing';
            })(),
            riskScore: findValue(['risk_score', 'risk', 'score', 'rating', 'risk_rating', 'internal_rating']),
            nextReviewAt: findValue(['next_review', 'review_date', 'next_date', 'review', 'next_review_date', 'review_date_next']),
            borrowerName: findValue(['borrower_name', 'borrower', 'owner', 'owner_name', 'sponsor', 'client_name', 'customer']),
            maturityDate: findValue(['maturity_date', 'maturity', 'term_end', 'loan_maturity', 'end_date']),
            // ⚠️ NO PARSING - store EXACTLY as in Excel ("5%", "5.00%", etc.)
            interestRate: findValue(['interest_rate', 'rate', 'coupon', 'interest']),
            propertyType: findValue(['property_type', 'type', 'asset_type', 'collateral_type']),
            // ⚠️ NO PARSING - store EXACTLY as in Excel ("75%", "75.5%", etc.)
            loanToValue: findValue(['loan_to_value', 'ltv', 'loan_to_value_ratio']),
            // ⚠️ NO PARSING - store EXACTLY as in Excel
            debtServiceCoverageRatio: findValue(['dscr', 'debt_service_coverage', 'debt_service_coverage_ratio']),
            loanTerm: findValue(['loan_term', 'term', 'duration']),
            
            // Store all raw data for reference
            _rawData: row,
            _headers: headers.map(h => h.original),
            _importDate: new Date().toISOString(),
            _sourceFile: file.name,
            _sheetName: loansSheetName
          };
        }).filter(loan => loan.loanNumber && loan.loanNumber !== 'LN-0');
  
        if (loansForStorage.length > 0) {
          // Merge with existing loans (if any)
          const existingLoans = JSON.parse(localStorage.getItem("bynops_loans") || "[]");
          
          // Create a map of existing loans by loanNumber for deduplication
          const existingLoanMap = {};
          existingLoans.forEach(loan => {
            existingLoanMap[loan.loanNumber] = loan;
          });
          
          // Update or add new loans
          loansForStorage.forEach(newLoan => {
            existingLoanMap[newLoan.loanNumber] = {
              ...existingLoanMap[newLoan.loanNumber],
              ...newLoan,
              _lastUpdated: new Date().toISOString()
            };
          });
          
          const updatedLoans = Object.values(existingLoanMap);
          
          // Save to localStorage
          localStorage.setItem("bynops_loans", JSON.stringify(updatedLoans));
          console.log(`Saved ${loansForStorage.length} loans to localStorage (total: ${updatedLoans.length})`);
          
          setError(null);
        } else {
          console.warn("No valid loans found in the import");
        }
      } else {
        console.warn("No 'Loans' sheet found or sheet is empty");
      }
  
      // Also save the raw sheet data for reference
      localStorage.setItem("bynops_excel_data", JSON.stringify({
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        sheetCount: sheetNames.length,
        sheets: sheetNames,
        sheetData: Object.keys(allSheets).reduce((acc, key) => {
          acc[key] = {
            rowCount: allSheets[key].rows.length,
            columnCount: allSheets[key].headers.length,
            headers: allSheets[key].headers.map(h => h.original)
          };
          return acc;
        }, {})
      }));
  
      // Save the raw sheet data for display in ImportComponent
      setSheetData(allSheets);
      
      // Set the first non-empty sheet as active
      const firstSheetWithData = sheetNames.find(name => 
        allSheets[name]?.headers?.length > 0
      ) || sheetNames[0];
      
      setActiveSheet(firstSheetWithData);
      setUploading(false);
  
      console.debug("[import] All sheets data:", allSheets);
      console.debug("[import] Saved loans to localStorage");
  
    } catch (e) {
      console.error("[import] parse error:", e);
      setSheetData({});
      setActiveSheet(null);
      setUploading(false);
      setError(e?.message || "Failed to parse file.");
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setIsOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  const handleNavigateToLoans = () => {
    window.location.href = "/loans";
  };

  const handleNavigateToDocuments = () => {
    window.location.href = "/documents";
  };

  // Format cell value for display - SHOW EXACTLY AS STORED
  const formatCellValue = (value) => {
    if (value == null || value === "") {
      return <span className="text-gray-400 italic">empty</span>;
    }
    
    // Check if it's a date
    if (value instanceof Date) {
      try {
        return new Date(value).toLocaleDateString();
      } catch (e) {
        return String(value);
      }
    }
    
    // ⚠️ NO SPECIAL FORMATTING - show EXACTLY as stored
    const str = String(value);
    if (str.length > 50) {
      return str.substring(0, 47) + "...";
    }
    
    return str;
  };

  // Render sheet preview table
  const renderSheetTable = (sheetName) => {
    const data = sheetData[sheetName];
    if (!data || !data.headers || data.headers.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data found in this sheet
        </div>
      );
    }

    const { headers, rows } = data;
    
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div className="sticky top-0 z-10 bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-medium text-gray-900">{sheetName}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {rows.length} rows × {headers.length} columns
          </p>
        </div>
        
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-700 border-r bg-gray-100 sticky left-0 z-20">
                  Row
                </th>
                {headers.map((header, idx) => (
                  <th 
                    key={idx} 
                    className="text-left px-4 py-3 text-xs font-medium text-gray-700 min-w-[150px] border-r hover:bg-gray-100 group relative"
                    title={`${header.original} (${header.normalized})`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">
                        {header.original}
                      </span>
                      {header.normalized !== "_empty_" && header.normalized !== header.original.toLowerCase().replace(/\s+/g, "_") && (
                        <span className="text-xs text-gray-400 ml-2 font-normal hidden group-hover:inline">
                          {header.normalized}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`hover:bg-gray-50 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-4 py-2 text-xs text-gray-500 border-r bg-gray-50 sticky left-0 z-10">
                    {rowIndex + 1}
                  </td>
                  {headers.map((header, colIndex) => (
                    <td 
                      key={colIndex} 
                      className="px-4 py-2 text-xs text-gray-700 border-r min-w-[150px] max-w-[300px]"
                      title={row[header.normalized] != null && row[header.normalized] !== "" ? 
                        String(row[header.normalized]) : "Empty cell"
                      }
                    >
                      <div className="truncate">
                        {formatCellValue(row[header.normalized])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {rows.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No data rows found in this sheet
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 overflow-auto">
        <div className="p-4 lg:p-6 xl:p-8 w-full max-w-[95vw] mx-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">
                  Excel File Preview
                </h1>
                <p className="text-gray-500 text-sm lg:text-base mt-1">
                  Upload an Excel (.xlsx) file to preview all sheets and columns exactly as they appear
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleNavigateToLoans} 
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm lg:text-base whitespace-nowrap"
                >
                  Go to Loans →
                </button>
              </div>
            </div>

            {/* Upload Section */}
            <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6">
              <h2 className="font-medium text-lg mb-4">Upload Excel File</h2>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsOver(true);
                }}
                onDragLeave={() => setIsOver(false)}
                onDrop={onDrop}
                className={`group relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 lg:p-8 text-center transition ${
                  isOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                } ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div className="text-sm text-gray-600">Processing file...</div>
                  </div>
                ) : (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" className="opacity-70 text-gray-500">
                      <path
                        fill="currentColor"
                        d="M19 15v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4H3l9-9l9 9h-2zm-7-7l-5 5v5h10v-5z"
                      />
                    </svg>
                    <div className="text-sm">
                      <span className="font-medium text-gray-800">Drag & drop</span> your Excel here
                      <span className="mx-1 text-gray-400">or</span>
                      <label className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                        browse
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFile(f);
                          }}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    <div className="text-xs text-gray-500">
                      Max ~15MB • All sheets and columns will be displayed exactly as they appear
                    </div>
                  </>
                )}
              </div>

              {/* File info */}
              {filename && (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border bg-gray-50 px-4 py-3 text-sm">
                  <div className="truncate">
                    <span className="font-medium text-gray-800">{filename}</span>
                    <span className="text-gray-600 ml-2">
                      — {Object.keys(sheetData).filter(name => sheetData[name]?.headers?.length > 0).length} sheet{Object.keys(sheetData).filter(name => sheetData[name]?.headers?.length > 0).length !== 1 ? 's' : ''} loaded
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {activeSheet && sheetData[activeSheet]?.rows && (
                      <span className="text-green-600 font-medium">
                        {sheetData[activeSheet].rows.length} rows × {sheetData[activeSheet].headers.length} columns
                      </span>
                    )}
                    <button
                      className="text-gray-600 hover:text-gray-800 hover:underline text-sm"
                      onClick={() => {
                        setSheetData({});
                        setActiveSheet(null);
                        setFilename(null);
                        setError(null);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <div className="font-medium">Error</div>
                  <div className="mt-1">{error}</div>
                </div>
              )}
            </div>

            {/* Sheet Preview */}
            {activeSheet && sheetData[activeSheet] && sheetData[activeSheet].headers.length > 0 && (
              <div className="rounded-xl lg:rounded-2xl border bg-white p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <h2 className="font-medium text-lg">
                    Sheet Preview
                  </h2>
                  
                  {/* Sheet selector tabs */}
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(sheetData)
                      .filter(sheetName => sheetData[sheetName]?.headers?.length > 0)
                      .map(sheetName => (
                      <button
                        key={sheetName}
                        onClick={() => setActiveSheet(sheetName)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          activeSheet === sheetName
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        {sheetName}
                        <span className="ml-1.5 text-xs opacity-75">
                          ({sheetData[sheetName].rows.length})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sheet info */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Active sheet:</span>
                      <span className="font-medium text-gray-900 ml-2">{activeSheet}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rows:</span>
                      <span className="font-medium text-gray-900 ml-2">
                        {sheetData[activeSheet].rows.length.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Columns:</span>
                      <span className="font-medium text-gray-900 ml-2">
                        {sheetData[activeSheet].headers.length}
                      </span>
                    </div>
                    <div className="flex-1"></div>
                    <button
                      onClick={() => {
                        // Copy headers to clipboard
                        const headers = sheetData[activeSheet].headers.map(h => h.original).join('\t');
                        const rows = sheetData[activeSheet].rows.map(row => 
                          sheetData[activeSheet].headers.map(h => 
                            row[h.normalized] != null ? String(row[h.normalized]) : ""
                          ).join('\t')
                        ).join('\n');
                        const csv = headers + '\n' + rows;
                        navigator.clipboard.writeText(csv);
                        alert('Data copied to clipboard as TSV!');
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Copy data (TSV)
                    </button>
                  </div>
                </div>

                {/* Data table */}
                {renderSheetTable(activeSheet)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}