import { AnimatePresence, motion } from 'framer-motion';
import {
    ShoppingCart,
    Package,
    BarChart3,
    UtensilsCrossed,
    Settings,
    LogOut,
    User,
    Wallet
} from 'lucide-react';
import { authService } from '../../services/authService';

const NAV = [
    { id: 'pos', label: 'Ventas', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'expenses', label: 'Gastos', icon: Wallet },
    { id: 'menu', label: 'Menú & Productos', icon: UtensilsCrossed },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    { id: 'settings', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ businessName, view, setView, cartCount, open, setOpen, user }) {
    const handleLogout = async () => {
        if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
            await authService.logout();
        }
    };

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        className="fixed inset-0 bg-black/40 z-20 lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>

            <aside
                className={`
          fixed left-0 top-0 h-full w-60 z-30 flex flex-col
          bg-slate-900 shadow-xl
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {/* Brand */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/60">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <UtensilsCrossed size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-white font-bold text-base leading-none tracking-tight">{businessName}</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest px-2 mb-3">
                        Menu principal
                    </p>
                    {NAV.map(({ id, label, icon: Icon }) => {
                        const active = view === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => { setView(id); setOpen(false); }}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 cursor-pointer text-left
                  ${active
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                    }
                `}
                            >
                                <Icon size={16} />
                                <span>{label}</span>
                                {id === 'pos' && cartCount > 0 && (
                                    <span className="ml-auto bg-white text-indigo-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User & Logout */}
                <div className="px-3 py-4 border-t border-slate-700/60 space-y-2">
                    {user && (
                        <div className="flex items-center gap-3 px-3 py-2 text-slate-300">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                <User size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-white truncate">{user.email?.split('@')[0]}</p>
                                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-150"
                    >
                        <LogOut size={16} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>

                {/* Footer */}
                <div className="px-5 py-2 border-t border-slate-700/60 bg-slate-950/40">
                    <p className="text-slate-600 text-[10px]">Santa Cruz, Bolivia · v2.1.0</p>
                </div>
            </aside>
        </>
    );
}

