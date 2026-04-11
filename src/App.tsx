import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Calculator, 
  Settings, 
  Menu, 
  X,
  Moon,
  Sun,
  LogOut,
  Wifi,
  WifiOff,
  Building2,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, User as UserType } from './db';
import { SyncService } from './SyncService';
import { Logo, LogoFull } from './components/Logo';

// Views
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Zakat from './components/Zakat';
import Reports from './components/Reports';
import SettingsView from './components/Settings';
import Login from './components/Login';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';

export default function App() {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default to dark as requested
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    SyncService.startAutoSync();
    
    // Clear Zakat history on app startup as requested
    db.zakat.clear();

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing data...');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Working offline. Changes will sync later.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (settings?.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
      // Generate a lighter version for shadows/hover if needed, or just use the same
      document.documentElement.style.setProperty('--primary-color-light', `${settings.primaryColor}33`); // 20% opacity
    }
  }, [settings?.primaryColor]);

  const navRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (navRef.current) {
      const activeElement = navRef.current.querySelector(`[data-active="true"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeView]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'cashier'] },
    { id: 'sales', label: 'Point of Sale', icon: ShoppingCart, roles: ['admin', 'cashier'] },
    { id: 'transactions', label: 'Transactions', icon: History, roles: ['admin', 'cashier'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['admin'] },
    { id: 'accounts', label: 'Accounts & Debt', icon: Users, roles: ['admin', 'cashier'] },
    { id: 'zakat', label: 'Zakat System', icon: Calculator, roles: ['admin'] },
    { id: 'reports', label: 'Reports', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    currentUser && item.roles.includes(currentUser.role)
  );

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard onViewAllTransactions={() => setActiveView('transactions')} />;
      case 'inventory': return <Inventory />;
      case 'accounts': return <Accounts />;
      case 'sales': return <Sales />;
      case 'transactions': return <Transactions />;
      case 'zakat': return <Zakat />;
      case 'reports': return <Reports />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard />;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('dashboard');
    toast.info('Logged out successfully');
  };

  if (!currentUser) {
    return (
      <div className="transition-colors duration-300">
        <Toaster position="top-right" theme={isDarkMode ? 'dark' : 'light'} />
        <Login onLogin={setCurrentUser} />
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark' : ''} bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-300`}>
      <Toaster position="top-right" theme={isDarkMode ? 'dark' : 'light'} />
      
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="hidden lg:flex bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col z-20 transition-colors duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="truncate"
              >
                <LogoFull color="var(--primary-color)" />
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
                activeView === item.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary-light' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <item.icon size={22} className={isSidebarOpen ? 'mr-3' : 'mx-auto'} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className={`flex items-center p-3 rounded-xl ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
            {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
            {isSidebarOpen && (
              <span className="ml-3 text-xs font-semibold uppercase tracking-wider">
                {isOnline ? 'Cloud Synced' : 'Offline Mode'}
              </span>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center p-3 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={22} className={isSidebarOpen ? 'mr-3' : 'mx-auto'} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Bottom Nav */}
      <nav 
        ref={navRef}
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-2 py-1 flex overflow-x-auto no-scrollbar items-center z-50 pb-safe transition-colors duration-300 scroll-smooth"
      >
        <div className="flex min-w-full justify-around items-center gap-1 px-2">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              data-active={activeView === item.id}
              className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[64px] flex-shrink-0 ${
                activeView === item.id ? 'text-primary bg-primary/5' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              <item.icon size={20} className={activeView === item.id ? 'scale-110' : ''} />
              <span className={`text-[9px] font-bold mt-1 uppercase tracking-tighter ${activeView === item.id ? 'opacity-100' : 'opacity-70'}`}>
                {item.label.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Logo className="w-8 h-8" color="var(--primary-color)" />
            </div>
            <h2 className="text-base lg:text-lg font-bold text-zinc-800 dark:text-zinc-100 capitalize">
              {activeView.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            {!isOnline && (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase">
                <WifiOff size={12} />
                Offline
              </div>
            )}
            
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold border border-primary/20 text-primary">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </header>
        
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
