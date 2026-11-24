import { useMemo, useState, useEffect } from "react";
import { X, BarChart3 } from "lucide-react";

const MESES_NOMBRE = {
  "01": "Ene",
  "02": "Feb",
  "03": "Mar",
  "04": "Abr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Ago",
  "09": "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dic",
};

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
    const setAnios = new Set(porMes.map((item) => item.mes.slice(0, 4)));
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
      if (item.mes.startsWith(`${anioSeleccionado}-`)) {
        const mm = item.mes.slice(5, 7);
        mapaMes[mm] = (mapaMes[mm] || 0) + (Number(item.cobrado) || 0);
      }
    }

    return Object.entries(MESES_NOMBRE).map(([mm, nombre]) => ({
      mesClave: `${anioSeleccionado}-${mm}`,
      label: nombre,
      cobrado: mapaMes[mm] || 0,
    }));
  }, [porMes, anioSeleccionado]);

  const totalAnual = useMemo(
    () => datosDelAnio.reduce((acc, m) => acc + m.cobrado, 0),
    [datosDelAnio],
  );

  const maxValor = useMemo(
    () => Math.max(...datosDelAnio.map((m) => m.cobrado), 1),
    [datosDelAnio],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold">Acumulado por Mes</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtro por año + Total anual */}
        <div className="mt-4 flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
          <div>
            <label
              htmlFor="filtro-anio"
              className="block text-[11px] text-slate-400"
            >
              Filtrar por año
            </label>
            <select
              id="filtro-anio"
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(e.target.value)}
              className="mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-white outline-none focus:border-sky-500"
            >
              {aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </div>

          <div className="text-right">
            <span className="block text-[11px] text-slate-400">
              Total año {anioSeleccionado}
            </span>
            <span className="text-base font-bold text-emerald-400">
              {formatPesos(totalAnual)}
            </span>
          </div>
        </div>

        {/* Gráfico de barras mensual */}
        <div className="mt-5 bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="h-48 flex items-end justify-between gap-1.5 pt-4">
            {datosDelAnio.map((item) => {
              const heightPct =
                item.cobrado > 0
                  ? Math.max((item.cobrado / maxValor) * 100, 8)
                  : 0;
              return (
                <div
                  key={item.mesClave}
                  className="flex-1 h-full flex flex-col items-center justify-end group"
                  title={`${item.label} ${anioSeleccionado}: ${formatPesos(item.cobrado)}`}
                >
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[22px] rounded-t-md transition-all ${
                        item.cobrado > 0
                          ? "bg-sky-500 group-hover:bg-sky-400"
                          : "bg-slate-800/40"
                      }`}
                    />
                  </div>
                  <span className="mt-2 text-[10px] text-slate-400 font-medium">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalle mensual rápido */}
        <div className="mt-4 space-y-1.5">
          {datosDelAnio
            .filter((m) => m.cobrado > 0)
            .map((m) => (
              <div
                key={m.mesClave}
                className="flex items-center justify-between text-xs bg-slate-950/70 border border-slate-800/80 rounded-lg px-3 py-2"
              >
                <span className="text-slate-300 font-medium">
                  {m.label} {anioSeleccionado}
                </span>
                <span className="text-slate-100 font-semibold">
                  {formatPesos(m.cobrado)}
                </span>
              </div>
            ))}

          {datosDelAnio.every((m) => m.cobrado === 0) && (
            <p className="text-xs text-slate-400 text-center py-2">
              Sin cobros registrados en {anioSeleccionado}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
