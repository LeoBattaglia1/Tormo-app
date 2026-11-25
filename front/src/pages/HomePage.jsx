import { useEffect, useMemo, useState } from "react";
import { Bell, BarChart3, ChevronUp } from "lucide-react";
import { api } from "../services/api";
import ModuloHeader from "../components/ModuloHeader";

const PRIMEROS_6_MESES = [
  { mm: "01", label: "Ene" },
  { mm: "02", label: "Feb" },
  { mm: "03", label: "Mar" },
  { mm: "04", label: "Abr" },
  { mm: "05", label: "May" },
  { mm: "06", label: "Jun" },
];

const ULTIMOS_6_MESES = [
  { mm: "07", label: "Jul" },
  { mm: "08", label: "Ago" },
  { mm: "09", label: "Sep" },
  { mm: "10", label: "Oct" },
  { mm: "11", label: "Nov" },
  { mm: "12", label: "Dic" },
];

function getHoyISO() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function sumarDiasISO(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

function formatFechaCorta(fechaISO) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

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

function normalizarPorMes(resumenData) {
  const lista = Array.isArray(resumenData?.porMes) ? resumenData.porMes : [];
  return lista
    .map((item) => {
      const clave = String(
        item?.mes || item?.periodo || item?.fecha || "",
      ).slice(0, 7);
      const monto =
        Number(item?.cobrado ?? item?.total ?? item?.monto ?? 0) || 0;
      return { mes: clave, cobrado: monto };
    })
    .filter((item) => /^\d{4}-\d{2}$/.test(item.mes));
}

function FilaBarrasMeses({ meses, anioSeleccionado, maxValor }) {
  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5">
      <div className="h-36 flex items-end justify-between gap-1 pt-5">
        {meses.map((item) => {
          const heightPct =
            item.cobrado > 0
              ? Math.max((item.cobrado / maxValor) * 100, 12)
              : 0;
          return (
            <div
              key={item.mesClave}
              className="flex-1 h-full flex flex-col items-center justify-end min-w-0"
              title={`${item.label} ${anioSeleccionado}: ${formatPesos(item.cobrado)}`}
            >
              <span className="text-[10px] font-bold text-sky-300 mb-1 leading-none truncate max-w-full">
                {formatNumeroCorto(item.cobrado)}
              </span>
              <div className="w-full flex-1 flex items-end justify-center">
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[22px] rounded-t-md transition-all ${
                    item.cobrado > 0 ? "bg-sky-500" : "bg-slate-800/50"
                  }`}
                />
              </div>
              <span className="mt-1 text-[10px] font-semibold text-slate-400 leading-none">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage({ onCerrarSesion }) {
  const [turnos, setTurnos] = useState([]);
  const [porMes, setPorMes] = useState([]);
  const [error, setError] = useState("");
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [anioSeleccionado, setAnioSeleccionado] = useState("");

  async function cargarDatos() {
    setError("");
    try {
      const [turnosData, resumenData] = await Promise.all([
        api.getTurnos(),
        api.getResumen(),
      ]);
      setTurnos(Array.isArray(turnosData) ? turnosData : []);
      setPorMes(normalizarPorMes(resumenData));
    } catch (err) {
      setError(err.message || "Error al cargar");
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const hoyISO = getHoyISO();

  const turnosA2Dias = useMemo(() => {
    const limite2Dias = sumarDiasISO(2);
    return turnos
      .filter(
        (t) => t && t.fecha && t.fecha >= hoyISO && t.fecha <= limite2Dias,
      )
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [turnos, hoyISO]);

  const aniosDisponibles = useMemo(() => {
    const setAnios = new Set(porMes.map((item) => item.mes.slice(0, 4)));
    const anioActual = String(new Date().getFullYear());
    if (setAnios.size === 0) setAnios.add(anioActual);
    return Array.from(setAnios).sort((a, b) => b.localeCompare(a));
  }, [porMes]);

  useEffect(() => {
    if (
      aniosDisponibles.length > 0 &&
      !aniosDisponibles.includes(anioSeleccionado)
    ) {
      setAnioSeleccionado(aniosDisponibles[0]);
    }
  }, [aniosDisponibles, anioSeleccionado]);

  const { primerosSeis, ultimosSeis, maxValor } = useMemo(() => {
    const mapaMes = {};
    for (const item of porMes) {
      if (item.mes.startsWith(`${anioSeleccionado}-`)) {
        const mm = item.mes.slice(5, 7);
        mapaMes[mm] = (mapaMes[mm] || 0) + item.cobrado;
      }
    }

    const p6 = PRIMEROS_6_MESES.map(({ mm, label }) => ({
      mesClave: `${anioSeleccionado}-${mm}`,
      label,
      cobrado: mapaMes[mm] || 0,
    }));

    const u6 = ULTIMOS_6_MESES.map(({ mm, label }) => ({
      mesClave: `${anioSeleccionado}-${mm}`,
      label,
      cobrado: mapaMes[mm] || 0,
    }));

    const max = Math.max(
      ...p6.map((m) => m.cobrado),
      ...u6.map((m) => m.cobrado),
      1,
    );

    return { primerosSeis: p6, ultimosSeis: u6, maxValor: max };
  }, [porMes, anioSeleccionado]);

  return (
    <div className="min-h-[calc(100dvh-9rem)] pt-6 flex flex-col">
      <ModuloHeader
        titulo="Panel Principal"
        textoBoton="Cerrar sesión"
        onClickBoton={onCerrarSesion}
        colorTitulo="text-sky-400"
      />

      <div className="mt-6 space-y-4">
        {error && (
          <div className="bg-rose-950/75 border border-rose-800/80 text-rose-200 text-xs font-semibold rounded-2xl p-3">
            {error}
          </div>
        )}

        {/* Alerta solo si hay turno a 2 días o menos */}
        {turnosA2Dias.length > 0 && (
          <section className="bg-amber-950/60 border border-amber-600/60 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm">
              <Bell className="w-4 h-4 shrink-0" />
              <span>Alerta de turnos</span>
            </div>

            <div className="space-y-2">
              {turnosA2Dias.map((t) => {
                const esHoy = t.fecha === hoyISO;
                return (
                  <div
                    key={t.id}
                    className="bg-slate-950/85 border border-slate-800/90 rounded-xl px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {t.cliente}
                      </p>
                      {t.direccion && (
                        <p className="text-xs text-slate-400 truncate">
                          {t.direccion}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                        esHoy
                          ? "bg-amber-400 text-slate-950"
                          : "bg-slate-800 text-slate-200"
                      }`}
                    >
                      {esHoy ? "HOY" : formatFechaCorta(t.fecha)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Botón Ver detalles */}
        <button
          type="button"
          onClick={() => setMostrarDetalles((prev) => !prev)}
          className="w-full py-3.5 px-5 rounded-2xl bg-sky-600/90 hover:bg-sky-500 active:scale-[0.98] transition text-white font-extrabold text-sm shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          {mostrarDetalles ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Ocultar detalles</span>
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              <span>Ver detalles</span>
            </>
          )}
        </button>

        {/* Tabla desplegable debajo en dos bloques de 6 meses */}
        {mostrarDetalles && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-sky-300 leading-snug">
                Resumen de total de cobros por meses
              </span>
              <select
                aria-label="Filtrar por año"
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-white outline-none focus:border-sky-500 shrink-0 cursor-pointer"
              >
                {aniosDisponibles.map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
              </select>
            </div>

            <FilaBarrasMeses
              meses={primerosSeis}
              anioSeleccionado={anioSeleccionado}
              maxValor={maxValor}
            />

            <FilaBarrasMeses
              meses={ultimosSeis}
              anioSeleccionado={anioSeleccionado}
              maxValor={maxValor}
            />
          </section>
        )}
      </div>
    </div>
  );
}
