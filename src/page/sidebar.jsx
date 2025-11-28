import React, { useState }  from 'react';
import "./chat.css"
import logo from "../assets/BynopsLogo.png";
import "./PropertyReport.css";
import chevron from "../assets/chevron.svg"

const RightPanel = ({ 
  title = "Right Panel", 
  backgroundColor = "#4a5568", 
  children,
  status: externalStatus,
  onStatusChange,
  loading = false
}) => {
  const [internalStatus, setInternalStatus] = useState("Performing");
  const [open, setOpen] = useState(false);

  // Use external status if provided, otherwise use internal state
  const status = externalStatus !== undefined ? externalStatus : internalStatus;

  const statusColors = {
    Performing: "#1dbf52",
    Watchlist: "#f5a623",
    Defeased: "#0fa3e6",
    "Paid Off": "#777"
  };

  const statuses = ["Performing", "Watchlist", "Defeased", "Paid Off"];

  const handleStatusChange = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    } else {
      setInternalStatus(newStatus);
    }
    setOpen(false);
  };

  return (
    <div>
      <div className="sidebar">
        <div className="sidebar-header">
          <img src={logo} className="sidebar-logo" alt="" />
        </div>

        <div className="report-container">
          {/* Header */}
          <div className="status-bar" onClick={() => !loading && setOpen(!open)}>
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
            <div className="dropdown-menu">
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

          {/* Top 5 Tenants */}
          <div className="card">
            <div className="section-date">12/31/2024</div>
            <table className="table">
              <thead>
                <tr>
                  <th>Top 5 Tenants</th>
                  <th>Sqft</th>
                  <th>NRA</th>
                  <th>LXD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Target</td><td>30,000</td><td>20%</td><td>12/31/2025</td>
                </tr>
                <tr>
                  <td>DWS</td><td>20,000</td><td>18%</td><td>03/01/2040</td>
                </tr>
                <tr>
                  <td>Express</td><td>15,000</td><td>17%</td><td>06/01/2035</td>
                </tr>

                {/* Bankruptcy Highlight Row */}
                <tr className="alert-row">
                  <td colSpan={4} className="alert-label">⚠ Big Lots Bankruptcy</td>
                </tr>
                <tr className="highlight-row">
                  <td>Big Lots</td><td>10,000</td><td>15%</td><td>04/01/2027</td>
                </tr>

                <tr>
                  <td>American Eagle</td><td>8,000</td><td>10%</td><td>07/01/2041</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* UW Table */}
          <div className="card">
            <table className="table uw-table">
              <thead>
                <tr>
                  <th>UW</th>
                  <th>12/31/2022</th>
                  <th>12/31/2023</th>
                  <th>12/31/2024</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>EGI</td><td>$1,200,000</td><td>$1,300,000</td><td>$1,600,000</td></tr>
                <tr><td>Expenses</td><td>$800,000</td><td>$900,000</td><td>$1,100,000</td></tr>
                <tr><td>Net Income</td><td>$400,000</td><td>$400,000</td><td>$500,000</td></tr>
                <tr><td>Debt</td><td>$200,000</td><td>$200,000</td><td>$200,000</td></tr>
                <tr><td>DSCR</td><td>2.00x</td><td>2.60x</td><td>2.50x</td></tr>
              </tbody>
            </table>
          </div>

          {/* DSCR Bar */}
          <div className="card">
            <div className="dscr-label">DSCR</div>
            <div className="dscr-bar">
              <div className="bar-fill" style={{ width: "75%" }}></div>
            </div>
            <div className="dscr-values">
              <span>1.0</span><span>1.25</span><span>1.5+</span>
            </div>

            <div className="trigger-banner">⚠ DSCR TRIGGER</div>
          </div>

          {/* Cash Management */}
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

          {/* Trigger Table */}
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

          {/* Inspection */}
          <div className="card">
            <div className="section-header">Inspection</div>

            <div className="inspect-grid">
              <div><b>Company:</b> 1234 Inspections</div>
              <div><b>Date:</b> 01/01/2025</div>
              <div><b>Grade:</b> 3</div>
              <div><b>Deferred Maintenance (DM):</b> Yes</div>
              <div><b>Life Safety (LS):</b> Yes</div>
            </div>

            <div className="inspection-notes">
              <b>Notes:</b> The inspector noted the following DM/LS – Broken window and down unit.
            </div>

            <div className="attachments">
              📄 1234 Inspections.pdf
            </div>
          </div>

          {/* Reserves */}
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Reserves</th>
                  <th>Monthly</th>
                  <th>Balance</th>
                </tr>
              </thead>

              <tbody>
                <tr><td>Replacement Reserve</td><td>$15,000</td><td>$980,000</td></tr>
                <tr><td>Capital Improvement</td><td>$8,000</td><td>$1,200,000</td></tr>
                <tr><td>Immediate Repairs</td><td>$0.00</td><td>$100,000</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;