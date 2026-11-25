import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  open,
  title = "¿Estás seguro?",
  message,
  details = [],
  confirmText = "Confirmar y enviar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-5 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-snug">{title}</h3>
              {message && (
                <p className="text-xs text-slate-400 mt-0.5">{message}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {details.length > 0 && (
          <div className="mt-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
            {details.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-slate-400">{row.label}</span>
                <span
                  className={`font-semibold text-right ${row.className || "text-slate-100"}`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] transition text-sm font-semibold text-slate-200 disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 active:scale-[0.98] transition text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/25 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Guardando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
