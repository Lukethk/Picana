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
import { useLocalStorage } from './hooks/useLocalStorage';
import { useData } from './hooks/useData';

export default function App() {
  const [view, setView] = useState('pos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cart, setCart] = useLocalStorage('acai_cart', []);
  const [businessName, setBusinessName] = useLocalStorage('acai_business_name', 'La Picana');
  const [theme, setTheme] = useLocalStorage('acai_theme', 'light');
  
  const { 
    categories,
    products, 
    inventory,
    toppings,
    flavors,
    sales, 
    settings,
    saveSale, 
    deleteSale,
    saveBusinessSettings,
    updateInventory,
    loading,
    isConnected,
    refresh
  } = useData();

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
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
                />
              )}
              {view === 'inventory' && (
                <InventoryPage 
                  inventory={inventory} 
                  onUpdateInventory={updateInventory} 
                />
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
