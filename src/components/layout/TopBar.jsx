import { Menu } from 'lucide-react';

const PAGE_TITLES = {
    pos: 'Ventas',
    inventory: 'Inventario',
    reports: 'Reportes',
    settings: 'Configuración',
};

export default function TopBar({ view, onMenuClick, isConnected }) {
    return (
        <header className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center gap-3 sticky top-0 z-10">
            {/* Hamburger – mobile */}
            <button
                className="lg:hidden text-slate-500 hover:text-slate-800 cursor-pointer"
                onClick={onMenuClick}
                aria-label="Abrir menu"
            >
                <Menu size={20} />
            </button>

            {/* Title */}
            <h1 className="flex-1 text-slate-800 font-semibold text-sm">
                {PAGE_TITLES[view] ?? 'La Picana'}
            </h1>

            {/* Status pill */}
            <div className={`flex items-center gap-2 border rounded-full px-3 py-1 ${
                isConnected 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : 'bg-slate-100 border-slate-200 text-slate-500'
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
