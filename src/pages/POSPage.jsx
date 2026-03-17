import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Edit3, Loader2, Printer, X } from 'lucide-react';
import ProductCard from '../components/pos/ProductCard';
import Cart from '../components/pos/Cart';
import ProductOptionsModal from '../components/pos/ProductOptionsModal';
import { formatBs } from '../utils/format';
import { buildReceiptText } from '../utils/receipt';

const CONTAINER_VARIANTS = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const ITEM_VARIANTS = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function POSPage({ cart, setCart, products, categories, toppings, flavors, onSaveSale, businessName, settings }) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [toastMsg, setToastMsg] = useState(false);
    const [selectedProductForOptions, setSelectedProductForOptions] = useState(null);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [confirming, setConfirming] = useState(false);

    // Initialize category selection when categories load
    useEffect(() => {
        if (!selectedCategory && categories && categories.length > 0) {
            queueMicrotask(() => setSelectedCategory(categories[0].id));
        }
    }, [categories, selectedCategory]);

    const displayedProducts = useMemo(() => {
        if (!selectedCategory || !products) return [];
        return products.filter(p => p.category_id === selectedCategory);
    }, [products, selectedCategory]);

    /* ── Cart operations ─────────────────────────────────────── */
    const addToCart = useCallback((product, options) => {
        const allowExtras = product?.has_extras === true;
        const safeOptions = allowExtras ? (options || {}) : { flavors: [], toppings: [] };
        const { flavors = [], toppings = [] } = safeOptions;
        const extra = allowExtras ? toppings.reduce((s, t) => s + (Number(t.price) || 0), 0) : 0;
        const unitPrice = Number(product.price) + extra;
        
        const newItem = {
            id: `${product.id}-${Date.now()}`,
            product: product, 
            options: { flavors, toppings }, 
            qty: 1,
            unitPrice: unitPrice,
            lineTotal: unitPrice,
        };
        setCart(prev => {
            const next = [...prev, newItem];
            localStorage.setItem('acai_cart', JSON.stringify(next));
            return next;
        });
        setSelectedProductForOptions(null);
    }, [setCart]);

    const handleProductSelect = useCallback((product) => {
        const hasExtras = product?.has_extras === true;
        const extrasAvailable = (toppings && toppings.length > 0) || (flavors && flavors.length > 0);

        if (hasExtras && extrasAvailable) {
            setSelectedProductForOptions(product);
        } else {
            addToCart(product, { flavors: [], toppings: [] });
        }
    }, [addToCart, flavors, toppings]);

    const removeItem = useCallback((id) => {
        setCart(prev => {
            const next = prev.filter(i => i.id !== id);
            localStorage.setItem('acai_cart', JSON.stringify(next));
            return next;
        });
    }, [setCart]);

    const changeQty = useCallback((id, delta) => {
        setCart(prev => {
            const next = prev.map(i => {
                if (i.id !== id) return i;
                const qty = Math.max(1, i.qty + delta);
                return { ...i, qty, lineTotal: i.unitPrice * qty };
            });
            localStorage.setItem('acai_cart', JSON.stringify(next));
            return next;
        });
    }, [setCart]);

    const finalizeOrder = useCallback(async (cartSnapshot) => {
        const items = Array.isArray(cartSnapshot) ? cartSnapshot : cart;
        if (items.length === 0) return null;
        const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
        
        const saved = await onSaveSale({
            total: subtotal,
            items: items.length,
            method: paymentMethod,
            cartItems: items
        });

        setCart([]);
        localStorage.removeItem('acai_cart');
        setToastMsg(true);
        setTimeout(() => setToastMsg(false), 3000);
        return saved;
    }, [cart, onSaveSale, paymentMethod, setCart]);

    const openCheckout = useCallback(() => {
        if (cart.length === 0) return;
        setCheckoutOpen(true);
    }, [cart.length]);

    const receiptText = useMemo(() => {
        const printerConfig = settings?.printer_config ?? settings?.config?.printer_config;
        const receiptConfig = settings?.receipt_config ?? settings?.config?.receipt_config;
        return buildReceiptText({
            businessName,
            receiptConfig,
            printerConfig,
            saleId: null,
            paymentMethod,
            createdAt: new Date(),
            cartItems: cart,
        });
    }, [businessName, cart, paymentMethod, settings]);

    const printerConfig = settings?.printer_config ?? settings?.config?.printer_config;
    const printerEnabled = !!printerConfig?.enabled;
    const printerMode = printerConfig?.mode || 'browser';

    const confirmCheckoutOnly = useCallback(async () => {
        if (confirming) return;
        const snapshot = [...(cart || [])];
        setConfirming(true);
        try {
            await finalizeOrder(snapshot);
            setCheckoutOpen(false);
        } finally {
            setConfirming(false);
        }
    }, [cart, confirming, finalizeOrder]);

    const confirmCheckoutAndPrint = useCallback(async () => {
        if (confirming) return;
        if (!printerEnabled || printerMode !== 'browser') return;
        const snapshot = [...(cart || [])];
        setConfirming(true);
        try {
            const saved = await finalizeOrder(snapshot);
            setCheckoutOpen(false);

            const receiptConfig = settings?.receipt_config ?? settings?.config?.receipt_config;
            const printerConfig2 = settings?.printer_config ?? settings?.config?.printer_config;
            const saleId = saved?.invoice_number || saved?.id || null;
            const createdAt = saved?.created_at || new Date();
            const text = buildReceiptText({
                businessName,
                receiptConfig,
                printerConfig: printerConfig2,
                saleId,
                paymentMethod,
                createdAt,
                cartItems: snapshot,
            });
            printReceiptText(text);
        } finally {
            setConfirming(false);
        }
    }, [businessName, cart, confirming, finalizeOrder, paymentMethod, printerEnabled, printerMode, settings]);

    return (
        <div className="flex gap-5 h-full relative">
            {/* Left — product grid */}
            <div className="flex-1 min-w-0 flex flex-col h-full">
                {/* Header with Categories */}
                <div className="mb-4 shrink-0">
                    <h2 className="text-slate-900 font-bold text-xl mb-3 dark:text-slate-100">Menú</h2>
                    
                    {/* Categories Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient-right">
                        {categories && categories.length > 0 ? (
                            categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`
                                        px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-200
                                        ${selectedCategory === cat.id 
                                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105 dark:bg-indigo-600 dark:shadow-indigo-500/20' 
                                            : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:border-slate-800'}
                                    `}
                                >
                                    {cat.name}
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400">Sin categorías</p>
                        )}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                    <ProductGrid
                        displayedProducts={displayedProducts}
                        selectedCategory={selectedCategory}
                        onSelect={handleProductSelect}
                    />
                </div>
            </div>

            {/* Right — Cart (Fixed width on desktop, modal/drawer on mobile potentially) */}
            <div className="w-[380px] shrink-0 h-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800">
                <Cart
                    cart={cart}
                    onRemove={removeItem}
                    onQtyChange={changeQty}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    onFinalize={openCheckout}
                />
            </div>

            <AnimatePresence initial={false}>
                {checkoutOpen && (
                    <CheckoutSummaryModal
                        cart={cart}
                        paymentMethod={paymentMethod}
                        confirming={confirming}
                        receiptText={receiptText}
                        printerEnabled={printerEnabled}
                        printerMode={printerMode}
                        onClose={() => setCheckoutOpen(false)}
                        onEdit={() => setCheckoutOpen(false)}
                        onConfirmOnly={confirmCheckoutOnly}
                        onConfirmAndPrint={confirmCheckoutAndPrint}
                    />
                )}
            </AnimatePresence>

            {/* Product Options Modal */}
            <AnimatePresence initial={false}>
                {selectedProductForOptions && selectedProductForOptions?.has_extras === true && (
                    <ProductOptionsModal
                        product={selectedProductForOptions}
                        availableToppings={toppings}
                        availableFlavors={flavors}
                        onCancel={() => setSelectedProductForOptions(null)}
                        onConfirm={addToCart}
                    />
                )}
            </AnimatePresence>

            {/* Success Toast */}
            <AnimatePresence>
                {toastMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className="fixed bottom-10 left-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-50"
                    >
                        <CheckCircle size={20} className="text-green-400" />
                        <span className="font-medium">Venta registrada correctamente</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const ProductGrid = memo(function ProductGrid({ displayedProducts, selectedCategory, onSelect }) {
    return (
        <motion.div 
            variants={CONTAINER_VARIANTS}
            initial="hidden"
            animate="show"
            key={selectedCategory}
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20"
        >
            {displayedProducts.length > 0 ? (
                displayedProducts.map(product => (
                    <motion.div key={product.id} variants={ITEM_VARIANTS}>
                        <ProductCard cup={product} onSelect={onSelect} />
                    </motion.div>
                ))
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-400"
                >
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 dark:bg-slate-800">
                        <span className="text-2xl">🔍</span>
                    </div>
                    <p>No hay productos en esta categoría</p>
                </motion.div>
            )}
        </motion.div>
    );
});

function CheckoutSummaryModal({ cart, paymentMethod, confirming, receiptText, printerEnabled, printerMode, onClose, onEdit, onConfirmOnly, onConfirmAndPrint }) {
    const total = cart.reduce((s, i) => s + i.lineTotal, 0);
    const labels = { efectivo: 'Efectivo', qr: 'QR', transferencia: 'Transferencia' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={confirming ? undefined : onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                transition={{ duration: 0.14 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] dark:bg-slate-900 dark:border dark:border-slate-800"
            >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 dark:border-slate-800">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Resumen</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {cart.length} item{cart.length !== 1 ? 's' : ''} · {labels[paymentMethod] || paymentMethod}
                        </p>
                    </div>
                    <button
                        type="button"
                        disabled={confirming}
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 active:scale-95 transition-all disabled:opacity-60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/40 rounded-lg p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6 overflow-hidden">
                    <div className="overflow-y-auto space-y-3 pr-1">
                        {cart.map((it) => {
                            const toppings = it?.options?.toppings || [];
                            const flavors = it?.options?.flavors || [];
                            const details = [
                                flavors.length ? `Sabores: ${flavors.map(f => f.name).join(', ')}` : null,
                                toppings.length ? `Toppings: ${toppings.map(t => t.name).join(', ')}` : null
                            ].filter(Boolean).join(' · ');

                            return (
                                <div key={it.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:bg-slate-950/30 dark:border-slate-800">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 truncate dark:text-slate-100">
                                                {it.qty}× {it.product?.name}
                                            </p>
                                            {details ? (
                                                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{details}</p>
                                            ) : null}
                                        </div>
                                        <p className="font-bold text-slate-900 shrink-0 dark:text-slate-100">{formatBs(it.lineTotal)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide dark:text-slate-400">Ticket</p>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                {printerEnabled ? (printerMode === 'browser' ? 'Impresión: Navegador' : 'Impresión: Red') : 'Impresión desactivada'}
                            </span>
                        </div>
                        <pre className="flex-1 p-4 rounded-xl border border-slate-200 bg-slate-50 overflow-auto text-xs leading-relaxed font-mono text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200">
                            {receiptText}
                        </pre>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 dark:bg-slate-800/40 dark:border-slate-800">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                        <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{formatBs(total)}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={confirming}
                            onClick={onEdit}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white font-semibold text-sm hover:bg-slate-50 hover:shadow-sm active:scale-[0.99] transition-all disabled:opacity-60 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <span className="inline-flex items-center gap-2">
                                <Edit3 size={16} />
                                Editar
                            </span>
                        </button>
                        <button
                            type="button"
                            disabled={confirming || cart.length === 0}
                            onClick={onConfirmOnly}
                            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] text-white font-bold text-sm transition-all disabled:opacity-60 dark:hover:shadow-indigo-900/30"
                        >
                            <span className="inline-flex items-center gap-2">
                                {confirming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                Aceptar
                            </span>
                        </button>
                        <button
                            type="button"
                            disabled={confirming || cart.length === 0 || !printerEnabled || printerMode !== 'browser'}
                            onClick={onConfirmAndPrint}
                            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200 active:scale-[0.99] text-white font-bold text-sm transition-all disabled:opacity-60 dark:bg-slate-950 dark:hover:bg-slate-900 dark:hover:shadow-slate-900/30"
                        >
                            <span className="inline-flex items-center gap-2">
                                {confirming ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                                Aceptar e imprimir
                            </span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function printReceiptText(text) {
    const win = window.open('', '_blank', 'width=420,height=700');
    if (!win) {
        alert('No se pudo abrir la ventana de impresión (bloqueador de pop-ups).');
        return;
    }
    const safe = String(text || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    win.document.open();
    win.document.write(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Ticket</title>
            <style>
              body { margin: 0; padding: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
              pre { white-space: pre-wrap; font-size: 12px; line-height: 1.25; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body><pre>${safe}</pre></body>
        </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
        try {
            win.print();
        } finally {
            setTimeout(() => win.close(), 300);
        }
    }, 80);
}
