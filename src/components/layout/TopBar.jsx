import { useState } from 'react';
import { Menu, RefreshCw } from 'lucide-react';

const PAGE_TITLES = {
    pos: 'Ventas',
    inventory: 'Inventario',
    reports: 'Reportes',
    settings: 'Configuración',
};

export default function TopBar({ view, businessName, onMenuClick, isConnected, onReconnect }) {
    const [reconnecting, setReconnecting] = useState(false);

    const handleReconnect = async () => {
        if (!onReconnect || reconnecting) return;
        setReconnecting(true);
        try {
            await onReconnect();
        } finally {
            setReconnecting(false);
        }
    };

    return (
        <header className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center gap-3 sticky top-0 z-10 dark:bg-slate-900 dark:border-slate-800">
            {/* Hamburger – mobile */}
            <button
                className="lg:hidden text-slate-500 hover:text-slate-800 cursor-pointer dark:text-slate-400 dark:hover:text-slate-100"
                onClick={onMenuClick}
                aria-label="Abrir menu"
            >
                <Menu size={20} />
            </button>

            {/* Title */}
            <h1 className="flex-1 text-slate-800 font-semibold text-sm dark:text-slate-100">
                {PAGE_TITLES[view] ?? businessName}
            </h1>

            {!isConnected && (
                <button
                    type="button"
                    onClick={handleReconnect}
                    disabled={reconnecting}
                    className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                        reconnecting
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                >
                    <RefreshCw size={14} className={reconnecting ? 'animate-spin' : ''} />
                    {reconnecting ? 'Reconectando' : 'Reconectar'}
                </button>
            )}

            {/* Status pill */}
            <div className={`flex items-center gap-2 border rounded-full px-3 py-1 ${
                isConnected 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-200' 
                    : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`} />
                <span className="text-xs font-medium">
                    {isConnected ? 'En linea' : 'Modo Offline'}
                </span>
            </div>
        </header>
    );
}
