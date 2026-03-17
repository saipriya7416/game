import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShoppingBag, Package, FileText, 
  Receipt, BookOpen, Wallet, BarChart3, Settings,
  Store, Menu, X, Bell, Search, LogOut
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Suppliers', path: '/suppliers', icon: Users },
  { name: 'Buyers', path: '/buyers', icon: ShoppingBag },
  { name: 'Inventory', path: '/inventory', icon: Package },
  { name: 'Supplier Bills', path: '/supplier-bills', icon: FileText },
  { name: 'Buyer Invoices', path: '/buyer-invoices', icon: Receipt },
  { name: 'Ledgers', path: '/ledgers', icon: BookOpen },
  { name: 'Expenses', path: '/expenses', icon: Wallet },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentRouteName = navItems.find(item => item.path === location.pathname)?.name || 'Dashboard';

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden text-gray-900">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-gray-300 flex flex-col transition-transform duration-300 ease-in-out shadow-xl md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 bg-gray-950 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 text-gray-900 p-1.5 rounded-lg">
              <Store size={22} strokeWidth={2.5}/>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Mandi<span className="text-yellow-400">Pro</span></span>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-yellow-400 text-gray-900 shadow-md font-medium' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white group'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} className={isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-white'} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* User Profile Area */}
        <div className="p-4 bg-gray-950 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-yellow-400 flex items-center justify-center font-bold text-white shrink-0">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@mandipro.in</p>
            </div>
            <button className="text-gray-500 hover:text-red-400 transition-colors shrink-0">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-700 focus:outline-none md:hidden"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800 truncate">{currentRouteName}</h1>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 w-48 lg:w-64 transition-all"
              />
            </div>
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded-full hover:bg-gray-100">
              <Bell size={22} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
          </div>
        </header>

        {/* Main Scrolling Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}
