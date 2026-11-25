import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CargaTrabajoPage from "./pages/CargaTrabajoPage";
import PendientesPage from "./pages/PendientesPage";
import TurnosPage from "./pages/TurnosPage";
import PresupuestoPage from "./pages/PresupuestoPage";
import BottomNav from "./components/BottomNav";
import ModuloHeader from "./components/ModuloHeader";

function ModuloPlaceholder({ titulo, colorTitulo, onSalir }) {
  return (
    <div className="w-full">
      <ModuloHeader
        titulo={titulo}
        onSalir={onSalir}
        colorTitulo={colorTitulo}
      />
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
        <span className="text-xs font-semibold text-slate-400">
          Listo para implementar
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [autenticado, setAutenticado] = useState(false);
  const [tab, setTab] = useState("home");

  if (!autenticado) {
    return <LoginPage onSuccess={() => setAutenticado(true)} />;
  }

  const volverInicio = () => setTab("home");

  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      <main className="max-w-md mx-auto min-h-dvh px-4 pt-16 pb-20 flex flex-col justify-center">
        <div className="w-full">
          {tab === "home" && (
            <HomePage
              onCerrarSesion={() => {
                setTab("home");
                setAutenticado(false);
              }}
            />
          )}
          {tab === "presupuesto" && <PresupuestoPage onSalir={volverInicio} />}
          {tab === "turnos" && <TurnosPage onSalir={volverInicio} />}
          {tab === "carga" && <CargaTrabajoPage onSalir={volverInicio} />}
          {tab === "pendientes" && <PendientesPage onSalir={volverInicio} />}
        </div>
      </main>

      <BottomNav activeTab={tab} onSelect={(id) => setTab(id)} />
    </div>
  );
}
