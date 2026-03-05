import { AnimatePresence } from 'framer-motion';
import { ShoppingCart, Banknote, Smartphone, CreditCard } from 'lucide-react';
import CartItem from './CartItem';
import { formatBs } from '../../utils/format';

const PAY_METHODS = [
    { id: 'efectivo', label: 'Efectivo', icon: Banknote },
    { id: 'qr', label: 'QR', icon: Smartphone },
];

export default function Cart({ cart, onRemove, onQtyChange, paymentMethod, setPaymentMethod, onFinalize }) {
    const subtotal = cart.reduce((s, i) => s + i.lineTotal, 0);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
                <ShoppingCart size={16} className="text-slate-600" />
                <div className="flex-1">
                    <p className="text-slate-800 font-semibold text-sm">Resumen del pedido</p>
                    <p className="text-slate-400 text-xs">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
                <AnimatePresence initial={false}>
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-36 text-center">
                            <ShoppingCart size={28} className="text-slate-200 mb-2" />
                            <p className="text-slate-400 text-sm">Sin productos</p>
                            <p className="text-slate-300 text-xs">Selecciona un vaso para empezar</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <CartItem
                                key={item.id}
                                item={item}
                                onRemove={onRemove}
                                onQtyChange={onQtyChange}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-slate-200 space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Subtotal</span>
                    <span className="text-slate-900 font-bold text-lg">{formatBs(subtotal)}</span>
                </div>

                {/* Payment */}
                <div>
                    <p className="text-slate-400 text-xs font-medium mb-2">Metodo de pago</p>
                    <div className="grid grid-cols-2 gap-2">
                        {PAY_METHODS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setPaymentMethod(id)}
                                className={`
                  flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold
                  transition-all cursor-pointer shadow-sm
                  ${paymentMethod === id
                                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-indigo-200'
                                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 bg-white'
                                    }
                `}
                            >
                                <Icon size={18} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <button
                    onClick={onFinalize}
                    disabled={cart.length === 0}
                    className={`
            w-full py-3 rounded-lg font-semibold text-sm transition-all cursor-pointer
            ${cart.length > 0
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm active:scale-[0.98]'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }
          `}
                >
                    {cart.length === 0 ? 'Agrega productos' : `Finalizar — ${formatBs(subtotal)}`}
                </button>
            </div>
        </div>
    );
}
