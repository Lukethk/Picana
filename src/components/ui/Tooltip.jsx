import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

export default function Tooltip({ text, children, position = 'top' }) {
    const [isVisible, setIsVisible] = useState(false);

    const positions = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div 
            className="relative inline-flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children ? children : <HelpCircle size={14} className="text-slate-400 hover:text-indigo-500 cursor-help transition-colors" />}
            
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className={`absolute z-[9999] w-48 p-2 bg-slate-800 text-white text-[11px] rounded-lg shadow-xl pointer-events-none ${positions[position]}`}
                    >
                        {text}
                        {/* Arrow */}
                        <div className={`absolute w-2 h-2 bg-slate-800 rotate-45 ${
                            position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                            position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                            position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
                            'left-[-4px] top-1/2 -translate-y-1/2'
                        }`} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
