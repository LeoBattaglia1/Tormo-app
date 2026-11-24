import { FileText, Calendar, PlusCircle, Wallet } from "lucide-react";

const ITEMS = [
  { id: "presupuesto", label: "Presupuesto", icon: FileText },
  { id: "turnos", label: "Turnos", icon: Calendar },
  { id: "carga", label: "Carga", icon: PlusCircle },
  { id: "pendientes", label: "Pendientes", icon: Wallet },
];

export default function BottomNav({ activeTab, onSelect }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-30">
      <div className="max-w-md mx-auto grid grid-cols-4">
        {ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={`flex flex-col items-center justify-center py-2.5 px-1 gap-1 text-[11px] font-medium transition ${
                active ? "text-sky-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
