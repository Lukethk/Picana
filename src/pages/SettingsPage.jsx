
import { Settings,  } from 'lucide-react';


export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-slate-900 font-bold text-xl">Configuración</h2>
                    <p className="text-slate-400 text-sm">Preferencias generales del sistema</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Settings size={32} className="text-slate-400" />
                </div>
                <h3 className="text-slate-900 font-bold text-lg mb-2">Próximamente</h3>
                <p className="text-slate-500 max-w-md">
                    Aquí podrás configurar los datos de la empresa, impresoras, y usuarios del sistema.
                </p>
            </div>
        </div>
    );
}
