import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit3, X, Loader2, ArrowLeft } from 'lucide-react';
import { toppingService } from '../services/toppingService';
import { flavorService } from '../services/flavorService';
import { formatBs } from '../utils/format';

export default function ExtrasPage({ onBack }) {
    const [activeTab, setActiveTab] = useState('toppings');
    const [toppings, setToppings] = useState([]);
    const [flavors, setFlavors] = useState([]);
    const [loading, setLoading] = useState(false);

    // Refresh data on mount or tab change
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [t, f] = await Promise.all([
                toppingService.getAll().catch(e => { console.warn(e); return []; }),
                flavorService.getAll().catch(e => { console.warn(e); return []; })
            ]);
            setToppings(t || []);
            setFlavors(f || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {onBack && (
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-slate-900 font-bold text-xl">Extras y Sabores</h2>
                        <p className="text-slate-400 text-sm">Gestiona los complementos de tus productos</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('toppings')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'toppings' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Toppings
                </button>
                <button
                    onClick={() => setActiveTab('flavors')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'flavors' 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Sabores
                </button>
            </div>

            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-indigo-600" size={32} />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === 'toppings' && (
                            <motion.div
                                key="toppings"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <ToppingsManager toppings={toppings} onRefresh={loadData} />
                            </motion.div>
                        )}
                        {activeTab === 'flavors' && (
                            <motion.div
                                key="flavors"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <FlavorsManager flavors={flavors} onRefresh={loadData} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

function ToppingsManager({ toppings, onRefresh }) {
    const [isEditing, setIsEditing] = useState(null); // null or topping object
    
    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar topping?')) return;
        await toppingService.delete(id);
        onRefresh();
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button 
                    onClick={() => setIsEditing({})} 
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                    <Plus size={16} /> Nuevo Topping
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {toppings.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-colors">
                        <div>
                            <h4 className="font-bold text-slate-800">{t.name}</h4>
                            <p className="text-slate-500 text-sm">Precio: {formatBs(t.price)}</p>
                            <p className="text-xs text-slate-400">Stock: {t.stock || 0}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setIsEditing(t)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                <Edit3 size={16} />
                            </button>
                            <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isEditing && (
                <ToppingModal 
                    topping={isEditing} 
                    onClose={() => setIsEditing(null)} 
                    onSave={async (data) => {
                        if (data.id) await toppingService.update(data.id, data);
                        else await toppingService.create(data);
                        setIsEditing(null);
                        onRefresh();
                    }}
                />
            )}
        </div>
    );
}

function FlavorsManager({ flavors, onRefresh }) {
    const [isEditing, setIsEditing] = useState(null);

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar sabor?')) return;
        await flavorService.delete(id);
        onRefresh();
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button 
                    onClick={() => setIsEditing({})} 
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                    <Plus size={16} /> Nuevo Sabor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flavors.map(f => (
                    <div key={f.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-indigo-200 transition-colors">
                        <div>
                            <h4 className="font-bold text-slate-800">{f.name}</h4>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-md font-medium border border-emerald-100">
                                Activo
                            </span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setIsEditing(f)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                <Edit3 size={16} />
                            </button>
                            <button onClick={() => handleDelete(f.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isEditing && (
                <FlavorModal 
                    flavor={isEditing} 
                    onClose={() => setIsEditing(null)} 
                    onSave={async (data) => {
                        if (data.id) await flavorService.update(data.id, data);
                        else await flavorService.create(data);
                        setIsEditing(null);
                        onRefresh();
                    }}
                />
            )}
        </div>
    );
}

function ToppingModal({ topping, onClose, onSave }) {
    const [formData, setFormData] = useState({ 
        name: '', price: '', stock: '', ...topping 
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(formData);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{topping.id ? 'Editar' : 'Nuevo'} Topping</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                        <input 
                            required 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio (Bs)</label>
                            <input 
                                type="number" step="0.5"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock</label>
                            <input 
                                type="number"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                                value={formData.stock}
                                onChange={e => setFormData({...formData, stock: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                            {saving && <Loader2 className="animate-spin" size={16} />} Guardar
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

function FlavorModal({ flavor, onClose, onSave }) {
    const [formData, setFormData] = useState({ name: '', ...flavor });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(formData);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{flavor.id ? 'Editar' : 'Nuevo'} Sabor</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                        <input 
                            required 
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                            {saving && <Loader2 className="animate-spin" size={16} />} Guardar
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
