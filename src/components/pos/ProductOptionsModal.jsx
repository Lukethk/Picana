import { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Plus, Minus } from 'lucide-react';
import { formatBs } from '../../utils/format';

const OptionItem = memo(({ item, isSelected, onToggle, type, disabled }) => {
    const isFlavor = type === 'flavor';
    return (
        <button
            onClick={() => !disabled && onToggle(item)}
            disabled={disabled}
            className={`
                relative px-4 py-3 rounded-xl border text-left transition-all duration-150
                ${isFlavor ? '' : 'flex justify-between items-center group'}
                ${isSelected 
                    ? `border-${isFlavor ? 'indigo' : 'pink'}-500 bg-${isFlavor ? 'indigo' : 'pink'}-50 text-${isFlavor ? 'indigo' : 'pink'}-700 shadow-sm ring-1 ring-${isFlavor ? 'indigo' : 'pink'}-500` 
                    : `border-slate-200 ${disabled ? 'opacity-40 cursor-not-allowed' : `hover:border-${isFlavor ? 'indigo' : 'pink'}-300 hover:bg-slate-50 text-slate-600`}`}
            `}
        >
            <div className={`flex ${isFlavor ? 'justify-between items-center w-full' : 'flex-col'}`}>
                <span className="font-medium text-sm">{item.name}</span>
                {!isFlavor && item.price > 0 && (
                    <span className={`text-xs transition-colors ${isSelected ? 'text-pink-600' : 'text-slate-400 group-hover:text-pink-500'}`}>
                        +{formatBs(item.price)}
                    </span>
                )}
                {isFlavor && isSelected && <Check size={14} strokeWidth={3} className="text-indigo-600" />}
            </div>
            {!isFlavor && isSelected && (
                <div className="text-pink-500">
                    <Check size={16} strokeWidth={3} />
                </div>
            )}
        </button>
    );
});

export default function ProductOptionsModal({ product, availableToppings = [], availableFlavors = [], onCancel, onConfirm }) {
    const [selectedFlavors, setSelectedFlavors] = useState([]);
    const [selectedToppings, setSelectedToppings] = useState([]);
    const [flavorWarning, setFlavorWarning] = useState(false);
    
    const productNameLower = product?.name?.toLowerCase() || '';
    let maxFlavors = -1;
    if (productNameLower.includes('simple')) maxFlavors = 1;
    else if (productNameLower.includes('doble')) maxFlavors = 2;

    const showFlavors = availableFlavors.length > 0;
    
    const handleFlavorToggle = (flavor) => {
        setSelectedFlavors(prev => {
            const exists = prev.some(f => f.id === flavor.id);
            if (exists) {
                setFlavorWarning(false);
                return prev.filter(f => f.id !== flavor.id);
            } else {
                if (maxFlavors !== -1 && prev.length >= maxFlavors) {
                    setFlavorWarning(true);
                    setTimeout(() => setFlavorWarning(false), 2000);
                    return prev;
                }
                return [...prev, flavor];
            }
        });
    };

    const handleToppingToggle = (topping) => {
        setSelectedToppings(prev => {
            const exists = prev.some(t => t.id === topping.id);
            if (exists) {
                return prev.filter(t => t.id !== topping.id);
            } else {
                return [...prev, topping];
            }
        });
    };

    const total = useMemo(() => {
        const toppingsCost = selectedToppings.reduce((acc, t) => acc + (Number(t.price) || 0), 0);
        return Number(product.price) + toppingsCost;
    }, [selectedToppings, product.price]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onCancel} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 10 }}
                transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Personalizar {product.name}</h3>
                        <p className="text-slate-500 text-xs">Elige tus sabores y agregados</p>
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Flavors Section */}
                    {showFlavors && (
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                                    Sabores
                                    {maxFlavors !== -1 && (
                                        <span className="text-xs font-medium text-slate-400 ml-1">
                                            (Máximo {maxFlavors})
                                        </span>
                                    )}
                                </h4>
                                <AnimatePresence>
                                    {flavorWarning && (
                                        <motion.span 
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded"
                                        >
                                            Límite de {maxFlavors} sabores
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {availableFlavors.map(flavor => {
                                    const isSelected = selectedFlavors.some(f => f.id === flavor.id);
                                    const disabled = maxFlavors !== -1 && selectedFlavors.length >= maxFlavors && !isSelected;
                                    return (
                                        <OptionItem 
                                            key={flavor.id} 
                                            item={flavor} 
                                            type="flavor"
                                            isSelected={isSelected} 
                                            onToggle={handleFlavorToggle} 
                                            disabled={disabled}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Toppings Section */}
                    <div>
                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-pink-500 rounded-full"></span>
                            Toppings & Extras
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {availableToppings.map(topping => (
                                <OptionItem 
                                    key={topping.id} 
                                    item={topping} 
                                    type="topping"
                                    isSelected={selectedToppings.some(t => t.id === topping.id)} 
                                    onToggle={handleToppingToggle} 
                                />
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-500 font-semibold uppercase">Total</span>
                        <span className="text-xl font-bold text-slate-900">{formatBs(total)}</span>
                    </div>
                    <button 
                        onClick={() => onConfirm(product, { flavors: selectedFlavors, toppings: selectedToppings })}
                        className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-all flex items-center gap-2 active:scale-95"
                    >
                        Agregar
                        <Plus size={18} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
