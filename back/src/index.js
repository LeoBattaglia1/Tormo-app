require("dotenv").config();
const express = require("express");
const cors = require("cors");

const turnosRoutes = require("./routes/turnos.routes");
const trabajosRoutes = require("./routes/trabajos.routes");
const resumenRoutes = require("./routes/resumen.routes");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "tormo-backend" });
});

app.use("/api/turnos", turnosRoutes);
app.use("/api", trabajosRoutes);
app.use("/api/resumen", resumenRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
