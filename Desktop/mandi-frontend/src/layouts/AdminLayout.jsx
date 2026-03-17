import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, Users, UserSquare2, 
  PackageSearch, Receipt, FileText, BookOpen, 
  Wallet, BarChart3, Settings, Bell, UserCircle
} from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Suppliers', path: '/suppliers', icon: Users },
    { name: 'Buyers', path: '/buyers', icon: UserSquare2 },
    { name: 'Inventory', path: '/inventory', icon: PackageSearch },
    { name: 'Supplier Bills', path: '/supplier-bills', icon: Receipt },
    { name: 'Buyer Invoices', path: '/buyer-invoices', icon: FileText },
    { name: 'Ledgers', path: '/ledgers', icon: BookOpen },
    { name: 'Expenses', path: '/expenses', icon: Wallet },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-dark-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-dark-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-dark-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-dark-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold text-dark-800">MandiTrade</span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-dark-500 hover:text-dark-700"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700 font-medium' 
                    : 'text-dark-600 hover:bg-dark-50 hover:text-dark-900'
                }`
              }
            >
              <item.icon size={20} className={({ isActive }) => isActive ? 'text-primary-600' : 'text-dark-400'} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-dark-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 sticky top-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-dark-500 hover:text-dark-700"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <button className="text-dark-500 hover:text-dark-700 relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                <UserCircle size={20} />
              </div>
              <span className="text-sm font-medium text-dark-700 hidden sm:block">Admin User</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
