import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, FileText, Search, Trash2, X, Loader2, Printer, Download } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import BarChart from '../components/reports/BarChart';
import PaymentBreakdown from '../components/reports/PaymentBreakdown';
import { formatBs } from '../utils/format';
import { buildReceiptText } from '../utils/receipt';
import Tooltip from '../components/ui/Tooltip';

export default function ReportsPage({ sales = [], hasMoreSales, onLoadMoreSales, expenses = [], products = [], toppings = [], flavors = [], onDeleteSale, businessName, settings }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [saleToDelete, setSaleToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [periodMode, setPeriodMode] = useState('day');
    const [dayValue, setDayValue] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [weekValue, setWeekValue] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [monthValue, setMonthValue] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const orders = useMemo(() => sales || [], [sales]);

    const periodRange = useMemo(() => {
        const atMidnight = (d) => {
            const x = new Date(d);
            x.setHours(0, 0, 0, 0);
            return x;
        };
        const addDays = (d, days) => {
            const x = new Date(d);
            x.setDate(x.getDate() + days);
            return x;
        };
        const parseYmd = (ymd) => {
            const [y, m, dd] = String(ymd || '').split('-');
            const year = Number(y);
            const month = Number(m) - 1;
            const day = Number(dd);
            if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return new Date();
            return new Date(year, month, day);
        };
        const parseYm = (ym) => {
            const [y, m] = String(ym || '').split('-');
            const year = Number(y);
            const monthIndex = Number(m) - 1;
            if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
                const now = new Date();
                return { year: now.getFullYear(), monthIndex: now.getMonth() };
            }
            return { year, monthIndex };
        };
        const startOfWeek = (d) => {
            const x = atMidnight(d);
            const day = x.getDay();
            const diff = day === 0 ? -6 : (1 - day);
            x.setDate(x.getDate() + diff);
            return x;
        };

        if (periodMode === 'week') {
            const ref = parseYmd(weekValue);
            const start = startOfWeek(ref);
            const end = addDays(start, 7);
            return { start, end };
        }
        if (periodMode === 'month') {
            const { year, monthIndex } = parseYm(monthValue);
            const start = new Date(year, monthIndex, 1);
            const end = new Date(year, monthIndex + 1, 1);
            return { start, end };
        }

        const ref = parseYmd(dayValue);
        const start = atMidnight(ref);
        const end = addDays(start, 1);
        return { start, end };
    }, [dayValue, monthValue, periodMode, weekValue]);

    const periodOrders = useMemo(() => {
        const { start, end } = periodRange;
        return orders.filter(o => {
            const d = o?.created_at ? new Date(o.created_at) : new Date(Number(o?.ts) || 0);
            return d >= start && d < end;
        });
    }, [orders, periodRange]);

    const periodExpenses = useMemo(() => {
        const { start, end } = periodRange;
        return (expenses || []).filter(e => {
            const d = e?.created_at ? new Date(e.created_at) : new Date(Number(e?.ts) || 0);
            return d >= start && d < end;
        });
    }, [expenses, periodRange]);

    const totalSales = useMemo(() => periodOrders.reduce((s, o) => s + (Number(o?.total) || 0), 0), [periodOrders]);
    const totalExpenses = useMemo(() => periodExpenses.reduce((s, e) => s + (Number(e?.amount) || 0), 0), [periodExpenses]);
    const netProfit = totalSales - totalExpenses;
    const totalOrders = periodOrders.length;
    
    const productById = Object.fromEntries((products || []).map(p => [String(p.id), p]));
    const toppingById = Object.fromEntries((toppings || []).map(t => [String(t.id), t]));
    const flavorById = Object.fromEntries((flavors || []).map(f => [String(f.id), f]));

    const todayStats = useMemo(() => computeTodayStats(periodOrders, productById, toppingById, flavorById), [flavorById, periodOrders, productById, toppingById]);

    const dateLabel = new Date().toLocaleDateString('es-BO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const periodUi = useMemo(() => {
        const { start, end } = periodRange;
        if (periodMode === 'month') {
            return {
                label: start.toLocaleDateString('es-BO', { year: 'numeric', month: 'long' }),
                statLabel: 'Ventas del mes',
                chartSubtitle: 'Unidades vendidas — mes',
            };
        }
        if (periodMode === 'week') {
            const endShown = new Date(end);
            endShown.setDate(endShown.getDate() - 1);
            return {
                label: `${start.toLocaleDateString('es-BO')} – ${endShown.toLocaleDateString('es-BO')}`,
                statLabel: 'Ventas de la semana',
                chartSubtitle: 'Unidades vendidas — semana',
            };
        }
        return {
            label: start.toLocaleDateString('es-BO'),
            statLabel: 'Ventas del día',
            chartSubtitle: 'Unidades vendidas — día',
        };
    }, [periodMode, periodRange]);

    const monthRange = useMemo(() => {
        const [y, m] = String(monthValue || '').split('-');
        const year = Number(y);
        const monthIndex = Number(m) - 1;
        if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return { start, end };
        }
        const start = new Date(year, monthIndex, 1);
        const end = new Date(year, monthIndex + 1, 1);
        return { start, end };
    }, [monthValue]);

    const monthlyOrders = useMemo(() => {
        const { start, end } = monthRange;
        return (orders || []).filter(o => {
            const d = o?.created_at ? new Date(o.created_at) : new Date(Number(o?.ts) || 0);
            return d >= start && d < end;
        });
    }, [monthRange, orders]);

    const monthlyTotal = useMemo(() => monthlyOrders.reduce((s, o) => s + (Number(o?.total) || 0), 0), [monthlyOrders]);
    const monthlyCount = monthlyOrders.length;
    const monthlyAvg = monthlyCount ? (monthlyTotal / monthlyCount) : 0;
    const monthlyStats = useMemo(() => computeTodayStats(monthlyOrders, productById, toppingById, flavorById), [flavorById, monthlyOrders, productById, toppingById]);

    const monthlyMethodCounts = useMemo(() => {
        const counts = {};
        for (const o of monthlyOrders) {
            const k = String(o?.method || o?.payment_method || 'otro').toLowerCase();
            counts[k] = (counts[k] || 0) + 1;
        }
        return counts;
    }, [monthlyOrders]);

    const monthlyDaily = useMemo(() => {
        const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const map = new Map();
        for (const o of monthlyOrders) {
            const d = o?.created_at ? new Date(o.created_at) : new Date(Number(o?.ts) || 0);
            const key = toKey(d);
            const prev = map.get(key) || { key, count: 0, total: 0 };
            prev.count += 1;
            prev.total += Number(o?.total) || 0;
            map.set(key, prev);
        }
        return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
    }, [monthlyOrders]);

    const filteredHistory = (() => {
        // In history tab, respect the period filter. Search adds secondary filter on top.
        const source = activeTab === 'history' ? periodOrders : orders;
        if (!searchTerm) return source;
        const q = searchTerm.toLowerCase();
        return source.filter(s => {
            const invoice = String(s.invoice_number || s.id || '').toLowerCase();
            const ts = s.ts ? new Date(s.ts).toLocaleString('es-BO').toLowerCase() : '';
            const total = String(s.total ?? '');
            const method = String(s.method || s.payment_method || '').toLowerCase();
            return invoice.includes(q) || ts.includes(q) || total.includes(q) || method.includes(q);
        });
    })();

    const printerConfig = settings?.printer_config ?? settings?.config?.printer_config;
    const receiptConfig = settings?.receipt_config ?? settings?.config?.receipt_config;
    const printerEnabled = !!printerConfig?.enabled;
    const printerMode = printerConfig?.mode || 'browser';

    const exportMonthlyPdf = () => {
        const { start } = monthRange;
        const monthTitle = start.toLocaleDateString('es-BO', { year: 'numeric', month: 'long' });
        const html = buildMonthlyReportHtml({
            businessName,
            monthTitle,
            generatedAt: new Date(),
            totals: {
                total: monthlyTotal,
                count: monthlyCount,
                avg: monthlyAvg,
            },
            methodCounts: monthlyMethodCounts,
            dailyRows: monthlyDaily,
            topProducts: monthlyStats?.topProducts || [],
        });
        printHtmlForPdf(html);
    };

    const confirmDelete = async () => {
        if (!saleToDelete || !onDeleteSale || deleting) return;
        setDeleting(true);
        try {
            await onDeleteSale(saleToDelete.id);
            setSaleToDelete(null);
        } catch (err) {
            console.error(err);
            alert(err?.message || 'No se pudo eliminar la venta');
        } finally {
            setDeleting(false);
        }
    };

    const handlePrint = (sale) => {
        if (!printerEnabled || printerMode !== 'browser') return;
        const saleId = sale?.invoice_number || sale?.id || null;
        const createdAt = sale?.created_at || (sale?.ts ? new Date(sale.ts) : new Date());
        const paymentMethod = sale?.method || sale?.payment_method;

        const rawItems = Array.isArray(sale?.items_detail) ? sale.items_detail : [];
        const items = rawItems.map((it) => {
            const qty = Number(it?.qty ?? it?.quantity ?? 0) || 0;
            const productId = it?.product?.id ?? it?.product_id;
            const name = it?.product?.name ?? it?.product?.name ?? productById?.[String(productId)]?.name ?? it?.name ?? '';
            const unitPrice = Number(it?.unitPrice ?? it?.unit_price ?? it?.unitPrice ?? 0) || 0;
            const lineTotal = Number((it?.lineTotal ?? it?.total) ?? (qty * unitPrice)) || 0;
            const options = it?.options || {
                toppings: it?.toppings || [],
                flavors: it?.flavors || [],
            };

            return {
                qty,
                product: { id: productId, name },
                unitPrice,
                lineTotal,
                options,
            };
        });

        const text = buildReceiptText({
            businessName,
            receiptConfig,
            printerConfig,
            saleId,
            paymentMethod,
            createdAt,
            cartItems: items,
        });

        printReceiptText(text);
    };

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
                    <div className="glass rounded-2xl border border-white/40 dark:border-white/10 shadow-lg p-5 dark:glass-dark mb-5">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="text-slate-800 font-semibold text-sm">Filtro de reportes</h3>
                                    <Tooltip position="bottom" text="Filtra las estadísticas por día, semana o mes para ver el rendimiento detallado." />
                                </div>
                                <p className="text-slate-500 text-xs">{periodUi.label}</p>
                            </div>

                            <div className="flex items-end gap-3 flex-wrap">
                                <div className="bg-slate-200 p-1 rounded-lg flex items-center shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setPeriodMode('day')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${periodMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Día
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPeriodMode('week')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${periodMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Semana
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPeriodMode('month')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${periodMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Mes
                                    </button>
                                </div>

                                {periodMode === 'day' ? (
                                    <div className="min-w-[190px]">
                                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Fecha</label>
                                        <input
                                            type="date"
                                            value={dayValue}
                                            onChange={(e) => setDayValue(e.target.value)}
                                            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                                        />
                                    </div>
                                ) : null}

                                {periodMode === 'week' ? (
                                    <div className="min-w-[190px]">
                                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Semana de</label>
                                        <input
                                            type="date"
                                            value={weekValue}
                                            onChange={(e) => setWeekValue(e.target.value)}
                                            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                                        />
                                    </div>
                                ) : null}

                                {periodMode === 'month' ? (
                                    <div className="min-w-[190px]">
                                        <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Mes</label>
                                        <input
                                            type="month"
                                            value={monthValue}
                                            onChange={(e) => setMonthValue(e.target.value)}
                                            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="glass rounded-2xl border border-white/40 dark:border-white/10 shadow-lg p-6 dark:glass-dark mb-6 mt-4">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                            <div>
                                <h3 className="text-slate-800 font-semibold text-sm">Reporte mensual</h3>
                                <p className="text-slate-500 text-xs">
                                    {monthRange.start.toLocaleDateString('es-BO', { year: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <div className="flex items-end gap-3 flex-wrap">
                                <div className="min-w-[190px]">
                                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Mes</label>
                                    <input
                                        type="month"
                                        value={monthValue}
                                        onChange={(e) => setMonthValue(e.target.value)}
                                        className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={exportMonthlyPdf}
                                    className="h-[42px] px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200 active:scale-[0.99] text-white font-bold text-sm transition-all"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Download size={16} />
                                        Exportar PDF
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">Ventas</p>
                                <p className="text-lg font-extrabold text-slate-900">{formatBs(monthlyTotal)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">Pedidos</p>
                                <p className="text-lg font-extrabold text-slate-900">{monthlyCount}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs text-slate-500">Ticket promedio</p>
                                <p className="text-lg font-extrabold text-slate-900">{formatBs(monthlyAvg)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                            <div className="rounded-2xl border border-slate-200 bg-white/50 dark:bg-slate-900/50 dark:border-white/5 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Ventas por día
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Fecha</th>
                                                <th className="px-4 py-2 text-right">Pedidos</th>
                                                <th className="px-4 py-2 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {monthlyDaily.length ? monthlyDaily.map(r => (
                                                <tr key={r.key}>
                                                    <td className="px-4 py-2 text-slate-700">
                                                        {new Date(`${r.key}T00:00:00`).toLocaleDateString('es-BO')}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-slate-700 font-semibold">{r.count}</td>
                                                    <td className="px-4 py-2 text-right text-slate-900 font-bold">{formatBs(r.total)}</td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="3" className="px-4 py-6 text-center text-slate-400">Sin ventas este mes</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white/50 dark:bg-slate-900/50 dark:border-white/5 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Top productos
                                </div>
                                <div className="p-4">
                                    {monthlyStats?.topProducts?.length ? (
                                        <div className="space-y-3">
                                            {monthlyStats.topProducts.slice(0, 6).map(p => (
                                                <div key={p.id} className="flex items-center justify-between gap-3">
                                                    <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                                                    <p className="text-sm font-semibold text-slate-900">{p.count} uds.</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400">Sin datos</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KPI row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <StatCard
                            label={periodUi.statLabel}
                            value={formatBs(totalSales)}
                            icon={TrendingUp}
                            accent="indigo"
                            sub={`${periodOrders.length} pedido${periodOrders.length !== 1 ? 's' : ''}`}
                        />
                        <StatCard
                            label="Gastos del periodo"
                            value={formatBs(totalExpenses)}
                            icon={TrendingDown}
                            accent="rose"
                            sub={`${periodExpenses.length} registro${periodExpenses.length !== 1 ? 's' : ''}`}
                        />
                        <StatCard
                            label="Utilidad Real"
                            value={formatBs(netProfit)}
                            icon={DollarSign}
                            accent={netProfit >= 0 ? 'emerald' : 'rose'}
                            sub={netProfit >= 0 ? 'Ganancia neta' : 'Pérdida en el periodo'}
                        />
                        <StatCard
                            label="Ticket Promedio"
                            value={formatBs(periodOrders.length ? totalSales / periodOrders.length : 0)}
                            icon={ShoppingBag}
                            accent="amber"
                            sub="Promedio por venta"
                        />
                    </div>

                    {/* Chart + breakdown row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2">
                            <BarChart orders={periodOrders} subtitle={periodUi.chartSubtitle} />
                        </div>
                        <div>
                            <PaymentBreakdown orders={periodOrders} />
                        </div>
                        <TopBarsCard title="Top productos" items={todayStats.topProducts} />
                    </div>
                </>
            ) : (
                /* History View */
                <div className="glass rounded-2xl border border-white/40 dark:border-white/10 shadow-lg overflow-hidden dark:glass-dark">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
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
                                    <th className="px-6 py-3 text-center">Acciones</th>
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
                                                {sale.ts ? new Date(sale.ts).toLocaleString('es-BO') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 capitalize text-slate-600">
                                                {sale.method || sale.payment_method}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                {formatBs(sale.total)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    Completado
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={!printerEnabled || printerMode !== 'browser'}
                                                        onClick={() => handlePrint(sale)}
                                                        className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-50"
                                                        title={printerEnabled ? 'Imprimir' : 'Impresora desactivada'}
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={!onDeleteSale}
                                                        onClick={() => setSaleToDelete(sale)}
                                                        className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all disabled:opacity-50"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                                            No se encontraron ventas
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {activeTab === 'history' && hasMoreSales && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-center">
                            <button 
                                onClick={onLoadMoreSales}
                                className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Cargar más ventas
                            </button>
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence initial={false}>
                {saleToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={deleting ? undefined : () => setSaleToDelete(null)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 8 }}
                            transition={{ duration: 0.14 }}
                            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">Eliminar venta</h3>
                                    <p className="text-xs text-slate-500">
                                        {saleToDelete.ts ? new Date(saleToDelete.ts).toLocaleString('es-BO') : 'N/A'} · {formatBs(saleToDelete.total)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={() => setSaleToDelete(null)}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 active:scale-95 transition-all disabled:opacity-60 rounded-lg p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-sm text-slate-700">
                                    Esta acción eliminará el pedido del historial.
                                </p>
                                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-slate-800">Recibo</p>
                                        <p className="text-sm text-slate-600">{saleToDelete.invoice_number || saleToDelete.id}</p>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 mt-2">
                                        <p className="text-sm font-semibold text-slate-800">Método</p>
                                        <p className="text-sm text-slate-600 capitalize">{saleToDelete.method || saleToDelete.payment_method}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={() => setSaleToDelete(null)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 bg-white font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-60"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    disabled={deleting}
                                    onClick={confirmDelete}
                                    className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 active:scale-[0.99] text-white font-bold text-sm transition-all disabled:opacity-60"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                        Eliminar
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function computeTodayStats(todayOrders, productById, toppingById, flavorById) {
    const productCounts = new Map();
    const toppingCounts = new Map();
    const flavorCounts = new Map();

    const bump = (map, key, inc) => {
        if (!key) return;
        map.set(key, (map.get(key) || 0) + inc);
    };

    for (const order of todayOrders || []) {
        const lines = Array.isArray(order?.items_detail) ? order.items_detail : [];
        for (const line of lines) {
            const qty = Number(line?.qty ?? line?.quantity ?? 0) || 0;
            const productId = line?.product?.id ?? line?.product_id;
            if (productId !== undefined && productId !== null) bump(productCounts, String(productId), qty);

            const options = line?.options || {};

            const lineToppings = Array.isArray(options?.toppings)
                ? options.toppings
                : Array.isArray(line?.toppings)
                    ? line.toppings
                    : [];

            const lineFlavors = Array.isArray(options?.flavors)
                ? options.flavors
                : Array.isArray(line?.flavors)
                    ? line.flavors
                    : [];

            for (const t of lineToppings) {
                const id = t?.id ?? t;
                const name = t?.name ?? toppingById?.[String(id)]?.name;
                bump(toppingCounts, String(name || id), qty || 1);
            }

            for (const f of lineFlavors) {
                const id = f?.id ?? f;
                const name = f?.name ?? flavorById?.[String(id)]?.name;
                bump(flavorCounts, String(name || id), qty || 1);
            }
        }
    }

    const topFromMap = (map) => {
        let best = null;
        for (const [key, count] of map.entries()) {
            if (!best || count > best.count) best = { key, count };
        }
        return best;
    };

    const topProductEntry = topFromMap(productCounts);
    const topProduct = topProductEntry
        ? {
            id: topProductEntry.key,
            name: productById?.[topProductEntry.key]?.name || `#${topProductEntry.key}`,
            count: topProductEntry.count
        }
        : null;

    const topToppingEntry = topFromMap(toppingCounts);
    const topTopping = topToppingEntry ? { name: topToppingEntry.key, count: topToppingEntry.count } : null;

    const topFlavorEntry = topFromMap(flavorCounts);
    const topFlavor = topFlavorEntry ? { name: topFlavorEntry.key, count: topFlavorEntry.count } : null;

    const topProducts = Array.from(productCounts.entries())
        .map(([id, count]) => ({ id, name: productById?.[id]?.name || `#${id}`, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

    return { topProduct, topTopping, topFlavor, topProducts };
}

function TopBarsCard({ title, items }) {
    const max = Math.max(...(items || []).map(i => i.count), 1);

    return (
        <div className="glass rounded-2xl border border-white/40 dark:border-white/10 shadow-lg p-5 dark:glass-dark h-full">
            <h3 className="text-slate-800 font-bold text-sm mb-5 dark:text-slate-100">{title}</h3>
            {(items || []).length === 0 ? (
                <p className="text-slate-400 text-sm dark:text-slate-400">Sin datos para hoy</p>
            ) : (
                <div className="space-y-3">
                    {(items || []).map((it) => {
                        const pct = Math.round((it.count / max) * 100);
                        return (
                            <div key={it.id} className="space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-medium text-slate-700 truncate dark:text-slate-200">{it.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{it.count} uds.</p>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function printReceiptText(text) {
    const win = window.open('', '_blank', 'width=420,height=700');
    if (!win) {
        alert('No se pudo abrir la ventana de impresión (bloqueador de pop-ups).');
        return;
    }
    const safe = String(text || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    win.document.open();
    win.document.write(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Ticket</title>
            <style>
              body { margin: 0; padding: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
              pre { white-space: pre-wrap; font-size: 12px; line-height: 1.25; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body><pre>${safe}</pre></body>
        </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
        try {
            win.print();
        } finally {
            setTimeout(() => win.close(), 300);
        }
    }, 80);
}

function buildMonthlyReportHtml({ businessName, monthTitle, generatedAt, totals, methodCounts, dailyRows, topProducts }) {
    const esc = (s) => String(s ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');

    const money = (n) => esc(formatBs(Number(n) || 0));
    const genAt = generatedAt ? new Date(generatedAt).toLocaleString('es-BO') : '';

    const methodEntries = Object.entries(methodCounts || {}).sort((a, b) => b[1] - a[1]);
    const daily = Array.isArray(dailyRows) ? dailyRows : [];
    const tops = Array.isArray(topProducts) ? topProducts : [];

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Reporte mensual</title>
          <style>
            @page { size: A4; margin: 14mm; }
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; color: #0f172a; }
            h1 { font-size: 18px; margin: 0 0 4px; }
            h2 { font-size: 12px; margin: 18px 0 8px; text-transform: uppercase; letter-spacing: .08em; color: #475569; }
            .meta { font-size: 12px; color: #64748b; margin: 0 0 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
            .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; background: #f8fafc; }
            .label { font-size: 11px; color: #64748b; margin-bottom: 6px; }
            .value { font-size: 18px; font-weight: 800; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            th { text-align: left; color: #475569; font-weight: 700; background: #f8fafc; }
            .right { text-align: right; }
            .two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          </style>
        </head>
        <body>
          <h1>${esc(businessName || 'Reporte')}</h1>
          <p class="meta">Reporte mensual: ${esc(monthTitle || '')} · Generado: ${esc(genAt)}</p>

          <div class="grid">
            <div class="card">
              <div class="label">Ventas</div>
              <div class="value">${money(totals?.total)}</div>
            </div>
            <div class="card">
              <div class="label">Pedidos</div>
              <div class="value">${esc(totals?.count ?? 0)}</div>
            </div>
            <div class="card">
              <div class="label">Ticket promedio</div>
              <div class="value">${money(totals?.avg)}</div>
            </div>
          </div>

          <div class="two">
            <div>
              <h2>Ventas por día</h2>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th class="right">Pedidos</th>
                    <th class="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${daily.length ? daily.map(r => `
                    <tr>
                      <td>${esc(new Date(`${r.key}T00:00:00`).toLocaleDateString('es-BO'))}</td>
                      <td class="right">${esc(r.count)}</td>
                      <td class="right">${money(r.total)}</td>
                    </tr>
                  `).join('') : `
                    <tr><td colspan="3">Sin ventas</td></tr>
                  `}
                </tbody>
              </table>
            </div>

            <div>
              <h2>Métodos de pago</h2>
              <table>
                <thead>
                  <tr>
                    <th>Método</th>
                    <th class="right">Pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  ${methodEntries.length ? methodEntries.map(([k, v]) => `
                    <tr>
                      <td>${esc(k)}</td>
                      <td class="right">${esc(v)}</td>
                    </tr>
                  `).join('') : `
                    <tr><td colspan="2">Sin datos</td></tr>
                  `}
                </tbody>
              </table>

              <h2>Top productos</h2>
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="right">Unidades</th>
                  </tr>
                </thead>
                <tbody>
                  ${tops.length ? tops.slice(0, 10).map(p => `
                    <tr>
                      <td>${esc(p.name)}</td>
                      <td class="right">${esc(p.count)}</td>
                    </tr>
                  `).join('') : `
                    <tr><td colspan="2">Sin datos</td></tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;
}

function printHtmlForPdf(html) {
    const win = window.open('', '_blank', 'width=980,height=720');
    if (!win) {
        alert('No se pudo abrir la ventana de impresión (bloqueador de pop-ups).');
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
        try {
            win.print();
        } finally {
            setTimeout(() => win.close(), 300);
        }
    }, 150);
}
