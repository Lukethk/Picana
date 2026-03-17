import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatBs } from '../../utils/format';
import { ShoppingBag, Image as ImageIcon } from 'lucide-react';

function ProductCard({ cup, onSelect }) {
    const [ripple, setRipple] = useState(false);

    const handleClick = () => {
        onSelect(cup);
        setRipple(true);
        setTimeout(() => setRipple(false), 400);
    };

    return (
        <motion.button
            whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(79, 70, 229, 0.2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className="group relative w-full bg-white border border-slate-100 rounded-2xl 
                 cursor-pointer overflow-hidden transition-all duration-200 hover:border-indigo-200 hover:shadow-md active:shadow-sm shadow-sm flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
            {/* Image Area */}
            <div className="relative w-full aspect-[4/3] bg-slate-50 overflow-hidden flex items-center justify-center">
                {cup.image_url ? (
                    <img 
                        src={cup.image_url} 
                        alt={cup.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300">
                        <ImageIcon size={32} strokeWidth={1.5} />
                    </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors duration-300" />
                
                {/* Price Tag */}
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-slate-100">
                    <span className="text-indigo-700 font-bold text-lg">{formatBs(cup.price)}</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 flex-1 flex flex-col items-start w-full text-left">
                <h3 className="text-slate-800 font-bold text-lg leading-tight mb-1 group-hover:text-indigo-700 transition-colors">
                    {cup.name}
                </h3>
                
                <p className="text-slate-500 text-xs line-clamp-2 mb-3 min-h-[2.5em]">
                    {cup.description || cup.subtitle || 'Delicioso açaí preparado al momento'}
                </p>

                <div className="mt-auto w-full pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                        {cup.size || 'Regular'}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <ShoppingBag size={16} />
                    </div>
                </div>
            </div>

            {/* Ripple Effect */}
            <AnimatePresence>
                {ripple && (
                    <motion.span
                        key="ripple"
                        initial={{ scale: 0.5, opacity: 0.3 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-indigo-100 rounded-full pointer-events-none z-10"
                        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                    />
                )}
            </AnimatePresence>
        </motion.button>
    );
}

export default memo(ProductCard);
