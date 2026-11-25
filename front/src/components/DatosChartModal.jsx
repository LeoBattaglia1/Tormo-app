import { useEffect, useMemo, useState } from "react";
import { X, BarChart3 } from "lucide-react";

const MESES_ENE_DIC = [
  { mm: "01", label: "Ene" },
  { mm: "02", label: "Feb" },
  { mm: "03", label: "Mar" },
  { mm: "04", label: "Abr" },
  { mm: "05", label: "May" },
  { mm: "06", label: "Jun" },
  { mm: "07", label: "Jul" },
  { mm: "08", label: "Ago" },
  { mm: "09", label: "Sep" },
  { mm: "10", label: "Oct" },
  { mm: "11", label: "Nov" },
  { mm: "12", label: "Dic" },
];

function formatNumeroCorto(valor) {
  const num = Number(valor) || 0;
  if (num === 0) return "0";
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }
  if (num >= 1_000) {
    return `${Math.round(num / 1_000)}k`;
  }
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    num,
  );
}

function formatPesos(valor) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);
}

export default function DatosChartModal({ open, onClose, resumen }) {
  const porMes = resumen?.porMes || [];

  const aniosDisponibles = useMemo(() => {
    const setAnios = new Set(
      porMes.map((item) => String(item.mes || "").slice(0, 4)).filter(Boolean),
    );
    const anioActual = String(new Date().getFullYear());
    if (setAnios.size === 0) setAnios.add(anioActual);
    return Array.from(setAnios).sort((a, b) => b.localeCompare(a));
  }, [porMes]);

  const [anioSeleccionado, setAnioSeleccionado] = useState("");

  useEffect(() => {
    if (
      aniosDisponibles.length > 0 &&
      !aniosDisponibles.includes(anioSeleccionado)
    ) {
      setAnioSeleccionado(aniosDisponibles[0]);
    }
  }, [aniosDisponibles, anioSeleccionado]);

  const datosDelAnio = useMemo(() => {
    const mapaMes = {};
    for (const item of porMes) {
      if (String(item.mes || "").startsWith(`${anioSeleccionado}-`)) {
        const mm = String(item.mes).slice(5, 7);
        mapaMes[mm] = (mapaMes[mm] || 0) + (Number(item.cobrado) || 0);
      }
    }

    return MESES_ENE_DIC.map(({ mm, label }) => ({
      mesClave: `${anioSeleccionado}-${mm}`,
      label,
      cobrado: mapaMes[mm] || 0,
    }));
  }, [porMes, anioSeleccionado]);

  const maxValor = useMemo(
    () => Math.max(...datosDelAnio.map((m) => m.cobrado), 1),
    [datosDelAnio],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-extrabold">Enero a Diciembre</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filtro por año */}
        <div className="mt-3 flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5">
          <label
            htmlFor="filtro-anio"
            className="text-xs font-semibold text-slate-300"
          >
            Año
          </label>
          <select
            id="filtro-anio"
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-white outline-none focus:border-sky-500 cursor-pointer"
          >
            {aniosDisponibles.map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>
        </div>

        {/* Gráfico de 12 columnas (Ene a Dic) con número arriba de cada barra */}
        <div className="mt-4 bg-slate-950 border border-slate-800 rounded-2xl p-3 overflow-x-auto">
          <div className="min-w-[460px] h-52 flex items-end justify-between gap-1.5 pt-6">
            {datosDelAnio.map((item) => {
              const heightPct =
                item.cobrado > 0
                  ? Math.max((item.cobrado / maxValor) * 100, 10)
                  : 0;
              return (
                <div
                  key={item.mesClave}
                  className="flex-1 h-full flex flex-col items-center justify-end"
                  title={`${item.label} ${anioSeleccionado}: ${formatPesos(item.cobrado)}`}
                >
                  <span className="text-[10px] font-bold text-sky-300 mb-1 leading-none">
                    {formatNumeroCorto(item.cobrado)}
                  </span>
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[20px] rounded-t-md transition-all ${
                        item.cobrado > 0 ? "bg-sky-500" : "bg-slate-800/50"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
