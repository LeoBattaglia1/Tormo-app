import { LogOut } from "lucide-react";

export default function ModuloHeader({
  titulo,
  onSalir,
  onClickBoton,
  textoBoton = "Salir",
  colorTitulo = "text-cyan-400",
}) {
  const manejarAccion = onClickBoton || onSalir;

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-950/95 backdrop-blur border-b border-slate-800/90 z-30">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3 px-4 py-3.5">
        <h1
          className={`text-2xl sm:text-3xl font-black tracking-tight leading-none truncate ${colorTitulo}`}
        >
          {titulo}
        </h1>

        <button
          type="button"
          onClick={manejarAccion}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] border border-slate-700/80 text-xs font-bold text-slate-200 transition shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>{textoBoton}</span>
        </button>
      </div>
    </header>
  );
}
