
import { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Moon, Printer, Save, Store, Sun, Lock, CheckCircle2 } from 'lucide-react';
import { buildReceiptText } from '../utils/receipt';
import { authService } from '../services/authService';


export default function SettingsPage({ businessName, setBusinessName, theme, setTheme, settings, onSaveSettings }) {
    const isDark = theme === 'dark';
    const [saving, setSaving] = useState(false);
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });
    const [passSaving, setPassSaving] = useState(false);
    const [passStatus, setPassStatus] = useState(null); // { type: 'success' | 'error', msg: string }

    const defaults = useMemo(() => ({
        printer_config: {
            enabled: false,
            mode: 'browser',
            ip: '',
            port: 9100,
            paper_width_mm: 80,
            chars_per_line: 48,
            copies: 1,
        },
        receipt_config: {
            header_title: '',
            header_lines: '',
            footer_lines: '',
            show_datetime: true,
            show_sale_id: true,
            show_payment_method: true,
            show_item_options: true,
        }
    }), []);

    const [form, setForm] = useState(() => ({
        printer_config: { ...defaults.printer_config, ...(settings?.printer_config ?? settings?.config?.printer_config ?? {}) },
        receipt_config: { ...defaults.receipt_config, ...(settings?.receipt_config ?? settings?.config?.receipt_config ?? {}) },
    }));

    useEffect(() => {
        setForm({
            printer_config: { ...defaults.printer_config, ...(settings?.printer_config ?? settings?.config?.printer_config ?? {}) },
            receipt_config: { ...defaults.receipt_config, ...(settings?.receipt_config ?? settings?.config?.receipt_config ?? {}) },
        });
    }, [defaults, settings]);

    const updatePrinter = (patch) => {
        setForm(prev => ({ ...prev, printer_config: { ...prev.printer_config, ...patch } }));
    };

    const updateReceipt = (patch) => {
        setForm(prev => ({ ...prev, receipt_config: { ...prev.receipt_config, ...patch } }));
    };

    const paperWidth = Number(form.printer_config.paper_width_mm) || 80;
    const charsPerLineAuto = paperWidth === 58 ? 32 : 48;

    const preview = useMemo(() => {
        const items = [
            {
                qty: 1,
                product: { name: 'Açaí Bowl' },
                lineTotal: 30.0,
                options: { toppings: [{ name: 'Granola' }, { name: 'Nutella' }], flavors: [] }
            },
            {
                qty: 2,
                product: { name: 'Agua 500ml' },
                lineTotal: 12.0,
                options: { toppings: [], flavors: [] }
            },
        ];

        return buildReceiptText({
            businessName,
            receiptConfig: form.receipt_config,
            printerConfig: {
                ...form.printer_config,
                chars_per_line: Number(form.printer_config.chars_per_line) || charsPerLineAuto,
            },
            saleId: '12345',
            paymentMethod: 'efectivo',
            createdAt: new Date(),
            cartItems: items,
        });
    }, [businessName, charsPerLineAuto, form.printer_config, form.receipt_config]);

    const handleSave = async () => {
        if (!onSaveSettings || saving) return;
        setSaving(true);
        try {
            await onSaveSettings({
                printer_config: form.printer_config,
                receipt_config: form.receipt_config,
            });
        } catch (err) {
            console.error(err);
            alert(err?.message || 'No se pudo guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setPassStatus({ type: 'error', msg: 'Las contraseñas no coinciden' });
            return;
        }
        if (passwords.new.length < 6) {
            setPassStatus({ type: 'error', msg: 'Mínimo 6 caracteres' });
            return;
        }

        setPassSaving(true);
        setPassStatus(null);
        try {
            await authService.updatePassword(passwords.new);
            setPassStatus({ type: 'success', msg: 'Contraseña actualizada' });
            setPasswords({ new: '', confirm: '' });
        } catch (err) {
            setPassStatus({ type: 'error', msg: err.message || 'Error al actualizar' });
        } finally {
            setPassSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-slate-900 font-bold text-xl dark:text-slate-100">Configuración</h2>
                    <p className="text-slate-400 text-sm dark:text-slate-400">Preferencias generales del sistema</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/60">
                            <Store size={18} className="text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-slate-900 font-bold text-sm dark:text-slate-100">Empresa</h3>
                            <p className="text-slate-500 text-xs dark:text-slate-400">Nombre que se muestra en el sistema</p>
                        </div>
                    </div>

                    <div className="mt-5">
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                            Nombre
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Ej. La Picana"
                        />
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Se guarda automáticamente en este dispositivo.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                            {isDark ? (
                                <Moon size={18} className="text-slate-700 dark:text-slate-200" />
                            ) : (
                                <Sun size={18} className="text-slate-700 dark:text-slate-200" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-slate-900 font-bold text-sm dark:text-slate-100">Apariencia</h3>
                            <p className="text-slate-500 text-xs dark:text-slate-400">Tema del sistema</p>
                        </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tema oscuro</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Cambia el estilo general de la aplicación.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setTheme(isDark ? 'light' : 'dark')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                isDark ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                            aria-pressed={isDark}
                            aria-label="Alternar tema oscuro"
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                                    isDark ? 'translate-x-5' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 dark:bg-red-950/40 dark:border-red-900/60">
                            <Lock size={18} className="text-red-600 dark:text-red-300" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-slate-900 font-bold text-sm dark:text-slate-100">Seguridad</h3>
                            <p className="text-slate-500 text-xs dark:text-slate-400">Cambiar contraseña de acceso</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordUpdate} className="mt-5 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 dark:text-slate-400">Nueva contraseña</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                    value={passwords.new}
                                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 dark:text-slate-400">Confirmar</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="min-w-0">
                                {passStatus && (
                                    <p className={`text-[11px] font-bold flex items-center gap-1 ${passStatus.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {passStatus.type === 'success' && <CheckCircle2 size={12} />}
                                        {passStatus.msg}
                                    </p>
                                )}
                            </div>
                            <button
                                disabled={passSaving}
                                className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {passSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Actualizar
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100 dark:bg-amber-950/40 dark:border-amber-900/60">
                            <Printer size={18} className="text-amber-700 dark:text-amber-300" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-slate-900 font-bold text-sm dark:text-slate-100">Impresora</h3>
                            <p className="text-slate-500 text-xs dark:text-slate-400">Conexión y formato del papel</p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Habilitar impresora</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Activa el módulo de impresión de tickets.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => updatePrinter({ enabled: !form.printer_config.enabled })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    form.printer_config.enabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                                aria-pressed={!!form.printer_config.enabled}
                                aria-label="Alternar impresora"
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${
                                        form.printer_config.enabled ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                    Modo
                                </label>
                                <select
                                    value={form.printer_config.mode}
                                    onChange={(e) => updatePrinter({ mode: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                >
                                    <option value="browser">Navegador (Imprimir)</option>
                                    <option value="network">Red (TCP)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                    Copias
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                    value={form.printer_config.copies}
                                    onChange={(e) => updatePrinter({ copies: Number(e.target.value) || 1 })}
                                />
                            </div>
                        </div>

                        {form.printer_config.mode === 'network' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                        IP
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                        placeholder="192.168.0.50"
                                        value={form.printer_config.ip}
                                        onChange={(e) => updatePrinter({ ip: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                        Puerto
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                        value={form.printer_config.port}
                                        onChange={(e) => updatePrinter({ port: Number(e.target.value) || 9100 })}
                                    />
                                </div>
                            </div>
                        ) : null}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                    Ancho papel
                                </label>
                                <select
                                    value={form.printer_config.paper_width_mm}
                                    onChange={(e) => updatePrinter({ paper_width_mm: Number(e.target.value), chars_per_line: Number(e.target.value) === 58 ? 32 : 48 })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                >
                                    <option value="58">58mm</option>
                                    <option value="80">80mm</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                    Caracteres / línea
                                </label>
                                <input
                                    type="number"
                                    min="24"
                                    max="64"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                    value={form.printer_config.chars_per_line}
                                    onChange={(e) => updatePrinter({ chars_per_line: Number(e.target.value) || charsPerLineAuto })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/60">
                            <FileText size={18} className="text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-slate-900 font-bold text-sm dark:text-slate-100">Ticket</h3>
                            <p className="text-slate-500 text-xs dark:text-slate-400">Texto y qué mostrar</p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                Título (cabecera)
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                value={form.receipt_config.header_title}
                                onChange={(e) => updateReceipt({ header_title: e.target.value })}
                                placeholder={businessName || 'Nombre de la empresa'}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                    Mostrar fecha/hora
                                </label>
                                <button
                                    type="button"
                                    onClick={() => updateReceipt({ show_datetime: !form.receipt_config.show_datetime })}
                                    className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                                        form.receipt_config.show_datetime
                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                            : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {form.receipt_config.show_datetime ? 'Sí' : 'No'}
                                </button>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                    Mostrar ID pedido
                                </label>
                                <button
                                    type="button"
                                    onClick={() => updateReceipt({ show_sale_id: !form.receipt_config.show_sale_id })}
                                    className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                                        form.receipt_config.show_sale_id
                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                            : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {form.receipt_config.show_sale_id ? 'Sí' : 'No'}
                                </button>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                    Mostrar método
                                </label>
                                <button
                                    type="button"
                                    onClick={() => updateReceipt({ show_payment_method: !form.receipt_config.show_payment_method })}
                                    className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                                        form.receipt_config.show_payment_method
                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                            : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {form.receipt_config.show_payment_method ? 'Sí' : 'No'}
                                </button>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                    Mostrar opciones
                                </label>
                                <button
                                    type="button"
                                    onClick={() => updateReceipt({ show_item_options: !form.receipt_config.show_item_options })}
                                    className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                                        form.receipt_config.show_item_options
                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                            : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {form.receipt_config.show_item_options ? 'Sí' : 'No'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                Líneas extra (cabecera)
                            </label>
                            <textarea
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                value={form.receipt_config.header_lines}
                                onChange={(e) => updateReceipt({ header_lines: e.target.value })}
                                placeholder={'Dirección\nTeléfono\nNIT'}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 dark:text-slate-400">
                                Líneas extra (pie)
                            </label>
                            <textarea
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100"
                                value={form.receipt_config.footer_lines}
                                onChange={(e) => updateReceipt({ footer_lines: e.target.value })}
                                placeholder={'Gracias por su compra\nVuelva pronto'}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                        <h3 className="text-slate-900 font-bold text-sm dark:text-slate-100">Vista previa</h3>
                        <p className="text-slate-500 text-xs dark:text-slate-400">Así se vería el ticket según tu configuración.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!onSaveSettings || saving}
                        className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.99] text-white font-bold text-sm transition-all disabled:opacity-60 dark:hover:shadow-indigo-900/30"
                    >
                        <span className="inline-flex items-center gap-2">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Guardar
                        </span>
                    </button>
                </div>
                <pre className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50 overflow-auto text-xs leading-relaxed font-mono text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200">
                    {preview}
                </pre>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Se guarda en este dispositivo y, si es posible, también en Supabase.
                </p>
            </div>
        </div>
    );
}
