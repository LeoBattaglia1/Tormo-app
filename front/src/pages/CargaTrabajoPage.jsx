import { useMemo, useState } from "react";
import { User, DollarSign, Calendar, CheckCircle2, Clock } from "lucide-react";
import { api } from "../services/api";
import ConfirmModal from "../components/ConfirmModal";
import ModuloHeader from "../components/ModuloHeader";

function getHoyISO() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatFechaCorta(fechaISO) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.split("-");
  return `${d}/${m}/${y}`;
}

function parsearMiles(valorFormateado) {
  const soloDigitos = String(valorFormateado || "").replace(/\D/g, "");
  return soloDigitos ? Number(soloDigitos) : 0;
}

function formatearConPuntos(valorInput) {
  const num = parsearMiles(valorInput);
  if (!valorInput || String(valorInput).replace(/\D/g, "") === "") return "";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    num,
  );
}

function formatARS(num) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(num) || 0);
}

export default function CargaTrabajoPage({ onSalir }) {
  const [fecha, setFecha] = useState(() => getHoyISO());
  const [cliente, setCliente] = useState("");
  const [costoTexto, setCostoTexto] = useState("");
  const [pagoTexto, setPagoTexto] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const costoNum = parsearMiles(costoTexto);
  const pagoNum = parsearMiles(pagoTexto);

  const estadoCalculo = useMemo(() => {
    if (costoNum <= 0) {
      return { valido: false, errorMsg: "", saldo: 0, esSaldado: false };
    }
    if (pagoNum > costoNum) {
      return {
        valido: false,
        errorMsg: "El pago supera el costo del trabajo.",
        saldo: 0,
        esSaldado: false,
      };
    }
    const saldo = costoNum - pagoNum;
    return {
      valido: true,
      errorMsg: "",
      saldo,
      esSaldado: saldo === 0,
    };
  }, [costoNum, pagoNum]);

  function handleAbrirConfirmacion(e) {
    e.preventDefault();
    setFeedback(null);

    if (!fecha) {
      setFeedback({ tipo: "err", texto: "Completá la fecha." });
      return;
    }
    if (!cliente.trim()) {
      setFeedback({ tipo: "err", texto: "Completá el cliente." });
      return;
    }
    if (!estadoCalculo.valido) {
      setFeedback({
        tipo: "err",
        texto: estadoCalculo.errorMsg || "Ingresá el costo del trabajo.",
      });
      return;
    }

    setModalOpen(true);
  }

  async function handleConfirmarPost() {
    setSubmitting(true);
    setFeedback(null);
    try {
      const respuesta = await api.createTrabajo({
        cliente: cliente.trim(),
        fecha,
        precioTrabajo: costoNum,
        pagoRealizado: pagoNum,
      });

      setModalOpen(false);
      setFecha(getHoyISO());
      setCliente("");
      setCostoTexto("");
      setPagoTexto("");

      setFeedback({
        tipo: "ok",
        texto: "Guardado con exito",
      });
    } catch (err) {
      setModalOpen(false);
      setFeedback({
        tipo: "err",
        texto: err.message || "Error al guardar.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <ModuloHeader
        titulo="Cargar Trabajo"
        onSalir={onSalir}
        colorTitulo="text-cyan-400"
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

      <form onSubmit={handleAbrirConfirmacion} className="space-y-4">
        {/* 1. Fecha primero */}
        <div className="bg-slate-900 border border-slate-800 focus-within:border-indigo-500 transition rounded-2xl p-3">
          <label
            htmlFor="fecha"
            className="block text-xs font-semibold text-slate-300 mb-1"
          >
            Fecha
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-sm font-semibold text-white outline-none [color-scheme:dark]"
            />
          </div>
        </div>

        {/* 2. Cliente segundo */}
        <div className="bg-slate-900 border border-slate-800 focus-within:border-sky-500 transition rounded-2xl p-3">
          <label
            htmlFor="cliente"
            className="block text-xs font-semibold text-slate-300 mb-1"
          >
            Cliente
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="cliente"
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder=""
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white outline-none"
            />
          </div>
        </div>

        {/* 3. Costo del trabajo */}
        <div className="bg-slate-900 border border-slate-800 focus-within:border-emerald-500 transition rounded-2xl p-3">
          <label
            htmlFor="costo"
            className="block text-xs font-semibold text-slate-300 mb-1"
          >
            Costo del trabajo
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="costo"
              type="text"
              inputMode="numeric"
              value={costoTexto}
              onChange={(e) =>
                setCostoTexto(formatearConPuntos(e.target.value))
              }
              placeholder=""
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-3 text-base font-bold text-white outline-none"
            />
          </div>
        </div>

        {/* 4. Pago realizado por el cliente */}
        <div className="bg-slate-900 border border-slate-800 focus-within:border-amber-500 transition rounded-2xl p-3">
          <label
            htmlFor="pago"
            className="block text-xs font-semibold text-slate-300 mb-1"
          >
            Pago realizado por el cliente
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="pago"
              type="text"
              inputMode="numeric"
              value={pagoTexto}
              onChange={(e) => setPagoTexto(formatearConPuntos(e.target.value))}
              placeholder=""
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 pl-9 pr-3 text-base font-bold text-white outline-none"
            />
          </div>
        </div>

        {costoNum > 0 && estadoCalculo.valido && (
          <div
            className={`rounded-2xl px-3.5 py-2.5 border flex items-center gap-2 text-xs font-semibold ${
              estadoCalculo.esSaldado
                ? "bg-emerald-950/40 border-emerald-700/50 text-emerald-300"
                : "bg-amber-950/35 border-amber-700/50 text-amber-300"
            }`}
          >
            {estadoCalculo.esSaldado ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>
              {estadoCalculo.esSaldado
                ? "Saldado"
                : `Pendiente: ${formatARS(estadoCalculo.saldo)}`}
            </span>
          </div>
        )}

        <button
          type="submit"
          className="mt-2 w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:brightness-110 active:scale-[0.98] transition text-slate-950 font-extrabold text-base shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          Guardar Trabajo
        </button>
      </form>

      <ConfirmModal
        open={modalOpen}
        title="¿Confirmar carga?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        loading={submitting}
        onCancel={() => !submitting && setModalOpen(false)}
        onConfirm={handleConfirmarPost}
        details={[
          {
            label: "Fecha",
            value: formatFechaCorta(fecha),
            className: "text-indigo-300",
          },
          { label: "Cliente", value: cliente.trim() },
          {
            label: "Costo",
            value: formatARS(costoNum),
            className: "text-emerald-300",
          },
          {
            label: "Pago",
            value: formatARS(pagoNum),
            className: "text-amber-300",
          },
          {
            label: "Estado",
            value: estadoCalculo.esSaldado
              ? "Saldado"
              : `Pendiente: ${formatARS(estadoCalculo.saldo)}`,
            className: estadoCalculo.esSaldado
              ? "text-emerald-400"
              : "text-amber-400",
          },
        ]}
      />
    </div>
  );
}
