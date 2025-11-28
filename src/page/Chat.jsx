import React from 'react';
import "./chat.css"
import logo from "../assets/BynopsLogo.png";
import attachment from "../assets/attatchment-01.svg"
import send from "../assets/send.svg"
import clean from "../assets/clean.svg"
import star from "../assets/star.svg"
import warn from "../assets/warn.svg"
import { useAuth } from '../context/AuthContext';

const LeftPanel = ({ title = "Left Panel", backgroundColor = "#2d3748", children, status = "Performing" }) => {
  const { currentUser, userData } = useAuth();
  
  const statusColors = {
    Performing: "#1dbf52",
    Watchlist: "#f5a623",
    Defeased: "#0fa3e6",
    "Paid Off": "#777"
  };
// Helper function to get user initials
    const getUserInitials = (fullName) => {
      if (!fullName) return 'U';
  
      return fullName
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .join('')
       .slice(0, 2); // Get max 2 initials
      };
  return (
    <div className="chat-root">
      <header className="pp-topbar">
        <div className="pp-left">
        <img src={logo} alt="logo" className="pp-head-logo" />
          <div>
          <div className="pp-plan">Standard plan</div>
          <div 
            className="pp-status" 
            style={{ color: statusColors[status] }}
          >
            • {status}
          </div>
          </div>
         
        </div>

        <div className="pp-right">
        <div className="pp-user">
          <div className="gg-icon">
            {getUserInitials(userData?.fullName)}
          </div>
        <span>{userData?.fullName || 'User'}</span>
        </div>
        </div>
      </header>

      {/* Main */}
      <main className="pp-main">
        <img src={logo} alt="logo" className="pp-logo" />
        <div className="pp-version">Ver 4.0 Mar 14</div>

        <section className="pp-cards">
          <div className="pp-col">
            <div className="pp-card pp-large">
              <div className="pp-icon">✦</div>
              <h4>Examples</h4>
              <p className="pp-link">
                Provide a list maturity notice letter for all loans with an upcoming
                maturity within the next 12 months.
              </p>
            </div>

            <div className="pp-card pp-small pp-link">
              What's the exposure if this property's occupancy drops 30%
            </div>

            <div className="pp-card pp-small pp-link">
              Identify which loans require quarterly DSCR reporting and when the next
              submission is due.
            </div>
          </div>

          <div className="pp-col">
            <div className="pp-card pp-large pp-muted">
              <div className="pp-icon"><img src={star} alt="" /></div>
              Create a report showing my weighted average DSCR and occupancy across my
              portfolio.
            </div>

            <div className="pp-card pp-medium pp-muted">
              Summarize all properties with floating-rate debt and show the impact of a
              200bps interest rate increase.
            </div>

            <div className="pp-card pp-medium pp-muted">
              Run a stress test assuming rents decline 10% and expenses rise 5% — what
              happens to coverage ratios?
            </div>
          </div>

          <div className="pp-col">
            <div className="pp-card pp-large pp-muted">
              <div className="pp-icon"><img src={warn} alt="" /></div>
              Research the Loan Agreement and confirm if this Lease needs Lender
              approval.
            </div>

            <div className="pp-card pp-medium pp-muted">
              Calculate portfolio-wide leverage (LTV) based on most recent valuations.
            </div>

            <div className="pp-card pp-medium pp-muted">
              Confirm if the Loan Agreement permits distributions at the current DSCR
              level.
            </div>
          </div>
        </section>

        <div className="pp-search-wrap">
          <div className="pp-new-row">
            <button className="pp-new">
              <img src={clean} alt="" /> New dialog
            </button>
          </div>

          <div className="pp-search">
            <div className="pp-search-icon"><img src={attachment} alt="" /></div>
            <input className="pp-input" placeholder="What's the DSCR without Target?" />
            <button className="pp-mic"><img src={send} alt="" /></button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LeftPanel;