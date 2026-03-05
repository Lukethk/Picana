
import { useState } from 'react';
import {AnimatePresence } from 'framer-motion';
import { Settings, Edit3, Trash2, Plus, Image as ImageIcon, LayoutGrid, List, X, Save, Loader2, Upload, Link as LinkIcon, Sparkles } from 'lucide-react';
import { formatBs } from '../utils/format';
import { productService } from '../services/productService';

export default function MenuPage({ products, categories, onManageExtras }) {
    const [activeTab, setActiveTab] = useState('products');
    const [viewMode, setViewMode] = useState('grid');
    const [editingProduct, setEditingProduct] = useState(null); 
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [selectedCategory, setSelectedCategory] = useState('all'); // Category filter

    // Filter products based on search term and category
    const filteredProducts = (products || []).filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === 'all' || p.category_id == selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleSave = async (formData) => {
        setIsSaving(true);
        try {
            if (formData.id) {
                await productService.update(formData.id, formData);
            } else {
                await productService.create(formData);
            }
            // window.location.reload(); 
            // Instead of reloading, close modal and maybe refresh data if passed as prop, 
            // but reloading is a quick fix. Better UX is to update local state.
            // For now, let's keep reload but user reported errors. 
            // Maybe the error is in upload logic.
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Error al guardar producto');
        } finally {
            setIsSaving(false);
            setEditingProduct(null);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            await productService.delete(id);
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar');
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h2 className="text-slate-900 font-bold text-xl">Menú y Productos</h2>
                    <p className="text-slate-400 text-sm">Gestiona lo que vendes</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Extras Button */}
                    <button
                        onClick={onManageExtras}
                        className="flex items-center gap-2 px-3 py-2 bg-pink-50 text-pink-700 hover:bg-pink-100 rounded-lg font-medium text-sm transition-colors border border-pink-200"
                    >
                        <Sparkles size={16} />
                        <span className="hidden sm:inline">Extras y Sabores</span>
                    </button>

                    {/* Search Bar */}
                    {activeTab === 'products' && (
                        <div className="flex gap-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-48"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                </div>
                            </div>
                            
                            <select
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white max-w-[150px]"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">Todas</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* View Switcher */}
                    {activeTab === 'products' && (
                        <div className="bg-white border border-slate-200 p-1 rounded-lg flex items-center shrink-0">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="bg-slate-200 p-1 rounded-lg flex items-center shrink-0">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                activeTab === 'products' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Productos
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                activeTab === 'categories' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Categorías
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {activeTab === 'products' ? (
                viewMode === 'list' ? (
                    <ProductsTable 
                        products={filteredProducts} 
                        categories={categories} 
                        onEdit={setEditingProduct}
                        onDelete={handleDelete}
                    />
                ) : (
                    <ProductsGrid 
                        products={filteredProducts} 
                        categories={categories}
                        onEdit={setEditingProduct}
                        onDelete={handleDelete}
                    />
                )
            ) : (
                <CategoriesTable categories={categories} />
            )}

            {/* Product Modal */}
            <AnimatePresence>
                {editingProduct && (
                    <ProductModal 
                        product={editingProduct === 'new' ? null : editingProduct}
                        categories={categories}
                        onClose={() => setEditingProduct(null)}
                        onSave={handleSave}
                        isSaving={isSaving}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function ProductModal({ product, categories, onClose, onSave, isSaving }) {
    const [formData, setFormData] = useState(() => {
        if (product) {
            return {
                id: product.id,
                name: product.name,
                category_id: product.category_id,
                price: product.price,
                description: product.description || '',
                image_url: product.image_url || '',
                is_active: product.is_active
            };
        }
        return {
            name: '',
            category_id: categories?.[0]?.id || '',
            price: '',
            description: '',
            image_url: '',
            is_active: true
        };
    });
    const [uploadMode, setUploadMode] = useState('url'); // 'url' | 'file'
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let finalData = { ...formData };

        if (uploadMode === 'file' && file) {
            setUploading(true);
            try {
                const url = await productService.uploadImage(file);
                finalData.image_url = url;
            } catch (err) {
                console.error(err);
                // Fallback: If upload fails (e.g. no bucket), warn user but allow saving without image update
                // or ask to use URL.
                alert('No se pudo subir la imagen (Bucket no configurado o error de red). Intenta usar una URL.');
                setUploading(false);
                return;
            }
        }

        onSave(finalData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg text-slate-800">
                        {product ? 'Editar Producto' : 'Nuevo Producto'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre del Producto</label>
                            <input 
                                required
                                type="text" 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Ej. Açaí Tradicional"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoría</label>
                            <select 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                value={formData.category_id}
                                onChange={e => setFormData({...formData, category_id: e.target.value})}
                            >
                                {categories && categories.length > 0 ? (
                                    categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))
                                ) : (
                                    <option value="">Sin categorías</option>
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Precio (Bs)</label>
                            <input 
                                required
                                type="number" 
                                step="0.5"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                            />
                        </div>

                        <div className="col-span-2">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-semibold text-slate-500 uppercase">Imagen</label>
                                <div className="flex bg-slate-100 rounded-lg p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setUploadMode('url')}
                                        className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${uploadMode === 'url' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        URL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUploadMode('file')}
                                        className={`px-2 py-0.5 text-xs font-medium rounded-md transition-all ${uploadMode === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        Subir
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    {uploadMode === 'url' ? (
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input 
                                                type="url" 
                                                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="https://ejemplo.com/img.jpg"
                                                value={formData.image_url}
                                                onChange={e => setFormData({...formData, image_url: e.target.value})}
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                onChange={e => setFile(e.target.files[0])}
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                    {uploadMode === 'file' && file ? (
                                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                                    ) : formData.image_url ? (
                                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon size={16} className="text-slate-300" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descripción</label>
                            <textarea 
                                rows="3"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                placeholder="Detalles del producto..."
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </div>
                </form>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSaving || uploading}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        {isSaving || uploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {uploading ? 'Subiendo...' : 'Guardar Producto'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function ProductsGrid({ products, categories, onEdit, onDelete }) {
    const getCatName = (id) => categories.find(c => c.id === id)?.name || '-';

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
             {/* Add New Card */}
             <button 
                onClick={() => onEdit('new')}
                className="flex flex-col items-center justify-center gap-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all group h-full min-h-[280px]"
            >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={24} />
                </div>
                <span className="font-medium text-sm">Nuevo Producto</span>
            </button>

            {products.map(p => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                    <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden flex items-center justify-center">
                        {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="text-slate-300" size={32} />
                        )}
                        
                        {/* Actions Overlay */}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                            <button 
                                onClick={() => onEdit(p)}
                                className="p-2 bg-white text-slate-700 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-lg"
                            >
                                <Edit3 size={18} />
                            </button>
                            <button 
                                onClick={() => onDelete(p.id)}
                                className="p-2 bg-white text-slate-700 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-lg"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                {getCatName(p.category_id)}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${p.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} title={p.is_active ? 'Activo' : 'Inactivo'} />
                        </div>
                        
                        <h3 className="font-bold text-slate-800 mb-1 line-clamp-1" title={p.name}>{p.name}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3 flex-1">
                            {p.description || 'Sin descripción'}
                        </p>
                        
                        <div className="pt-3 border-t border-slate-50 flex items-center justify-between mt-auto">
                            <span className="font-bold text-slate-900">{formatBs(p.price)}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ProductsTable({ products, categories, onEdit, onDelete }) {
    const getCatName = (id) => categories.find(c => c.id === id)?.name || '-';

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-700 text-sm">Listado de Productos</h3>
                <button 
                    onClick={() => onEdit('new')}
                    className="text-indigo-600 text-sm font-medium hover:text-indigo-700 flex items-center gap-1"
                >
                    <Plus size={16} /> Nuevo Producto
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-5 py-3">Nombre</th>
                            <th className="px-5 py-3">Categoría</th>
                            <th className="px-5 py-3 text-right">Precio</th>
                            <th className="px-5 py-3 text-center">Estado</th>
                            <th className="px-5 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3 font-medium text-slate-800">
                                    {p.name}
                                    {p.description && <p className="text-xs text-slate-400 font-normal">{p.description}</p>}
                                </td>
                                <td className="px-5 py-3 text-slate-500">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        {getCatName(p.category_id)}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right font-bold text-slate-700">{formatBs(p.price)}</td>
                                <td className="px-5 py-3 text-center">
                                    {p.is_active ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                            Inactivo
                                        </span>
                                    )}
                                </td>
                                <td className="px-5 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => onEdit(p)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(p.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function CategoriesTable({ categories }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-700 text-sm">Listado de Categorías</h3>
                <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700 flex items-center gap-1">
                    <Plus size={16} /> Nueva Categoría
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-5 py-3">Nombre</th>
                            <th className="px-5 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {categories.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/50">
                                <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                                <td className="px-5 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors">
                                            <Edit3 size={14} />
                                        </button>
                                        <button className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
