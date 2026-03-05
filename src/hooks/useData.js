
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { productService } from '../services/productService';
import { toppingService } from '../services/toppingService';
import { flavorService } from '../services/flavorService';
import { salesService } from '../services/salesService';
import { inventoryService } from '../services/inventoryService';
import { settingsService } from '../services/settingsService';
import { CUPS } from '../data/products';
import { DEFAULT_INVENTORY } from '../data/inventory';

export function useData() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [toppings, setToppings] = useState([]); 
    const [flavors, setFlavors] = useState([]); // Add flavors state
    const [sales, setSales] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // Legacy fallback
    const loadLocalData = useCallback(() => {
        console.warn('Cargando datos locales de respaldo...');
        setCategories([{ id: 'default', name: 'General' }]);
        setProducts(CUPS.map(p => ({ ...p, category_id: 'default' })));
        setToppings([]); // No toppings in fallback for now
        setInventory(DEFAULT_INVENTORY);
        setSales(JSON.parse(localStorage.getItem('acai_orders')) || []);
        setIsConnected(false);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            console.log("Iniciando carga de datos (Servicios)...");

            // Health check via simple query - Retry mechanism or less strict check
            const { error: healthCheck } = await supabase.from('categories').select('count', { count: 'exact', head: true });
            
            if (healthCheck) {
                 console.warn("Health check failed, trying to reconnect...", healthCheck);
                 // Optional: throw only if it's a network error, otherwise continue if it's just a permission error on one table
                 // But for now, let's treat it as offline if categories fail.
                 throw new Error(`Conexión fallida: ${healthCheck.message}`);
            }
            
            // Parallel fetch using services
            const [cats, prods, inv, tops, flavs, hist, conf] = await Promise.all([
                productService.getCategories(),
                productService.getAll(),
                inventoryService.getAll(),
                toppingService.getAll().catch(e => { console.warn('Toppings error', e); return []; }),
                flavorService.getAll().catch(e => { console.warn('Flavors error', e); return []; }),
                salesService.getHistory().catch(e => { console.warn('History error', e); return []; }),
                settingsService.getSettings().catch(e => { console.warn('Settings error', e); return null; })
            ]);

            setCategories(cats || []);
            setProducts(prods || []);
            setInventory(inv || []);
            setToppings(tops || []);
            setFlavors(flavs || []);
            
            // Normalize Sales for UI
            const normalizedSales = (hist || []).map(s => ({
                id: s.id,
                date: new Date(s.created_at).toDateString(),
                total: Number(s.total),
                items: s.sale_items ? s.sale_items.reduce((acc, item) => acc + item.quantity, 0) : 0,
                method: s.payment_method,
                invoice_number: s.invoice_number,
                ts: new Date(s.created_at).getTime(),
                items_detail: s.sale_items
            }));
            setSales(normalizedSales);

            if (conf) setSettings(conf);

            setError(null);
            setIsConnected(true);

        } catch (err) {
            console.error('Error cargando datos:', err);
            setError(err);
            loadLocalData();
        } finally {
            setLoading(false);
        }
    }, [loadLocalData]);

    const saveSale = async (saleData) => {
        // saleData: { total, method, cartItems }
        // cartItems: [{ product, qty, unitPrice, options }]
        
        if (isConnected) {
            try {
                // Map UI cart items to API structure
                const payload = {
                    total: saleData.total,
                    payment_method: saleData.method,
                    items: saleData.cartItems.map(item => ({
                        product_id: item.product.id,
                        quantity: item.qty,
                        unit_price: item.product.price,
                        options: item.options || {} // Include options
                    }))
                };

                const result = await salesService.createSale(payload);

                // Update local state immediately
                const newSale = {
                    ...result,
                    date: new Date(result.created_at).toDateString(),
                    items: payload.items.reduce((s, i) => s + i.quantity, 0),
                    items_detail: payload.items,
                    ts: Date.now()
                };
                setSales(prev => [newSale, ...prev]);
                return newSale;

            } catch (err) {
                console.error('Error saving sale via service:', err);
                throw err;
            }
        } else {
            // Offline fallback
            const newSale = {
                id: Date.now(),
                invoice_number: 'OFFLINE',
                created_at: new Date().toISOString(),
                total: saleData.total,
                payment_method: saleData.method,
                items: saleData.cartItems.reduce((s, i) => s + i.qty, 0),
                items_detail: saleData.cartItems,
                date: new Date().toDateString(),
                ts: Date.now()
            };
            const existing = JSON.parse(localStorage.getItem('acai_orders') || '[]');
            existing.push(newSale);
            localStorage.setItem('acai_orders', JSON.stringify(existing));
            setSales(prev => [newSale, ...prev]);
            return newSale;
        }
    };

    const updateInventory = async (id, newQty) => {
        if (isConnected) {
             await inventoryService.adjustStock(id, newQty);
        }
        // Local update
        const newInv = inventory.map(i => i.id === id ? { ...i, quantity: newQty } : i);
        setInventory(newInv);
        if (!isConnected) localStorage.setItem('acai_inventory', JSON.stringify(newInv));
    };

    // Initial load
    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        categories,
        products,
        inventory,
        toppings,
        flavors,
        sales,
        settings,
        loading,
        error,
        isConnected,
        saveSale,
        updateInventory,
        refresh: loadData
    };
}
