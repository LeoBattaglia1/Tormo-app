import { useEffect, useMemo, useState } from "react";
import {
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  CheckCircle2,
  X,
} from "lucide-react";
import { api } from "../services/api";
import ModuloHeader from "../components/ModuloHeader";
import ConfirmModal from "../components/ConfirmModal";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES_LARGO = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function getHoyISO() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildFechaISO(anio, mesIdx, dia) {
  const m = String(mesIdx + 1).padStart(2, "0");
  const d = String(dia).padStart(2, "0");
  return `${anio}-${m}-${d}`;
}

function formatFechaCorta(fechaISO) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export default function TurnosPage({ onSalir }) {
  const hoyISO = getHoyISO();
  const [anioInicial, mesInicial] = hoyISO.split("-").map(Number);

  const [cliente, setCliente] = useState("");
  const [direccion, setDireccion] = useState("");
  const [anioVista, setAnioVista] = useState(anioInicial);
  const [mesVista, setMesVista] = useState(mesInicial - 1); // 0..11
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoyISO);

  const [turnos, setTurnos] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Confirmación para crear turno
  const [confirmCrearOpen, setConfirmCrearOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Modal de "Ver Turnos agendados"
  const [listaModalOpen, setListaModalOpen] = useState(false);

  // Confirmación para borrar turno manualmente
  const [turnoAEliminar, setTurnoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  async function sincronizarYLimpiarVencidos(listaCruda) {
    const hoy = getHoyISO();
    const validos = (Array.isArray(listaCruda) ? listaCruda : [])
      .filter((t) => t && t.fecha && t.fecha >= hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const vencidos = (Array.isArray(listaCruda) ? listaCruda : []).filter(
      (t) => t && t.fecha && t.fecha < hoy,
    );

    if (vencidos.length > 0) {
      await Promise.allSettled(vencidos.map((v) => api.deleteTurno(v.id)));
    }

    return validos;
  }

  async function cargarTurnos() {
    setLoadingTurnos(true);
    try {
      const data = await api.getTurnos();
      const vigentes = await sincronizarYLimpiarVencidos(data);
      setTurnos(vigentes);
    } catch (err) {
      setFeedback({
        tipo: "err",
        texto: err.message || "Error al cargar turnos.",
      });
    } finally {
      setLoadingTurnos(false);
    }
  }

  useEffect(() => {
    cargarTurnos();
  }, []);

  // Celdas del almanaque (empezando en Lunes)
  const celdasCalendario = useMemo(() => {
    const primerDiaMes = new Date(anioVista, mesVista, 1);
    const totalDiasMes = new Date(anioVista, mesVista + 1, 0).getDate();
    const offsetLunes = (primerDiaMes.getDay() + 6) % 7; // 0 = Lun ... 6 = Dom

    const celdas = [];
    for (let i = 0; i < offsetLunes; i++) {
      celdas.push({ vacio: true, key: `empty-${i}` });
    }
    for (let dia = 1; dia <= totalDiasMes; dia++) {
      const iso = buildFechaISO(anioVista, mesVista, dia);
      celdas.push({
        vacio: false,
        dia,
        iso,
        key: iso,
      });
    }
    return celdas;
  }, [anioVista, mesVista]);

  const fechasConTurno = useMemo(() => {
    return new Set(turnos.map((t) => t.fecha));
  }, [turnos]);

  function mesAnterior() {
    if (mesVista === 0) {
      setMesVista(11);
      setAnioVista((a) => a - 1);
    } else {
      setMesVista((m) => m - 1);
    }
  }

  function mesSiguiente() {
    if (mesVista === 11) {
      setMesVista(0);
      setAnioVista((a) => a + 1);
    } else {
      setMesVista((m) => m + 1);
    }
  }

  function handleSolicitarGuardarTurno(e) {
    e.preventDefault();
    setFeedback(null);

    if (!cliente.trim()) {
      setFeedback({ tipo: "err", texto: "Completá el cliente." });
      return;
    }
    if (!fechaSeleccionada) {
      setFeedback({ tipo: "err", texto: "Seleccioná un día en el almanaque." });
      return;
    }
    if (fechaSeleccionada < getHoyISO()) {
      setFeedback({ tipo: "err", texto: "Elegí hoy o una fecha futura." });
      return;
    }

    setConfirmCrearOpen(true);
  }

  async function handleConfirmarGuardarTurno() {
    setGuardando(true);
    try {
      await api.createTurno({
        cliente: cliente.trim(),
        fecha: fechaSeleccionada,
        direccion: direccion.trim(),
      });

      setConfirmCrearOpen(false);
      setCliente("");
      setDireccion("");
      setFeedback({ tipo: "ok", texto: "Guardado con exito" });
      await cargarTurnos();
    } catch (err) {
      setConfirmCrearOpen(false);
      setFeedback({
        tipo: "err",
        texto: err.message || "Error al guardar el turno.",
      });
    } finally {
      setGuardando(false);
    }
  }

  async function handleConfirmarEliminarTurno() {
    if (!turnoAEliminar) return;
    setEliminando(true);
    try {
      await api.deleteTurno(turnoAEliminar.id);
      setTurnoAEliminar(null);
      setFeedback({ tipo: "ok", texto: "Guardado con exito" });
      await cargarTurnos();
    } catch (err) {
      setTurnoAEliminar(null);
      setFeedback({
        tipo: "err",
        texto: err.message || "Error al eliminar el turno.",
      });
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="space-y-3">
      <ModuloHeader
        titulo="Turnos"
        onSalir={onSalir}
        colorTitulo="text-violet-400"
      />

      {feedback && (
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-xs font-semibold border flex items-center gap-2 ${
            feedback.tipo === "ok"
              ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-200"
              : "bg-rose-950/60 border-rose-700/60 text-rose-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.texto}</span>
        </div>
      )}

      <form onSubmit={handleSolicitarGuardarTurno} className="space-y-3">
        {/* Cliente */}
        <div className="bg-slate-900 border border-slate-800 focus-within:border-violet-500 transition rounded-2xl p-3">
          <label
            htmlFor="turno-cliente"
            className="block text-xs font-semibold text-slate-300 mb-1"
          >
            Cliente
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-violet-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="turno-cliente"
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none"
            />
          </div>
        </div>

        {/* Dirección (no obligatoria) */}
        <div className="bg-slate-900 border border-slate-800 focus-within:border-sky-500 transition rounded-2xl p-3">
          <label
            htmlFor="turno-direccion"
            className="block text-xs font-semibold text-slate-300 mb-1"
          >
            Dirección
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="turno-direccion"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none"
            />
          </div>
        </div>

        {/* Almanaque para tildar el día */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={mesAnterior}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 cursor-pointer"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-extrabold text-white">
              {MESES_LARGO[mesVista]} {anioVista}
            </span>

            <button
              type="button"
              onClick={mesSiguiente}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 cursor-pointer"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA.map((d) => (
              <span
                key={d}
                className="text-[11px] font-bold text-slate-400 py-1"
              >
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {celdasCalendario.map((celda) => {
              if (celda.vacio) {
                return <div key={celda.key} className="h-10 rounded-xl" />;
              }

              const seleccionada = celda.iso === fechaSeleccionada;
              const esHoy = celda.iso === hoyISO;
              const tieneTurno = fechasConTurno.has(celda.iso);
              const esPasado = celda.iso < hoyISO;

              return (
                <button
                  key={celda.key}
                  type="button"
                  disabled={esPasado}
                  onClick={() => setFechaSeleccionada(celda.iso)}
                  className={`relative h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition border ${
                    esPasado
                      ? "bg-slate-950/40 border-transparent text-slate-600 cursor-not-allowed"
                      : seleccionada
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 border-violet-300 text-white shadow-md shadow-violet-500/25 cursor-pointer"
                        : esHoy
                          ? "bg-slate-800 border-violet-400/60 text-violet-200 hover:bg-slate-700 cursor-pointer"
                          : "bg-slate-950 border-slate-800/90 text-slate-200 hover:border-slate-600 cursor-pointer"
                  }`}
                >
                  <span>{celda.dia}</span>
                  {tieneTurno && !esPasado && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        seleccionada ? "bg-white" : "bg-emerald-400"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Botón Guardar Turno */}
        <button
          type="submit"
          className="mt-1 w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:brightness-110 active:scale-[0.98] transition text-white font-extrabold text-sm shadow-lg shadow-violet-500/20 cursor-pointer"
        >
          Guardar Turno
        </button>

        {/* Línea divisoria entre ambos botones */}
        <div className="my-3 border-t border-slate-800" />

        {/* Botón Ver Turnos agendados */}
        <button
          type="button"
          onClick={() => {
            cargarTurnos();
            setListaModalOpen(true);
          }}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] border border-slate-700/80 transition text-slate-100 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <CalendarCheck className="w-4 h-4 text-violet-400" />
          <span>Ver Turnos agendados ({turnos.length})</span>
        </button>
      </form>

      {/* Modal de confirmación antes de guardar el turno */}
      <ConfirmModal
        open={confirmCrearOpen}
        title="¿Confirmar turno?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        loading={guardando}
        onCancel={() => !guardando && setConfirmCrearOpen(false)}
        onConfirm={handleConfirmarGuardarTurno}
        details={[
          {
            label: "Fecha",
            value: formatFechaCorta(fechaSeleccionada),
            className: "text-violet-300",
          },
          { label: "Cliente", value: cliente.trim() },
          { label: "Dirección", value: direccion.trim() || "—" },
        ]}
      />

      {/* Modal de Turnos agendados (ordenados por fecha + botón X para borrar) */}
      {listaModalOpen && !turnoAEliminar && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-5 text-white shadow-2xl max-h-[82vh] flex flex-col">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h2 className="text-base font-extrabold text-violet-300">
                Turnos agendados
              </h2>
              <button
                type="button"
                onClick={() => setListaModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2 overflow-y-auto pr-0.5 flex-1">
              {loadingTurnos ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Cargando...
                </p>
              ) : turnos.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Sin turnos agendados.
                </p>
              ) : (
                turnos.map((t) => (
                  <div
                    key={t.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-violet-300">
                        {formatFechaCorta(t.fecha)}
                      </p>
                      <p className="text-sm font-bold text-white truncate">
                        {t.cliente}
                      </p>
                      {t.direccion && (
                        <p className="text-xs text-slate-400 truncate">
                          {t.direccion}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setTurnoAEliminar(t)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition shrink-0 cursor-pointer"
                      aria-label={`Borrar turno de ${t.cliente}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para borrar un turno manualmente */}
      <ConfirmModal
        open={Boolean(turnoAEliminar)}
        title="¿Eliminar turno?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={eliminando}
        onCancel={() => !eliminando && setTurnoAEliminar(null)}
        onConfirm={handleConfirmarEliminarTurno}
        details={
          turnoAEliminar
            ? [
                {
                  label: "Fecha",
                  value: formatFechaCorta(turnoAEliminar.fecha),
                  className: "text-violet-300",
                },
                { label: "Cliente", value: turnoAEliminar.cliente },
                ...(turnoAEliminar.direccion
                  ? [{ label: "Dirección", value: turnoAEliminar.direccion }]
                  : []),
              ]
            : []
        }
      />
    </div>
  );
}
