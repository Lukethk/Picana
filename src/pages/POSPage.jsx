import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import ProductCard from '../components/pos/ProductCard';
import Cart from '../components/pos/Cart';
import ProductOptionsModal from '../components/pos/ProductOptionsModal';

export default function POSPage({ cart, setCart, products, categories, toppings, flavors, onSaveSale }) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [toastMsg, setToastMsg] = useState(false);
    const [selectedProductForOptions, setSelectedProductForOptions] = useState(null);

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

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    /* ── Cart operations ─────────────────────────────────────── */
    const handleProductSelect = (product) => {
        // Show modal if flavors or toppings exist
        if ((toppings && toppings.length > 0) || (flavors && flavors.length > 0)) {
            setSelectedProductForOptions(product);
        } else {
            addToCart(product, { flavors: [], toppings: [] });
        }
    };

    const addToCart = (product, options) => {
        const { flavors = [], toppings = [] } = options;
        const extra = toppings.reduce((s, t) => s + (Number(t.price) || 0), 0);
        const unitPrice = product.price + extra;
        
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
    };

    const removeItem = (id) => {
        setCart(prev => {
            const next = prev.filter(i => i.id !== id);
            localStorage.setItem('acai_cart', JSON.stringify(next));
            return next;
        });
    };

    const changeQty = (id, delta) => {
        setCart(prev => {
            const next = prev.map(i => {
                if (i.id !== id) return i;
                const qty = Math.max(1, i.qty + delta);
                return { ...i, qty, lineTotal: i.unitPrice * qty };
            });
            localStorage.setItem('acai_cart', JSON.stringify(next));
            return next;
        });
    };

    const finalizeOrder = async () => {
        if (cart.length === 0) return;
        const subtotal = cart.reduce((s, i) => s + i.lineTotal, 0);
        
        await onSaveSale({
            total: subtotal,
            items: cart.length,
            method: paymentMethod,
            cartItems: cart
        });

        setCart([]);
        localStorage.removeItem('acai_cart');
        setToastMsg(true);
        setTimeout(() => setToastMsg(false), 3000);
    };

    return (
        <div className="flex gap-5 h-full relative">
            {/* Left — product grid */}
            <div className="flex-1 min-w-0 flex flex-col h-full">
                {/* Header with Categories */}
                <div className="mb-4 shrink-0">
                    <h2 className="text-slate-900 font-bold text-xl mb-3">Menú</h2>
                    
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
                                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105' 
                                            : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-100'}
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
                    <motion.div 
                        variants={container}
                        initial="hidden"
                        animate="show"
                        key={selectedCategory} // Re-animate on category change
                        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20"
                    >
                        {displayedProducts.length > 0 ? (
                            displayedProducts.map(product => (
                                <motion.div key={product.id} variants={item}>
                                    <ProductCard cup={product} onSelect={handleProductSelect} />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400"
                            >
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-2xl">🔍</span>
                                </div>
                                <p>No hay productos en esta categoría</p>
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Right — Cart (Fixed width on desktop, modal/drawer on mobile potentially) */}
            <div className="w-[380px] shrink-0 h-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
                <Cart
                    cart={cart}
                    onRemove={removeItem}
                    onQtyChange={changeQty}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    onFinalize={finalizeOrder}
                />
            </div>

            {/* Product Options Modal */}
            <AnimatePresence>
                {selectedProductForOptions && (
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
