const express = require("express");
const { readJsonFile } = require("../services/githubService");

const router = express.Router();
const RESUMEN_PATH = "data/resumen.json";

router.get("/", async (req, res) => {
  try {
    const { data } = await readJsonFile(RESUMEN_PATH, {});

    const porMes = Object.entries(data)
      .map(([mes, info]) => ({
        mes,
        cobrado: Number(info.cobrado) || 0,
      }))
      .sort((a, b) => b.mes.localeCompare(a.mes));

    const mapaAnual = {};
    for (const item of porMes) {
      const anio = item.mes.slice(0, 4);
      mapaAnual[anio] = (mapaAnual[anio] || 0) + item.cobrado;
    }

    const porAnio = Object.entries(mapaAnual)
      .map(([anio, cobrado]) => ({ anio, cobrado }))
      .sort((a, b) => b.anio.localeCompare(a.anio));

    res.json({ porMes, porAnio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
