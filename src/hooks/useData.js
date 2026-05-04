
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { productService } from '../services/productService';
import { toppingService } from '../services/toppingService';
import { flavorService } from '../services/flavorService';
import { salesService } from '../services/salesService';
import { inventoryService } from '../services/inventoryService';
import { settingsService } from '../services/settingsService';
import { expenseService } from '../services/expenseService';
import { CUPS } from '../data/products';
import { DEFAULT_INVENTORY } from '../data/inventory';

export function useData() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [toppings, setToppings] = useState([]); 
    const [flavors, setFlavors] = useState([]); // Add flavors state
    const [sales, setSales] = useState([]);
    const [hasMoreSales, setHasMoreSales] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    const defaultSettings = useMemo(() => ({
        printer_config: {
            enabled: false,
            mode: 'browser',
            ip: '',
            port: 9100,
            paper_width_mm: 80,
            chars_per_line: 48,
            copies: 1,
        },
        receipt_config: {
            header_title: '',
            header_lines: '',
            footer_lines: '',
            show_datetime: true,
            show_sale_id: true,
            show_payment_method: true,
            show_item_options: true,
        }
    }), []);

    const readLocalSettings = useCallback(() => {
        try {
            const raw = localStorage.getItem('acai_business_settings');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }, []);

    const writeLocalSettings = useCallback((next) => {
        localStorage.setItem('acai_business_settings', JSON.stringify(next));
    }, []);

    const normalizeSettings = useCallback((row, local) => {
        const fromRowPrinter = row?.printer_config ?? row?.config?.printer_config;
        const fromRowReceipt = row?.receipt_config ?? row?.config?.receipt_config;
        const merged = {
            ...(defaultSettings || {}),
            ...(local || {}),
            ...(row || {}),
            printer_config: {
                ...(defaultSettings?.printer_config || {}),
                ...(local?.printer_config || {}),
                ...(fromRowPrinter || {}),
            },
            receipt_config: {
                ...(defaultSettings?.receipt_config || {}),
                ...(local?.receipt_config || {}),
                ...(fromRowReceipt || {}),
            },
        };
        return merged;
    }, [defaultSettings]);

    // Legacy fallback
    const loadLocalData = useCallback(() => {
        console.warn('Cargando datos locales de respaldo...');
        setCategories([{ id: 'default', name: 'General' }]);
        setProducts(CUPS.map(p => ({ ...p, category_id: 'default' })));
        setToppings([]); // No toppings in fallback for now
        setInventory(DEFAULT_INVENTORY);
        setSales(JSON.parse(localStorage.getItem('acai_orders')) || []);
        const local = readLocalSettings();
        setSettings(normalizeSettings(null, local));
        setIsConnected(false);
    }, [normalizeSettings, readLocalSettings]);

    // Optimized data loading with local cache
    const loadData = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        
        try {
            // Load from cache first for immediate UI
            if (!isRefresh) {
                const cachedCats = localStorage.getItem('cache_categories');
                const cachedProds = localStorage.getItem('cache_products');
                const cachedTops = localStorage.getItem('cache_toppings');
                const cachedFlavs = localStorage.getItem('cache_flavors');
                
                if (cachedCats) setCategories(JSON.parse(cachedCats));
                if (cachedProds) setProducts(JSON.parse(cachedProds));
                if (cachedTops) setToppings(JSON.parse(cachedTops));
                if (cachedFlavs) setFlavors(JSON.parse(cachedFlavs));
            }

            // Parallel fetch using services with a limit on history
            const [cats, prods, inv, tops, flavs, hist, exps, conf] = await Promise.all([
                productService.getCategories(),
                productService.getAll(),
                inventoryService.getAll(),
                toppingService.getAll().catch(() => []),
                flavorService.getAll().catch(() => []),
                salesService.getHistory().catch(() => []), // This should ideally be limited in service
                expenseService.getAll().catch(() => []),
                settingsService.getSettings().catch(() => null)
            ]);

            setCategories(cats || []);
            setProducts(prods || []);
            setInventory(inv || []);
            setToppings(tops || []);
            setFlavors(flavs || []);
            setExpenses(exps || []);
            
            // Update cache
            localStorage.setItem('cache_categories', JSON.stringify(cats || []));
            localStorage.setItem('cache_products', JSON.stringify(prods || []));
            localStorage.setItem('cache_toppings', JSON.stringify(tops || []));
            localStorage.setItem('cache_flavors', JSON.stringify(flavs || []));

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

            const local = readLocalSettings();
            const nextSettings = normalizeSettings(conf, local);
            setSettings(nextSettings);
            writeLocalSettings(nextSettings);

            setError(null);
            setIsConnected(true);
        } catch (err) {
            console.error('Error cargando datos:', err);
            setError(err);
            if (!isRefresh) loadLocalData();
        } finally {
            setLoading(false);
        }
    }, [loadLocalData, normalizeSettings, readLocalSettings, writeLocalSettings]);

    const saveSale = useCallback(async (saleData) => {
        if (isConnected) {
            try {
                const payload = {
                    total: saleData.total,
                    payment_method: saleData.method,
                    customer_name: saleData.customerName || null,
                    customer_document: saleData.customerDocument || null,
                    items: saleData.cartItems.map(item => ({
                        product_id: item.product.id,
                        quantity: item.qty,
                        unit_price: item.product.price,
                        options: item.options || {}
                    }))
                };

                const result = await salesService.createSale(payload);

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
    }, [isConnected]);

    const deleteSale = useCallback(async (saleId) => {
        if (isConnected) {
            await salesService.deleteSale(saleId);
            setSales(prev => prev.filter(s => String(s.id) !== String(saleId)));
            return;
        }

        const existing = JSON.parse(localStorage.getItem('acai_orders') || '[]');
        const next = existing.filter(s => String(s.id) !== String(saleId));
        localStorage.setItem('acai_orders', JSON.stringify(next));
        setSales(prev => prev.filter(s => String(s.id) !== String(saleId)));
    }, [isConnected]);

    const saveBusinessSettings = useCallback(async (partial) => {
        const local = readLocalSettings();
        const merged = normalizeSettings({ ...(settings || {}), ...(partial || {}) }, local);
        writeLocalSettings(merged);
        setSettings(merged);

        if (!isConnected) return merged;

        const currentId = settings?.id ?? merged?.id;
        const payloadA = {
            ...(currentId ? { id: currentId } : {}),
            printer_config: merged.printer_config,
            receipt_config: merged.receipt_config,
        };

        try {
            const saved = await settingsService.updateSettings(payloadA);
            const next = normalizeSettings(saved, merged);
            writeLocalSettings(next);
            setSettings(next);
            return next;
        } catch (err) {
            const msg = String(err?.message || '').toLowerCase();
            const missingPrinterCol = msg.includes("could not find the 'printer_config' column");
            const missingReceiptCol = msg.includes("could not find the 'receipt_config' column");
            if (missingPrinterCol || missingReceiptCol) {
                const payloadB = {
                    ...(currentId ? { id: currentId } : {}),
                    config: {
                        printer_config: merged.printer_config,
                        receipt_config: merged.receipt_config,
                    }
                };
                const savedB = await settingsService.updateSettings(payloadB);
                const nextB = normalizeSettings(savedB, merged);
                writeLocalSettings(nextB);
                setSettings(nextB);
                return nextB;
            }
            throw err;
        }
    }, [isConnected, normalizeSettings, readLocalSettings, settings, writeLocalSettings]);

    const updateInventory = useCallback(async (id, newQty) => {
        if (isConnected) {
             await inventoryService.adjustStock(id, newQty);
        }
        const newInv = inventory.map(i => i.id === id ? { ...i, quantity: newQty } : i);
        setInventory(newInv);
        if (!isConnected) localStorage.setItem('acai_inventory', JSON.stringify(newInv));
    }, [isConnected, inventory]);

    const loadMoreSales = useCallback(async () => {
        if (!isConnected || !hasMoreSales) return;
        
        try {
            const offset = sales.length;
            const more = await salesService.getHistory({ offset, limit: 50 });
            
            if (more.length < 50) setHasMoreSales(false);
            
            const normalized = more.map(s => ({
                id: s.id,
                date: new Date(s.created_at).toDateString(),
                total: Number(s.total),
                items: s.sale_items ? s.sale_items.reduce((acc, item) => acc + item.quantity, 0) : 0,
                method: s.payment_method,
                invoice_number: s.invoice_number,
                ts: new Date(s.created_at).getTime(),
                items_detail: s.sale_items
            }));
            
            setSales(prev => [...prev, ...normalized]);
        } catch (err) {
            console.error('Error loading more sales:', err);
        }
    }, [isConnected, hasMoreSales, sales.length]);

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
        hasMoreSales,
        loadMoreSales,
        expenses,
        settings,
        loading,
        error,
        isConnected,
        saveSale,
        deleteSale,
        saveBusinessSettings,
        updateInventory,
        refresh: () => loadData(true)
    };
}
