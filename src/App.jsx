import { useState } from 'react';
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
  
  const { 
    categories,
    products, 
    inventory,
    toppings,
    flavors,
    sales, 
    saveSale, 
    updateInventory,
    loading,
    isConnected
  } = useData();

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Navigation sidebar */}
      <Sidebar
        view={view}
        setView={setView}
        cartCount={cartCount}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-60">
        <TopBar view={view} onMenuClick={() => setSidebarOpen(true)} isConnected={isConnected} />

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
                />
              )}
              {view === 'settings' && (
                <SettingsPage 
                  toppings={toppings}
                  flavors={flavors}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
