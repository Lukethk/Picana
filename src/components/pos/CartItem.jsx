import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { formatBs } from '../../utils/format';

export default function CartItem({ item, onRemove, onQtyChange }) {
    const flavors = item.options?.flavors || [];
    const toppings = item.options?.toppings || item.toppings || [];

    const details = [
        flavors.length > 0 ? `Sabores: ${flavors.map(f => f.name).join(', ')}` : null,
        toppings.length > 0 ? `Toppings: ${toppings.map(t => t.name).join(', ')}` : null
    ].filter(Boolean).join(' | ');

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
            className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-3 group"
        >
            {/* Image Thumbnail */}
            <div className="w-16 h-16 rounded-lg bg-white border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {(item.product?.image_url || item.cup?.image_url) ? (
                    <img src={item.product?.image_url || item.cup?.image_url} alt={item.product?.name || item.cup?.name} className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon size={20} className="text-slate-300" />
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-slate-800 font-bold text-sm leading-tight truncate">{item.product?.name || item.cup?.name}</p>
                        {details && (
                            <p className="text-slate-500 text-xs mt-0.5 line-clamp-2 leading-tight">{details}</p>
                        )}
                        <p className="text-indigo-600 font-bold text-sm mt-1">{formatBs(item.lineTotal)}</p>
                    </div>
                    <button
                        onClick={() => onRemove(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-md hover:bg-red-50"
                        aria-label="Eliminar"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-2 mt-1">
                    <button
                        onClick={() => onQtyChange(item.id, -1)}
                        className="w-7 h-7 rounded-md border border-slate-200 bg-white flex items-center justify-center
                       hover:bg-slate-100 cursor-pointer transition-colors active:scale-95"
                    >
                        <Minus size={12} className="text-slate-600" />
                    </button>
                    <span className="text-slate-800 font-semibold text-sm w-5 text-center">{item.qty}</span>
                    <button
                        onClick={() => onQtyChange(item.id, 1)}
                        className="w-7 h-7 rounded-md border border-slate-200 bg-white flex items-center justify-center
                       hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 cursor-pointer transition-colors active:scale-95"
                    >
                        <Plus size={12} className="text-slate-600" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
