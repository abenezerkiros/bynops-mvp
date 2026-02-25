import React, { useState, useRef, useEffect } from 'react';
import "./chat.css"
import logo from "../assets/BynopsLogo.png";
import attachment from "../assets/attatchment-01.svg"
import send from "../assets/send.svg"
import clean from "../assets/clean.svg"
import star from "../assets/star.svg"
import warn from "../assets/warn.svg"
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LeftPanel = ({ title = "Left Panel", backgroundColor = "#2d3748", children, status = "Performing", selectedLoanDetails }) => {
  const { currentUser, userData } = useAuth();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ai-chat');
  const sidebarRef = useRef(null);


  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Handle click outside to close sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsHistoryOpen(false);
      }
    };

    if (isHistoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHistoryOpen]);

  const statusColors = {
    Performing: "#1dbf52",
    Watchlist: "#f5a623",
    Defeased: "#0fa3e6",
    "Paid Off": "#777"
  };

  const getUserInitials = (fullName) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  // Tabs configuration
  const tabs = [
    { id: 'ai-chat', label: 'AI Chat' },
    { id: 'party-chat', label: 'Party Chat' },
    { id: 'loan-summary', label: 'Loan Summary' },
    { id: 'sponsor-info', label: 'Sponsor Information' },
    { id: 'permits-liens', label: 'Permit/Liens' },
    { id: 'notes', label: 'Notes' }
  ];

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai-chat':
        return (
          <div className="flex-1 flex flex-col items-center text-center px-4">
            {/* Heading */}
            <h1 className="text-[36px] font-semibold text-[#2f8f6b] mt-3">
              What can I help you with today?
            </h1>

            {/* Subtext */}
            <p className="max-w-[720px] mt-4 text-[15px] leading-6 text-gray-500">
              <span className="font-medium text-gray-700">AMP Social:</span> The
              relationship status is positive and engaged, with consistent
              communication and meeting scheduling, though implementation progress
              has been delayed due to client travel and competing priorities.
            </p>

            {/* Section Title */}
            <div className="w-full max-w-[980px] mt-5 text-left">
              <p className="text-[15px] text-gray-700 font-medium">
                Let's get started:
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 w-full max-w-[980px]">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 text-left hover:shadow-md transition">
                <p className="mt-1 text-[14px] text-gray-500">
                  Provide a list maturity notice letter for all loans with an upcoming maturity within
                  the next 12 months
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 text-left hover:shadow-md transition">
                <p className="mt-1 text-[14px] text-gray-500">
                  Create a report showing weighted average DSCR and occupancy across this
                  portfolio.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 text-left hover:shadow-md transition">
                <p className="mt-1 text-[14px] text-gray-500">
                  Does this lease need lender approval?
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 text-left hover:shadow-md transition">
                <p className="mt-1 text-[14px] text-gray-500">
                  What's the exposure if this property's occupancy drops 30%?
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 text-left hover:shadow-md transition">
                <p className="mt-1 text-[14px] text-gray-500">
                  Summarize all properties with floating-rate debt and show the impact of a 200bps
                  interest rate increase.
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 text-left hover:shadow-md transition">
                <p className="mt-1 text-[14px] text-gray-500">
                  Calculate portfolio-wide leverage (LTV) based on most recent valuations.
                </p>
              </div>
            </div>
          </div>
        );

      case 'party-chat':
        return (
          <div className="flex-1 flex flex-col items-center px-4 py-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Party Chat</h2>
            <div className="w-full max-w-[980px] bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
              Party chat coming soon...
            </div>
          </div>
        );

      case 'loan-summary':
        return (
          <div className="flex-1 flex flex-col items-center px-4 py-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Loan Summary</h2>
            <div className="w-full max-w-[980px] bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
              Loan summary content coming soon...
            </div>
          </div>
        );

      case 'sponsor-info':
        const sponsorInfo = selectedLoanDetails?._rawData?.sponsor_information;
        
        return (
          <div className="flex-1 flex flex-col items-center px-4 py-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">{selectedLoanDetails?._rawData?.sponsor_name}</h2>
            
            {sponsorInfo ? (
              <div className="w-full max-w-[980px] bg-white rounded-2xl border border-gray-200 p-6">
              {selectedLoanDetails?._rawData?.sponsor_information}
              </div>
            ) : (
              <div className="w-full max-w-[980px] bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
                No sponsor information available
              </div>
            )}
          </div>
        );

      case 'permits-liens':
        return (
          <div className="flex-1 flex flex-col items-center px-4 py-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Permits & Liens</h2>
            <div className="w-full max-w-[980px] bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
              Permits and liens information coming soon...
            </div>
          </div>
        );

      case 'notes':
        return (
          <div className="flex-1 flex flex-col items-center px-4 py-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Notes</h2>
            <div className="w-full max-w-[980px] bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
              Notes coming soon...
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="chat-root">
      <header className="pp-topbar">
        <div className="pp-left">
          <Link to="/overview">BACK TO OVERVIEW</Link>
        </div>

        <div className="pp-right">
          <div className="pp-user">
            <div className="gg-icon">
              {getUserInitials(userData?.fullName)}
            </div>
            <span>{userData?.fullName || 'User'}</span>
            <button
              onClick={handleLogout}
              className="
                flex items-center gap-2
                px-3 py-1.5
                text-sm font-medium
                !text-white
                bg-black
                rounded-md
                hover:bg-red-700
                active:bg-red-800
                transition
                h-7
              "
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="pp-main">
        <div className="min-h-screen flex flex-col relative mt-10" >
          {/* Top Bar with Chat History and Tabs */}
          <div className="flex items-center justify-between px-8 pt-6 border-b border-gray-200">
            {/* Tabs */}
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-t-lg transition
                    ${activeTab === tab.id
                      ? 'text-[#2f8f6b] border-b-2 border-[#2f8f6b] bg-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Chat History Button */}
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              <span className="text-lg">←</span>
              Chat history
            </button>
          </div>

          {/* Chat History Sidebar */}
          {isHistoryOpen && (
            <>
              {/* Overlay */}
              <div className="fixed inset-0 bg-black bg-opacity-0 z-40" />
              
              {/* Sidebar */}
              <div 
                ref={sidebarRef}
                className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Chat history</h2>
                  <button 
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Content - you can add chat history items here later */}
                <div className="p-4">
                  {/* Chat history items will go here */}
                  <p className="text-gray-500 text-center">No chat history yet</p>
                </div>
              </div>
            </>
          )}

          {/* Tab Content */}
          {renderTabContent()}

          {/* Bottom Input - Only show for AI Chat tab */}
          {activeTab === 'ai-chat' && (
            <div className="w-full flex justify-center px-4 pb-10 mb-5">
              <div className="w-full max-w-[980px]">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4">
                    <input
                      type="text"
                      placeholder="Ask me anything"
                      className="w-full outline-none text-[15px] placeholder-gray-400"
                    />
                  </div>

                  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-sm text-gray-500">
                    <button className="flex items-center gap-2 hover:text-gray-700 transition">
                      <span>📎</span>
                      Attach
                    </button>

                    <div className="flex items-center gap-6">
                      <button className="hover:text-gray-700 transition">
                        Reset chat
                      </button>

                      <button className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                        ↑
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeftPanel;