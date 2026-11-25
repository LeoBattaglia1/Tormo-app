const express = require("express");
const { readJsonFile, writeJsonFile } = require("../services/githubService");

const router = express.Router();
const FILE_PATH = "data/turnos.json";

router.get("/", async (req, res) => {
  try {
    const { data } = await readJsonFile(FILE_PATH, []);
    const ordenados = [...data].sort((a, b) => a.fecha.localeCompare(b.fecha));
    res.json(ordenados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { cliente, fecha, direccion } = req.body;

    if (!cliente || !fecha) {
      return res.status(400).json({
        error: "Faltan datos obligatorios",
      });
    }

    const { data, sha } = await readJsonFile(FILE_PATH, []);

    const nuevoTurno = {
      id: `t-${Date.now()}`,
      cliente: cliente.trim(),
      fecha,
      direccion: (direccion || "").trim(),
    };

    const actualizados = [...data, nuevoTurno];
    await writeJsonFile(
      FILE_PATH,
      actualizados,
      `Agregar turno: ${nuevoTurno.cliente}`,
      sha,
    );

    res.status(201).json(nuevoTurno);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, sha } = await readJsonFile(FILE_PATH, []);

    const filtrados = data.filter((t) => t.id !== id);
    if (filtrados.length === data.length) {
      return res.status(404).json({ error: "Turno no encontrado" });
    }

    await writeJsonFile(FILE_PATH, filtrados, `Eliminar turno ${id}`, sha);
    res.json({ ok: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
