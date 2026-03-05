import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Minus, X, Save, Loader2 } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';

export default function InventoryPage({ inventory, onUpdateInventory }) {
    const [adjusting, setAdjusting] = useState(null);
    const [adjustVal, setAdjustVal] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: 'unid', min_stock: 5 });
    const [saving, setSaving] = useState(false);

    const handleUpdate = async (id, newQty) => {
        try {
            await inventoryService.update(id, { quantity: newQty });
            onUpdateInventory(); // Refresh data
        } catch (err) {
            console.error(err);
            alert('Error al actualizar inventario');
        }
    };

    const commitAdjust = async (id) => {
        const delta = parseFloat(adjustVal);
        if (!isNaN(delta)) {
            const item = inventory.find(i => i.id === id);
            if (item) {
                const newQty = Math.max(0, parseFloat(item.quantity) + delta);
                await handleUpdate(id, newQty);
            }
        }
        setAdjusting(null);
        setAdjustVal('');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await inventoryService.create(newItem);
            setIsAdding(false);
            setNewItem({ name: '', quantity: '', unit: 'unid', min_stock: 5 });
            onUpdateInventory();
        } catch (err) {
            console.error(err);
            alert('Error al crear insumo');
        } finally {
            setSaving(false);
        }
    };

    // Helper for status
    const getStatus = (item) => {
        const qty = parseFloat(item.quantity);
        const min = parseFloat(item.min_stock || 5);
        if (qty <= min / 2) return 'critical';
        if (qty <= min) return 'warn';
        return 'ok';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'critical': return 'bg-red-100 text-red-700';
            case 'warn': return 'bg-amber-100 text-amber-700';
            default: return 'bg-emerald-100 text-emerald-700';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'critical': return 'Crítico';
            case 'warn': return 'Bajo';
            default: return 'OK';
        }
    };

    const counts = { ok: 0, warn: 0, critical: 0 };
    inventory.forEach(it => counts[getStatus(it)] = (counts[getStatus(it)] || 0) + 1);

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-slate-900 font-bold text-xl">Inventario</h2>
                    <p className="text-slate-400 text-sm">Control de stock de insumos</p>
                </div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors"
                >
                    <Plus size={18} />
                    <span>Nuevo Insumo</span>
                </button>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { key: 'ok', label: 'Disponible', cls: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
                    { key: 'warn', label: 'Stock Bajo', cls: 'bg-amber-50  border-amber-100  text-amber-700' },
                    { key: 'critical', label: 'Crítico', cls: 'bg-red-50    border-red-100    text-red-700' },
                ].map(({ key, label, cls }) => (
                    <div key={key} className={`rounded-xl border px-5 py-4 ${cls}`}>
                        <p className="font-bold text-3xl leading-none">{counts[key] || 0}</p>
                        <p className="text-sm font-medium mt-1 opacity-80">{label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Insumo</th>
                                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Cantidad</th>
                                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Estado</th>
                                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence initial={false}>
                                {inventory.map((item) => (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-slate-900">{item.quantity}</span>
                                            <span className="text-slate-500 text-xs ml-1">{item.unit}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(getStatus(item))}`}>
                                                {getStatusLabel(getStatus(item))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {adjusting === item.id ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={adjustVal}
                                                        onChange={e => setAdjustVal(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && commitAdjust(item.id)}
                                                        placeholder="±"
                                                        autoFocus
                                                        className="w-20 border border-indigo-300 rounded-lg px-2 py-1 text-center text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                    <button onClick={() => commitAdjust(item.id)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"><Save size={16} /></button>
                                                    <button onClick={() => setAdjusting(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleUpdate(item.id, Math.max(0, item.quantity - 1))}
                                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setAdjusting(item.id); setAdjustVal(''); }}
                                                        className="px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                                                    >
                                                        Ajustar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdate(item.id, item.quantity + 1)}
                                                        className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    {inventory.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            No hay items en el inventario.
                        </div>
                    )}
                </div>
            </div>

            {/* Add Item Modal */}
            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAdding(false)} />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-slate-900">Nuevo Insumo</h3>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                                    <input 
                                        required 
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Ej. Vasos 300ml"
                                        value={newItem.name}
                                        onChange={e => setNewItem({...newItem, name: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantidad Inicial</label>
                                        <input 
                                            required type="number"
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={newItem.quantity}
                                            onChange={e => setNewItem({...newItem, quantity: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidad</label>
                                        <select 
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                            value={newItem.unit}
                                            onChange={e => setNewItem({...newItem, unit: e.target.value})}
                                        >
                                            <option value="unid">Unidad (unid)</option>
                                            <option value="kg">Kilogramo (kg)</option>
                                            <option value="g">Gramo (g)</option>
                                            <option value="lt">Litro (lt)</option>
                                            <option value="ml">Mililitro (ml)</option>
                                            <option value="pqte">Paquete</option>
                                            <option value="caja">Caja</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Mínimo (Alerta)</label>
                                    <input 
                                        type="number"
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newItem.min_stock}
                                        onChange={e => setNewItem({...newItem, min_stock: e.target.value})}
                                    />
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsAdding(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        disabled={saving}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-70"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Guardar
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
