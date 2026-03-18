import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import MenuPage from './pages/MenuPage';
import SettingsPage from './pages/SettingsPage';
import ExtrasPage from './pages/ExtrasPage';
import LoginPage from './pages/LoginPage';
import ExpensesPage from './pages/ExpensesPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useData } from './hooks/useData';
import { authService } from './services/authService';
import CashControl from './components/layout/CashControl';

export default function App() {
  const [view, setView] = useState('pos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cart, setCart] = useLocalStorage('acai_cart', []);
  const [businessName, setBusinessName] = useLocalStorage('acai_business_name', 'La Picana');
  const [theme, setTheme] = useLocalStorage('acai_theme', 'light');
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState(null);
  
  const { 
    categories,
    products, 
    inventory,
    toppings,
    flavors,
    sales, 
    hasMoreSales,
    loadMoreSales,
    expenses,
    settings,
    saveSale, 
    deleteSale,
    saveBusinessSettings,
    updateInventory,
    loading: dataLoading,
    isConnected,
    refresh
  } = useData();

  useEffect(() => {
    // Check initial session
    authService.getSession().then(s => {
      setSession(s);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme]);

  if (authLoading || (session && dataLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-medium animate-pulse">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Navigation sidebar */}
      <Sidebar
        businessName={businessName}
        view={view}
        setView={setView}
        cartCount={cartCount}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        user={session?.user}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-60">
        <TopBar
          view={view}
          businessName={businessName}
          onMenuClick={() => setSidebarOpen(true)}
          isConnected={isConnected}
          onReconnect={refresh}
        />

        <CashControl onShiftChange={setCurrentShift} />

        <main className="flex-1 p-5 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full"
            >
              {view === 'pos' && (
                <POSPage 
                  cart={cart} 
                  setCart={setCart} 
                  products={products} 
                  categories={categories}
                  toppings={toppings}
                  flavors={flavors}
                  onSaveSale={saveSale}
                  businessName={businessName}
                  settings={settings}
                  currentShift={currentShift}
                />
              )}
              {view === 'inventory' && (
                <InventoryPage 
                  inventory={inventory} 
                  onUpdateInventory={updateInventory} 
                />
              )}
              {view === 'expenses' && (
                <ExpensesPage />
              )}
              {view === 'menu' && (
                <MenuPage 
                  products={products}
                  categories={categories}
                  onManageExtras={() => setView('extras')}
                  onRefresh={refresh}
                />
              )}
              {view === 'extras' && (
                <ExtrasPage 
                  onBack={() => setView('menu')}
                />
              )}
              {view === 'reports' && (
                <ReportsPage 
                  sales={sales} 
                  hasMoreSales={hasMoreSales}
                  onLoadMoreSales={loadMoreSales}
                  expenses={expenses}
                  products={products}
                  toppings={toppings}
                  flavors={flavors}
                  onDeleteSale={deleteSale}
                  businessName={businessName}
                  settings={settings}
                />
              )}
              {view === 'settings' && (
                <SettingsPage 
                  businessName={businessName}
                  setBusinessName={setBusinessName}
                  theme={theme}
                  setTheme={setTheme}
                  settings={settings}
                  onSaveSettings={saveBusinessSettings}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
