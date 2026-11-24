import { useEffect, useMemo, useState } from "react";
import { Bell, BarChart3, Calendar, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import DatosChartModal from "../components/DatosChartModal";

function getHoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function sumarDiasISO(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function formatFechaCorta(fechaISO) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.split("-");
  return `${d}/${m}/${y}`;
}

export default function HomePage({ onNavigate }) {
  const [turnos, setTurnos] = useState([]);
  const [resumen, setResumen] = useState({ porMes: [], porAnio: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDatos, setOpenDatos] = useState(false);

  async function cargarDatos() {
    setLoading(true);
    setError("");
    try {
      const [turnosData, resumenData] = await Promise.all([
        api.getTurnos(),
        api.getResumen(),
      ]);
      setTurnos(Array.isArray(turnosData) ? turnosData : []);
      setResumen(resumenData || { porMes: [], porAnio: [] });
    } catch (err) {
      setError(err.message || "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const turnosProximos = useMemo(() => {
    const hoy = getHoyISO();
    const limite = sumarDiasISO(7);
    return turnos
      .filter((t) => t.fecha >= hoy && t.fecha <= limite)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [turnos]);

  const hoyISO = getHoyISO();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Panel Principal</h1>
          <p className="text-xs text-slate-400">
            Gestión diaria de refrigeración
          </p>
        </div>

        <button
          type="button"
          onClick={cargarDatos}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Alerta de turnos próximos */}
      <section
        className={`rounded-2xl p-4 border ${
          turnosProximos.length > 0
            ? "bg-amber-950/35 border-amber-700/60"
            : "bg-slate-900 border-slate-800"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                turnosProximos.length > 0
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {turnosProximos.length > 0
                  ? `Alerta: ${turnosProximos.length} ${
                      turnosProximos.length === 1
                        ? "turno próximo"
                        : "turnos próximos"
                    }`
                  : "Sin turnos próximos"}
              </h2>
              <p className="text-xs text-slate-400">
                {turnosProximos.length > 0
                  ? "Programados para hoy o los próximos 7 días"
                  : "No hay visitas agendadas en los próximos 7 días"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("turnos")}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 shrink-0"
          >
            <Calendar className="w-3.5 h-3.5" />
            Ver agenda
          </button>
        </div>

        {turnosProximos.length > 0 && (
          <div className="mt-3 space-y-2">
            {turnosProximos.map((t) => {
              const esHoy = t.fecha === hoyISO;
              return (
                <div
                  key={t.id}
                  className="bg-slate-950/75 border border-slate-800/90 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {t.cliente}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {t.direccion}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      esHoy
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    {esHoy ? "HOY" : formatFechaCorta(t.fecha)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Botón Ver datos */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">
              Estadísticas de Cobros
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gráfico mensual acumulado con filtro por año
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpenDatos(true)}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 active:scale-[0.99] transition text-white text-xs font-semibold px-4 py-2.5 rounded-xl shrink-0"
          >
            <BarChart3 className="w-4 h-4" />
            Ver datos
          </button>
        </div>
      </section>

      <DatosChartModal
        open={openDatos}
        onClose={() => setOpenDatos(false)}
        resumen={resumen}
      />
    </div>
  );
}
