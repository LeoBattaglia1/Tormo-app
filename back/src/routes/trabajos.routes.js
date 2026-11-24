const express = require("express");
const { readJsonFile, writeJsonFile } = require("../services/githubService");

const router = express.Router();
const PENDIENTES_PATH = "data/pendientes.json";
const RESUMEN_PATH = "data/resumen.json";

async function sumarAlResumen(fecha, montoCobrado) {
  const monto = Number(montoCobrado) || 0;
  if (monto <= 0) return;

  const mesClave = fecha.slice(0, 7);
  const { data: resumen, sha } = await readJsonFile(RESUMEN_PATH, {});

  const actual = resumen[mesClave]?.cobrado || 0;
  resumen[mesClave] = {
    cobrado: actual + monto,
  };

  await writeJsonFile(
    RESUMEN_PATH,
    resumen,
    `Sumar cobro $${monto} en ${mesClave}`,
    sha,
  );
}

router.get("/pendientes", async (req, res) => {
  try {
    const { data } = await readJsonFile(PENDIENTES_PATH, []);
    const conSaldo = data.map((item) => ({
      ...item,
      saldoPendiente: Number(item.precioTrabajo) - Number(item.pagoRealizado),
    }));
    res.json(conSaldo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/trabajos", async (req, res) => {
  try {
    const { cliente, fecha, precioTrabajo, pagoRealizado = 0 } = req.body;

    if (!cliente || !fecha || precioTrabajo === undefined) {
      return res.status(400).json({
        error: "Faltan datos obligatorios (cliente, fecha, precioTrabajo)",
      });
    }

    const total = Number(precioTrabajo);
    const pagado = Number(pagoRealizado);

    if (total <= 0 || pagado < 0 || pagado > total) {
      return res.status(400).json({ error: "Montos inválidos" });
    }

    if (pagado > 0) {
      await sumarAlResumen(fecha, pagado);
    }

    if (pagado === total) {
      return res.status(201).json({
        saldado: true,
        mensaje:
          "Trabajo pagado en su totalidad y sumado al acumulado mensual.",
      });
    }

    const { data: pendientes, sha } = await readJsonFile(PENDIENTES_PATH, []);

    const nuevoPendiente = {
      id: `p-${Date.now()}`,
      cliente: cliente.trim(),
      fecha,
      precioTrabajo: total,
      pagoRealizado: pagado,
    };

    await writeJsonFile(
      PENDIENTES_PATH,
      [...pendientes, nuevoPendiente],
      `Agregar pendiente: ${nuevoPendiente.cliente}`,
      sha,
    );

    res.status(201).json({
      saldado: false,
      trabajo: {
        ...nuevoPendiente,
        saldoPendiente: total - pagado,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/trabajos/:id/pagar", async (req, res) => {
  try {
    const { id } = req.params;
    const { montoPago, fechaPago } = req.body;
    const abono = Number(montoPago);

    if (!abono || abono <= 0) {
      return res
        .status(400)
        .json({ error: "El monto del pago debe ser mayor a 0" });
    }

    const { data: pendientes, sha } = await readJsonFile(PENDIENTES_PATH, []);
    const index = pendientes.findIndex((p) => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Trabajo pendiente no encontrado" });
    }

    const trabajo = pendientes[index];
    const nuevoPagoTotal = Number(trabajo.pagoRealizado) + abono;

    if (nuevoPagoTotal > Number(trabajo.precioTrabajo)) {
      return res
        .status(400)
        .json({ error: "El pago supera el saldo pendiente" });
    }

    const fechaRegistro = fechaPago || new Date().toISOString().slice(0, 10);
    await sumarAlResumen(fechaRegistro, abono);

    if (nuevoPagoTotal >= Number(trabajo.precioTrabajo)) {
      const restantes = pendientes.filter((p) => p.id !== id);
      await writeJsonFile(
        PENDIENTES_PATH,
        restantes,
        `Saldar y eliminar pendiente: ${trabajo.cliente}`,
        sha,
      );

      return res.json({
        saldado: true,
        mensaje: "Trabajo saldado por completo y eliminado de pendientes.",
      });
    }

    pendientes[index] = {
      ...trabajo,
      pagoRealizado: nuevoPagoTotal,
    };

    await writeJsonFile(
      PENDIENTES_PATH,
      pendientes,
      `Registrar pago parcial: ${trabajo.cliente}`,
      sha,
    );

    res.json({
      saldado: false,
      trabajo: {
        ...pendientes[index],
        saldoPendiente: Number(trabajo.precioTrabajo) - nuevoPagoTotal,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
