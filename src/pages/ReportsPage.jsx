import { useMemo, useState } from 'react';
import { TrendingUp, ShoppingBag, Award, Clock, FileText, Search } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import BarChart from '../components/reports/BarChart';
import PaymentBreakdown from '../components/reports/PaymentBreakdown';
import { formatBs } from '../utils/format';

export default function ReportsPage({ sales }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    const orders = sales;

    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => o.date === today);
    const totalSales = todayOrders.reduce((s, o) => s + o.total, 0);
    const totalOrders = todayOrders.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    const dateLabel = new Date().toLocaleDateString('es-BO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const filteredHistory = useMemo(() => {
        if (!searchTerm) return sales;
        return sales.filter(s => 
            s.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.created_at?.includes(searchTerm) ||
            s.total.toString().includes(searchTerm)
        );
    }, [sales, searchTerm]);

    return (
        <div className="space-y-5">
            {/* Page header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-slate-900 font-bold text-xl">Reportes y Historial</h2>
                    <p className="text-slate-400 text-sm capitalize">{dateLabel}</p>
                </div>
                
                <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Resumen
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Historial de Ventas
                    </button>
                </div>
            </div>

            {activeTab === 'dashboard' ? (
                <>
                    {/* KPI row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        <StatCard
                            label="Ventas del dia"
                            value={formatBs(totalSales)}
                            icon={TrendingUp}
                            accent="indigo"
                            sub={`${totalOrders} pedido${totalOrders !== 1 ? 's' : ''}`}
                        />
                        <StatCard
                            label="Pedidos totales"
                            value={totalOrders}
                            icon={ShoppingBag}
                            accent="emerald"
                            sub="Completados hoy"
                        />
                        <StatCard
                            label="Ticket promedio"
                            value={formatBs(avgTicket)}
                            icon={Award}
                            accent="amber"
                            sub="Por pedido"
                        />
                        <StatCard
                            label="Hora pico"
                            value="12 pm"
                            icon={Clock}
                            accent="rose"
                            sub="Mayor afluencia"
                        />
                    </div>

                    {/* Chart + breakdown row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2">
                            <BarChart />
                        </div>
                        <div>
                            <PaymentBreakdown orders={todayOrders} />
                        </div>
                    </div>

                    {/* Quick summary card */}
                    <div className="bg-slate-900 rounded-xl p-5 text-white">
                        <h3 className="font-semibold text-sm text-slate-300 mb-4">Resumen Operativo</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Ticket promedio', value: formatBs(avgTicket) },
                                { label: 'Tasa de exito', value: '94%' },
                                { label: 'Producto lider', value: '500 ml' },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-slate-400 text-xs mb-1">{label}</p>
                                    <p className="text-white font-bold text-lg">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                /* History View */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FileText size={18} className="text-slate-400" />
                            Detalle de Transacciones
                        </h3>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Buscar recibo..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left">Recibo</th>
                                    <th className="px-6 py-3 text-left">Fecha</th>
                                    <th className="px-6 py-3 text-left">Método</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                    <th className="px-6 py-3 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {sale.invoice_number || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(sale.created_at).toLocaleString('es-BO')}
                                            </td>
                                            <td className="px-6 py-4 capitalize text-slate-600">
                                                {sale.payment_method}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                {formatBs(sale.total)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    Completado
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                                            No se encontraron ventas
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
