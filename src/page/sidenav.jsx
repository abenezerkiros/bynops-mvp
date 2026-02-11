import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/BynopsLogo.png";
const items = [
  { href: "/overview", label: "Overview" },
  { href: "/loans", label: "Loans" },
  { href: "/tasks", label: "Tasks" },
  { href: "/documents", label: "Documents" },
];
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { logout } = useAuth();


  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }
  const LogoImage = () => (
    <div 
      style={{ 
        width: 28, 
        height: 28, 
        backgroundColor: '#3b82f6', 
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14
      }}
    >
      B
    </div>
  );

  const handleNavigation = (href) => {
    navigate(href);
  };

  const handleDash = (href) => {
    navigate("/overview");
  };
  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      {/* Brand */}
      <div onClick={() => handleDash()} className="flex items-center gap-3 px-5 h-16 border-b">
      <img 
  src={logo} 
  alt="Logo"
  className="object-contain w-auto h-auto max-w-full max-h-full"
/>

      </div>

      {/* Nav */}
      <nav className="px-3 py-4">
        <ul className="space-y-1">

          {items.map((item) => {
            const active =
              currentPath === item.href ||
              (item.href !== "/dashboard" && currentPath?.startsWith(item.href));

            const linkClass = active
              ? "block rounded-md px-3 py-2 text-sm transition bg-slate-900 text-white"
              : "block rounded-md px-3 py-2 text-sm transition text-slate-700 hover:bg-slate-100";

            return (
              <li key={item.href}>
                <button
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full text-left ${linkClass}`}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        <button
  onClick={handleLogout}
  className="
    flex items-center gap-2
    px-3 py-1.5
    text-sm font-medium
    !text-white
    bg-red-600
    rounded-md
    hover:bg-red-700
    active:bg-red-800
    transition
    h-7
  "
>

  <span>Logout</span>
</button>
        </ul>
      </nav>
    </aside>
  );
}