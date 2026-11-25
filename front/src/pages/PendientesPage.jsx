import { useEffect, useState } from "react";
import { Calendar, Wallet, CheckCircle2, X } from "lucide-react";
import { api } from "../services/api";
import ModuloHeader from "../components/ModuloHeader";
import ConfirmModal from "../components/ConfirmModal";

function formatFechaCorta(fechaISO) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function parsearMiles(valorFormateado) {
  const soloDigitos = String(valorFormateado || "").replace(/\D/g, "");
  return soloDigitos ? Number(soloDigitos) : 0;
}

function formatearConPuntos(num) {
  const limpio = parsearMiles(num);
  if (!limpio) return "";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    limpio,
  );
}

function formatARS(num) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(num) || 0);
}

export default function PendientesPage({ onSalir }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);

  const [cobroModalItem, setCobroModalItem] = useState(null);
  const [montoTexto, setMontoTexto] = useState("");
  const [errorMonto, setErrorMonto] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function cargarPendientes() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getPendientes();
      const lista = Array.isArray(data) ? data : [];
      const conSaldo = lista
        .map((p) => {
          const total = Number(p.precioTrabajo) || 0;
          const pagado = Number(p.pagoRealizado) || 0;
          const saldo =
            p.saldoPendiente !== undefined
              ? Number(p.saldoPendiente)
              : total - pagado;
          return { ...p, saldoPendiente: saldo };
        })
        .filter((p) => p.saldoPendiente > 0);

      setItems(conSaldo);
    } catch (err) {
      setError(err.message || "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarPendientes();
  }, []);

  function abrirModalCobro(item) {
    setFeedback(null);
    setErrorMonto("");
    setCobroModalItem(item);
    setMontoTexto(formatearConPuntos(item.saldoPendiente));
  }

  function cerrarModalCobro() {
    if (submitting) return;
    setCobroModalItem(null);
    setMontoTexto("");
    setErrorMonto("");
  }

  function handleSolicitarConfirmacion(e) {
    e.preventDefault();
    if (!cobroModalItem) return;

    const montoNum = parsearMiles(montoTexto);
    if (montoNum <= 0) {
      setErrorMonto("Ingresá un monto mayor a 0.");
      return;
    }
    if (montoNum > cobroModalItem.saldoPendiente) {
      setErrorMonto("Supera el saldo pendiente.");
      return;
    }

    setErrorMonto("");
    setConfirmOpen(true);
  }

  async function handleConfirmarCobro() {
    if (!cobroModalItem) return;
    const montoNum = parsearMiles(montoTexto);
    const fechaHoy = new Date().toISOString().slice(0, 10);

    setSubmitting(true);
    try {
      await api.registrarPago(cobroModalItem.id, {
        montoPago: montoNum,
        fechaPago: fechaHoy,
      });

      setConfirmOpen(false);
      setCobroModalItem(null);
      setMontoTexto("");
      setFeedback({ tipo: "ok", texto: "Guardado con exito" });
      await cargarPendientes();
    } catch (err) {
      setConfirmOpen(false);
      setErrorMonto(err.message || "Error al registrar el cobro.");
    } finally {
      setSubmitting(false);
    }
  }

  const montoAProcesar = parsearMiles(montoTexto);
  const saldoRestanteEstimado = cobroModalItem
    ? Math.max(cobroModalItem.saldoPendiente - montoAProcesar, 0)
    : 0;

  return (
    <div className="space-y-3">
      <ModuloHeader
        titulo="Pagos Pendientes"
        onSalir={onSalir}
        colorTitulo="text-emerald-400"
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

      {error && (
        <div className="bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs rounded-2xl p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
          Cargando...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-1">
          <Wallet className="w-6 h-6 text-emerald-400 mx-auto" />
          <p className="text-sm font-bold text-white">Sin pagos pendientes</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-white truncate">
                  {item.cliente}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{formatFechaCorta(item.fecha)}</span>
                </div>
                <p className="text-xs font-bold text-amber-400">
                  Resta: {formatARS(item.saldoPendiente)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => abrirModalCobro(item)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-[0.98] border border-emerald-400/35 text-emerald-300 text-xs font-bold transition shrink-0 cursor-pointer"
              >
                Cobrar
              </button>
            </div>
          ))}
        </div>
      )}

      {cobroModalItem && !confirmOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="min-w-0">
                <h2 className="text-base font-bold truncate">
                  {cobroModalItem.cliente}
                </h2>
                <p className="text-xs text-slate-400">
                  Pendiente total: {formatARS(cobroModalItem.saldoPendiente)}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModalCobro}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSolicitarConfirmacion}
              className="mt-4 space-y-4"
            >
              <div>
                <label
                  htmlFor="monto-cobrar"
                  className="block text-xs font-semibold text-slate-300 mb-1.5"
                >
                  Monto a cobrar
                </label>
                <input
                  id="monto-cobrar"
                  type="text"
                  inputMode="numeric"
                  value={montoTexto}
                  onChange={(e) => {
                    setErrorMonto("");
                    setMontoTexto(formatearConPuntos(e.target.value));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-2xl py-3 px-4 text-lg font-extrabold text-emerald-300 outline-none"
                />
              </div>

              {errorMonto && (
                <p className="text-xs font-semibold text-rose-400">
                  {errorMonto}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={cerrarModalCobro}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-sm font-extrabold text-slate-950 cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen && Boolean(cobroModalItem)}
        title="¿Confirmar cobro?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        loading={submitting}
        onCancel={() => !submitting && setConfirmOpen(false)}
        onConfirm={handleConfirmarCobro}
        details={
          cobroModalItem
            ? [
                { label: "Cliente", value: cobroModalItem.cliente },
                {
                  label: "Fecha",
                  value: formatFechaCorta(cobroModalItem.fecha),
                  className: "text-indigo-300",
                },
                {
                  label: "Monto a cobrar",
                  value: formatARS(montoAProcesar),
                  className: "text-emerald-300",
                },
                {
                  label: "Saldo restante",
                  value: formatARS(saldoRestanteEstimado),
                  className: "text-amber-300",
                },
              ]
            : []
        }
      />
    </div>
  );
}
