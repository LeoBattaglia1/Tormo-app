import { useState } from "react";
import { Lock } from "lucide-react";

const PASS_INICIAL = "1234";

export default function LoginPage({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (password.trim() === PASS_INICIAL) {
      setError("");
      onSuccess();
    } else {
      setError("Contraseña incorrecta");
    }
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col items-center gap-4">
        <img
          src="/logo.JPG"
          alt="Logo"
          className="w-full max-h-40 object-contain rounded-2xl bg-slate-950 p-2"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        <div className="text-center">
          <h1 className="text-base font-bold tracking-wide">Acceso</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingresá tu clave para entrar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              inputMode="numeric"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-sky-600 hover:bg-sky-500 active:scale-[0.99] transition font-semibold py-3 rounded-2xl text-sm"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
