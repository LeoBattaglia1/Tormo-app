import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import BottomNav from "./components/BottomNav";

function ModuloEnEspera({ titulo, onVolver }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-3">
      <h2 className="text-base font-bold text-white">{titulo}</h2>
      <p className="text-xs text-slate-400">
        Módulo listo para codear en el próximo paso.
      </p>
      <button
        type="button"
        onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 pt-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver al inicio
      </button>
    </div>
  );
}

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [tab, setTab] = useState("home");

  if (!autenticado) {
    return <LoginPage onSuccess={() => setAutenticado(true)} />;
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-white pb-20">
      <main className="max-w-md mx-auto px-4 pt-4">
        {tab === "home" && (
          <HomePage onNavigate={(destino) => setTab(destino)} />
        )}
        {tab === "presupuesto" && (
          <ModuloEnEspera
            titulo="Presupuesto PDF"
            onVolver={() => setTab("home")}
          />
        )}
        {tab === "turnos" && (
          <ModuloEnEspera
            titulo="Agenda de Turnos"
            onVolver={() => setTab("home")}
          />
        )}
        {tab === "carga" && (
          <ModuloEnEspera
            titulo="Carga de Trabajo"
            onVolver={() => setTab("home")}
          />
        )}
        {tab === "pendientes" && (
          <ModuloEnEspera
            titulo="Pagos Pendientes"
            onVolver={() => setTab("home")}
          />
        )}
      </main>

      <BottomNav activeTab={tab} onSelect={(id) => setTab(id)} />
    </div>
  );
}
