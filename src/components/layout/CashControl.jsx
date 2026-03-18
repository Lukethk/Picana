import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, LogIn, LogOut, CheckCircle2, Loader2, AlertTriangle, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { cashService } from '../../services/cashService';
import { formatBs } from '../../utils/format';
import Tooltip from '../ui/Tooltip';

export default function CashControl({ onShiftChange }) {
    const [shift, setShift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOpening, setIsOpening] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [balance, setBalance] = useState('');
    const [summary, setSummary] = useState(null);
    const [closingProgress, setClosingProgress] = useState(false);

    useEffect(() => {
        checkShift();
    }, []);

    const checkShift = async () => {
        setLoading(true);
        try {
            const active = await cashService.getActiveShift();
            setShift(active);
            if (active && onShiftChange) onShiftChange(active);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenShift = async (e) => {
        e.preventDefault();
        const amount = parseFloat(balance);
        if (isNaN(amount) || amount < 0) return;
        
        setClosingProgress(true);
        try {
            const newShift = await cashService.openShift(amount);
            setShift(newShift);
            setIsOpening(false);
            setBalance('');
            if (onShiftChange) onShiftChange(newShift);
        } catch (error) {
            alert(error.message);
        } finally {
            setClosingProgress(false);
        }
    };

    const prepareClose = async () => {
        setIsClosing(true);
        setClosingProgress(true);
        try {
            const totals = await cashService.getShiftTotals(shift.id, shift.created_at);
            const expected = shift.opening_balance + totals.cash - totals.expenses;
            setSummary({ ...totals, expected });
        } catch (error) {
            alert(error.message);
            setIsClosing(false);
        } finally {
            setClosingProgress(false);
        }
    };

    const handleCloseShift = async (e) => {
        e.preventDefault();
        const actual = parseFloat(balance);
        if (isNaN(actual) || actual < 0) return;

        setClosingProgress(true);
        try {
            await cashService.closeShift(
                shift.id,
                actual,
                summary.expected,
                summary.cash,
                summary.qr,
                summary.transfer,
                summary.expenses
            );
            setShift(null);
            setIsClosing(false);
            setBalance('');
            setSummary(null);
            if (onShiftChange) onShiftChange(null);
        } catch (error) {
            alert(error.message);
        } finally {
            setClosingProgress(false);
        }
    };

    if (loading) return null;

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${shift ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'}`}>
                    <Wallet size={20} />
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Caja {shift ? 'Abierta' : 'Cerrada'}
                        </h4>
                        <Tooltip position="bottom" text={shift ? "La caja está activa. Todas las ventas se registrarán en este turno." : "Debes abrir un turno para poder realizar ventas en el sistema."} />
                    </div>
                    {shift ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Desde {new Date(shift.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Inicio {formatBs(shift.opening_balance)}
                        </p>
                    ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400">Abre caja para registrar ventas</p>
                    )}
                </div>
            </div>

            <div>
                {!shift ? (
                    <button 
                        onClick={() => setIsOpening(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all"
                    >
                        <LogIn size={16} /> Abrir Turno
                    </button>
                ) : (
                    <button 
                        onClick={prepareClose}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                        <LogOut size={16} /> Cerrar Turno
                    </button>
                )}
            </div>

            {/* Opening Modal */}
            <AnimatePresence>
                {isOpening && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => !closingProgress && setIsOpening(false)} />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800"
                        >
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Abrir Caja</h3>
                            <p className="text-sm text-slate-500 mb-6">Indica con cuánto efectivo inicias el turno.</p>
                            
                            <form onSubmit={handleOpenShift}>
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Monto inicial (Bs)</label>
                                    <input
                                        required
                                        autoFocus
                                        type="number" step="0.5"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold"
                                        placeholder="0.00"
                                        value={balance}
                                        onChange={e => setBalance(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsOpening(false)}
                                        className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        disabled={closingProgress}
                                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        {closingProgress ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                        Abrir Turno
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Closing Modal */}
            <AnimatePresence>
                {isClosing && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => !closingProgress && setIsClosing(false)} />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-800"
                        >
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Cerrar Caja</h3>
                            
                            {summary && (
                                <div className="space-y-4 mb-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                            <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Ventas Efectivo</p>
                                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatBs(summary.cash)}</p>
                                        </div>
                                        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                            <p className="text-[10px] uppercase font-bold text-rose-600 mb-1">Gastos</p>
                                            <p className="text-lg font-bold text-rose-700 dark:text-rose-400">-{formatBs(summary.expenses)}</p>
                                        </div>
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                            <p className="text-[10px] uppercase font-bold text-indigo-600 mb-1">QR / Transf.</p>
                                            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{formatBs(summary.qr + summary.transfer)}</p>
                                        </div>
                                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">Esperado en Caja</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatBs(summary.expected)}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Efectivo Real en Gaveta (Bs)</label>
                                        <input
                                            required
                                            autoFocus
                                            type="number" step="0.5"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xl font-bold"
                                            placeholder="0.00"
                                            value={balance}
                                            onChange={e => setBalance(e.target.value)}
                                        />
                                        {balance && (
                                            <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${parseFloat(balance) === summary.expected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30'}`}>
                                                {parseFloat(balance) === summary.expected ? (
                                                    <CheckCircle2 size={16} />
                                                ) : (
                                                    <AlertTriangle size={16} />
                                                )}
                                                <span className="text-xs font-bold">
                                                    {parseFloat(balance) === summary.expected 
                                                        ? 'El monto coincide con el esperado.' 
                                                        : `Diferencia: ${formatBs(parseFloat(balance) - summary.expected)}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsClosing(false)}
                                    className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleCloseShift}
                                    disabled={closingProgress || !balance}
                                    className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {closingProgress ? <Loader2 className="animate-spin" size={20} /> : <LogOut size={20} />}
                                    Cerrar Turno
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
