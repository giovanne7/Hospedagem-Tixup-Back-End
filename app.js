const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./src/config/swagger-output.json");
const logger = require("./src/middlewares/logger");
global.resBODY = null;

const app = express();
app.use(
  cors({
    origin: "tixupfrontend.vercel.app",
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(logger);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get("/", (req, res) => {
  res.send("Backend TixUp funcionando");
});

const authRoutes = require("./src/routes/authRoutes");
const eventoRoutes = require("./src/routes/eventoRoutes");
const ingressoRoutes = require("./src/routes/ingressoRoutes");
const colaboradorRoutes = require("./src/routes/colaboradorRoutes");
const notificacoesRoutes = require("./src/routes/notificacoesRoutes");
const authMiddleware = require("./src/middlewares/authMiddleware");
const verificaTipoUsuario = require("./src/middlewares/verificaTipoUsuario");
const colaboradorController = require("./src/controllers/colaboradoresController");
const usuariosRoutes = require("./src/routes/usuariosRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventoRoutes);
app.use("/api/colaboradores", colaboradorRoutes);
app.use("/api/ingressos", ingressoRoutes);
app.use("/api/notificacoes", notificacoesRoutes);
app.use("/api/usuarios", usuariosRoutes);

module.exports = app;
