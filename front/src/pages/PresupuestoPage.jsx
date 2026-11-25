import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, CheckCircle2, FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import ModuloHeader from "../components/ModuloHeader";

function getHoyLocalISO() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatFechaCorta(fechaISO) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function formatFechaArchivo(fechaISO) {
  if (!fechaISO) return "";
  const [y, m, d] = fechaISO.slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
}

function parsearMiles(valor) {
  const soloDigitos = String(valor || "").replace(/\D/g, "");
  return soloDigitos ? Number(soloDigitos) : 0;
}

function formatearConPuntos(valor) {
  const soloDigitos = String(valor || "").replace(/\D/g, "");
  if (!soloDigitos) return "";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    Number(soloDigitos),
  );
}

function formatARS(num) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(num) || 0);
}

function construirTextoInstalacion(frigoriasTexto) {
  const frigos = formatearConPuntos(frigoriasTexto) || "___";
  return `Instalacion de Aire Acondicionado de ${frigos} Frigorias. Incluye materiales y mano de obra`;
}

function cargarImagenDataUrl(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", 0.92),
          width: canvas.width,
          height: canvas.height,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function sanitizarParteNombre(texto) {
  return String(texto || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, " ");
}

export default function PresupuestoPage({ onSalir }) {
  const fechaHoy = getHoyLocalISO();

  const [cliente, setCliente] = useState("");
  const [frigoriasTexto, setFrigoriasTexto] = useState("");
  const [importeBaseTexto, setImporteBaseTexto] = useState("");
  const [linea1EditadaManual, setLinea1EditadaManual] = useState(false);

  const [filas, setFilas] = useState(() => [
    {
      id: "item-1",
      descripcion: construirTextoInstalacion(""),
      importeTexto: "",
    },
  ]);

  const [feedback, setFeedback] = useState(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  useEffect(() => {
    setFilas((prev) => {
      if (prev.length === 0) return prev;
      const primera = prev[0];
      const nuevaDesc = linea1EditadaManual
        ? primera.descripcion
        : construirTextoInstalacion(frigoriasTexto);
      const nuevoImp = importeBaseTexto;

      if (
        primera.descripcion === nuevaDesc &&
        primera.importeTexto === nuevoImp
      ) {
        return prev;
      }

      const copia = [...prev];
      copia[0] = {
        ...primera,
        descripcion: nuevaDesc,
        importeTexto: nuevoImp,
      };
      return copia;
    });
  }, [frigoriasTexto, importeBaseTexto, linea1EditadaManual]);

  function handleChangeDescripcion(id, index, valor) {
    if (index === 0) {
      setLinea1EditadaManual(true);
    }
    setFilas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, descripcion: valor } : f)),
    );
  }

  function handleChangeImporte(id, index, valor) {
    const formateado = formatearConPuntos(valor);
    if (index === 0) {
      setImporteBaseTexto(formateado);
    }
    setFilas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, importeTexto: formateado } : f)),
    );
  }

  function agregarLinea() {
    setFilas((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        descripcion: "",
        importeTexto: "",
      },
    ]);
  }

  function eliminarLinea(id, index) {
    if (index === 0) return;
    setFilas((prev) => prev.filter((f) => f.id !== id));
  }

  const totalGeneral = useMemo(
    () => filas.reduce((acc, f) => acc + parsearMiles(f.importeTexto), 0),
    [filas],
  );

  async function handleCrearPresupuesto(e) {
    e.preventDefault();
    setFeedback(null);

    if (!cliente.trim()) {
      setFeedback({ tipo: "err", texto: "Completá el nombre del cliente." });
      return;
    }

    if (filas.some((f) => !f.descripcion.trim())) {
      setFeedback({
        tipo: "err",
        texto: "Completá la descripción de todas las filas.",
      });
      return;
    }

    if (totalGeneral <= 0) {
      setFeedback({ tipo: "err", texto: "Ingresá un importe mayor a 0." });
      return;
    }

    setGenerandoPdf(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = 16;

      // Encabezado: logo.JPG + datos de JUAN ISAIAS TORMO
      const logoInfo = await cargarImagenDataUrl("/logo.JPG");
      let textX = margin;

      if (logoInfo) {
        const logoH = 24;
        const ratio = logoInfo.width / (logoInfo.height || 1);
        const logoW = Math.min(logoH * ratio, 32);
        doc.addImage(logoInfo.dataUrl, "JPEG", margin, y, logoW, logoH);
        textX = margin + logoW + 5;
      }

      const infoWidth = pageWidth - margin - textX;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 20);
      doc.text("JUAN ISAIAS TORMO", textX, y + 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(70, 70, 70);

      const lineasDatos = [
        "Av Dindart N° 275, Ayacucho, Buenos Aires (CP 7150)",
        "CUIT: 20 - 33800060 - 0",
        "Matricula C.A.C.A.A.V (Camara Argentina de Calefacion, Aire acondicionado y ventilacion) N° Matricula: 00-26446-000-2019",
        "Telefono: (0249) 15 4 024415",
      ];

      let infoY = y + 9;
      for (const linea of lineasDatos) {
        const wrapped = doc.splitTextToSize(linea, infoWidth);
        doc.text(wrapped, textX, infoY);
        infoY += wrapped.length * 3.8;
      }

      y = Math.max(y + 26, infoY + 3);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Título Presupuesto, Cliente y Fecha de hoy
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("Presupuesto", margin, y);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Fecha: ${formatFechaCorta(fechaHoy)}`, pageWidth - margin, y, {
        align: "right",
      });

      y += 7;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text(`Cliente: ${cliente.trim()}`, margin, y);

      y += 8;

      // Tabla de 2 columnas: Descripción e Importe
      const colDescW = contentWidth * 0.74;
      const colImpW = contentWidth - colDescW;
      const headerH = 8;

      doc.setFillColor(15, 23, 42);
      doc.rect(margin, y, colDescW, headerH, "F");
      doc.rect(margin + colDescW, y, colImpW, headerH, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      doc.text("Descripción", margin + 3, y + 5.3);
      doc.text("Importe", pageWidth - margin - 3, y + 5.3, { align: "right" });

      y += headerH;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);

      for (const fila of filas) {
        const descLines = doc.splitTextToSize(
          fila.descripcion.trim(),
          colDescW - 6,
        );
        const rowH = Math.max(descLines.length * 4.6 + 4, 9);

        if (y + rowH > 265) {
          doc.addPage();
          y = 20;
        }

        doc.setDrawColor(215, 220, 226);
        doc.rect(margin, y, colDescW, rowH);
        doc.rect(margin + colDescW, y, colImpW, rowH);

        doc.text(descLines, margin + 3, y + 5.2);
        doc.text(
          formatARS(parsearMiles(fila.importeTexto)),
          pageWidth - margin - 3,
          y + 5.2,
          {
            align: "right",
          },
        );

        y += rowH;
      }

      // Fila TOTAL
      const totalH = 9;
      if (y + totalH > 265) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(15, 23, 42);
      doc.rect(margin, y, colDescW, totalH, "FD");
      doc.rect(margin + colDescW, y, colImpW, totalH, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("TOTAL", margin + 3, y + 6);
      doc.text(formatARS(totalGeneral), pageWidth - margin - 3, y + 6, {
        align: "right",
      });

      y += totalH + 10;

      // Leyenda debajo del cuadro
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        "El presente presupuesto tiene una validez de 7 días desde la fecha.",
        margin,
        y,
      );

      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Gracias por su confianza", margin, y);

      const nombreLimpio = sanitizarParteNombre(cliente);
      const fechaLimpia = formatFechaArchivo(fechaHoy);
      const nombreArchivo = `Presupuesto ${nombreLimpio} ${fechaLimpia}.pdf`;

      doc.save(nombreArchivo);
      setFeedback({ tipo: "ok", texto: "Guardado con exito" });
    } catch {
      setFeedback({ tipo: "err", texto: "No se pudo generar el PDF." });
    } finally {
      setGenerandoPdf(false);
    }
  }

  return (
    <div className="space-y-3">
      <ModuloHeader
        titulo="Presupuesto"
        onSalir={onSalir}
        colorTitulo="text-amber-400"
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

      <form onSubmit={handleCrearPresupuesto} className="space-y-3">
        {/* Datos de carga: Cliente, Frigorías e Importe */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5">
          <div>
            <label
              htmlFor="presu-cliente"
              className="block text-xs font-semibold text-slate-300 mb-1"
            >
              Cliente
            </label>
            <input
              id="presu-cliente"
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="presu-frigorias"
                className="block text-xs font-semibold text-slate-300 mb-1"
              >
                Frigorías
              </label>
              <input
                id="presu-frigorias"
                type="text"
                inputMode="numeric"
                value={frigoriasTexto}
                onChange={(e) => {
                  setLinea1EditadaManual(false);
                  setFrigoriasTexto(formatearConPuntos(e.target.value));
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl py-2.5 px-3 text-sm font-bold text-white outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="presu-importe"
                className="block text-xs font-semibold text-slate-300 mb-1"
              >
                Importe
              </label>
              <input
                id="presu-importe"
                type="text"
                inputMode="numeric"
                value={importeBaseTexto}
                onChange={(e) =>
                  setImporteBaseTexto(formatearConPuntos(e.target.value))
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 rounded-xl py-2.5 px-3 text-sm font-bold text-emerald-300 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Líneas editables de Descripción e Importe + Total */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5">
          <div className="grid grid-cols-12 gap-2 px-1 text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">
            <span className="col-span-8">Descripción</span>
            <span className="col-span-4 text-right">Importe</span>
          </div>

          <div className="space-y-2">
            {filas.map((fila, idx) => (
              <div
                key={fila.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1.5"
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  <textarea
                    rows={idx === 0 ? 3 : 2}
                    aria-label={`Descripción fila ${idx + 1}`}
                    value={fila.descripcion}
                    onChange={(e) =>
                      handleChangeDescripcion(fila.id, idx, e.target.value)
                    }
                    className="col-span-8 bg-slate-900 border border-slate-800 focus:border-amber-400 rounded-lg p-2 text-xs text-slate-100 outline-none resize-none"
                  />

                  <input
                    type="text"
                    inputMode="numeric"
                    aria-label={`Importe fila ${idx + 1}`}
                    value={fila.importeTexto}
                    onChange={(e) =>
                      handleChangeImporte(fila.id, idx, e.target.value)
                    }
                    className="col-span-4 bg-slate-900 border border-slate-800 focus:border-emerald-400 rounded-lg py-2 px-2 text-xs font-bold text-emerald-300 text-right outline-none"
                  />
                </div>

                {idx > 0 && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => eliminarLinea(fila.id, idx)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar línea</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={agregarLinea}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar línea</span>
          </button>

          <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
            <span className="text-sm font-extrabold text-white">TOTAL</span>
            <span className="text-base font-black text-emerald-400">
              {formatARS(totalGeneral)}
            </span>
          </div>
        </div>

        {/* Botón final: Crear presupuesto (sin modal de alerta) */}
        <button
          type="submit"
          disabled={generandoPdf}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 active:scale-[0.98] transition text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          <span>{generandoPdf ? "Creando PDF..." : "Crear presupuesto"}</span>
        </button>
      </form>
    </div>
  );
}
