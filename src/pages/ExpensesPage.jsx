import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, DollarSign, Calendar, Tag, AlertCircle, HelpCircle } from 'lucide-react';
import { expenseService } from '../services/expenseService';
import { formatBs } from '../utils/format';
import Tooltip from '../components/ui/Tooltip';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({ amount: '', description: '', category: 'Varios' });
    const [saving, setSaving] = useState(false);

    const categories = ['Insumos', 'Servicios', 'Alquiler', 'Sueldos', 'Varios'];

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const data = await expenseService.getAll();
            setExpenses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await expenseService.create({
                amount: parseFloat(formData.amount),
                description: formData.description,
                category: formData.category
            });
            setIsAdding(false);
            setFormData({ amount: '', description: '', category: 'Varios' });
            loadExpenses();
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar gasto?')) return;
        try {
            await expenseService.delete(id);
            loadExpenses();
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-slate-900 font-bold text-xl dark:text-slate-100">Gastos y Egresos</h2>
                        <Tooltip position="bottom" text="Registra aquí todos los pagos externos (alquiler, sueldos, insumos) para calcular tu utilidad real." />
                    </div>
                    <p className="text-slate-400 text-sm dark:text-slate-400">Registra todos los pagos realizados</p>
                </div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 dark:shadow-rose-900/20 transition-all active:scale-95"
                >
                    <Plus size={20} /> Nuevo Gasto
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-rose-600" size={32} />
                        </div>
                    ) : expenses.length > 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoría</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descripción</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Monto</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {expenses.map(e => (
                                            <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                    {new Date(e.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold">
                                                        {e.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    {e.description}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-rose-600 dark:text-rose-400 text-right">
                                                    -{formatBs(e.amount)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => handleDelete(e.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-20 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <DollarSign size={32} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-slate-900 dark:text-white font-bold mb-1">Sin gastos registrados</h3>
                            <p className="text-slate-500 text-sm">Comienza a registrar tus egresos para ver la utilidad real.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                            <Tag size={18} className="text-indigo-600" />
                            Resumen rápido
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Gastos (mes)</p>
                                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                                    {formatBs(expenses.reduce((acc, e) => acc + e.amount, 0))}
                                </p>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed italic">
                                "Llevar un registro riguroso de gastos te ayuda a entender dónde se va el dinero de tu negocio."
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => !saving && setIsAdding(false)} />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800"
                        >
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Registrar Nuevo Gasto</h3>
                            
                            <form onSubmit={handleCreate} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Categoría</label>
                                    <select 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-slate-200"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Monto (Bs)</label>
                                    <input
                                        required
                                        type="number" step="0.5"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-lg font-bold dark:text-slate-100"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1">Descripción</label>
                                    <input
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 dark:text-slate-100"
                                        placeholder="Ej. Pago de luz Marzo"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAdding(false)}
                                        className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        disabled={saving}
                                        className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : <DollarSign size={20} />}
                                        Guardar Gasto
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
