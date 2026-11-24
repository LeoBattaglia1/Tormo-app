const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error en la petición (${res.status})`);
  }
  return data;
}

export const api = {
  getTurnos: () => request("/api/turnos"),
  createTurno: (payload) =>
    request("/api/turnos", { method: "POST", body: JSON.stringify(payload) }),
  deleteTurno: (id) => request(`/api/turnos/${id}`, { method: "DELETE" }),

  getPendientes: () => request("/api/pendientes"),
  createTrabajo: (payload) =>
    request("/api/trabajos", { method: "POST", body: JSON.stringify(payload) }),
  registrarPago: (id, payload) =>
    request(`/api/trabajos/${id}/pagar`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getResumen: () => request("/api/resumen"),
};
