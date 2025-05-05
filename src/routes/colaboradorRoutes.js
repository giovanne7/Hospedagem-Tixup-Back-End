const express = require("express");
const router = express.Router();
const colaboradorController = require("../controllers/colaboradoresController");
const authMiddleware = require("../middlewares/authMiddleware");
const verificaTipoUsuario = require("../middlewares/verificaTipoUsuario");

router.use(authMiddleware);

router.post(
  "/eventos/:id/colaboradores",
  verificaTipoUsuario("organizador"),
  (req, res, next) => {
    // #swagger.tags = ['Colaboradores']
    // #swagger.summary = 'Adiciona um colaborador a um evento'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', description: 'ID do evento', required: true, type: 'string' }
    /* #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              usuario_id: { type: "string", example: "uuid-do-usuario" },
              permissao: { type: "string", example: "checkin" }
            }
          }
        }
      }
    } */
    next();
  },
  colaboradorController.adicionarColaborador
);

router.get(
  "/eventos/:id/colaboradores",
  verificaTipoUsuario("organizador"),
  (req, res, next) => {
    // #swagger.tags = ['Colaboradores']
    // #swagger.summary = 'Lista os colaboradores de um evento'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', description: 'ID do evento', required: true, type: 'string' }
    next();
  },
  colaboradorController.listarColaboradores
);

router.put(
  "/promover-organizador",
  verificaTipoUsuario("organizador"),
  (req, res, next) => {
    // #swagger.tags = ['Colaboradores']
    // #swagger.summary = 'Promove um usuário a organizador'
    // #swagger.security = [{ bearerAuth: [] }]
    /* #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              usuario_id: { type: "string", example: "uuid-do-usuario" }
            }
          }
        }
      }
    } */
    next();
  },
  colaboradorController.promoverOrganizador
);

module.exports = router;