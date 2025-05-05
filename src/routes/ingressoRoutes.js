const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const verificaTipoUsuario = require("../middlewares/verificaTipoUsuario");
const ingressosController = require("../controllers/ingressosController");

router.post(
  "/comprar",
  authMiddleware,
  (req, res, next) => {
    // #swagger.tags = ['Ingressos']
    // #swagger.summary = 'Compra um ingresso para um evento'
    // #swagger.security = [{ bearerAuth: [] }]

    /* #swagger.requestBody = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          eventoId: { type: "string", example: "abc123-evento-id" }
        }
      }
    }
  }
} */

    /* #swagger.responses[201] = {
        description: "Ingresso comprado com sucesso",
        content: {
          "application/json": {
            schema: {
              id: 45,
              evento_id: "acb123-xyz456",
              usuario_id: "user123",
              status: "pendente"
            }
          }
        }
    } */

    next();
  },
  ingressosController.comprarIngresso
);

router.get(
  "/meus",
  authMiddleware,
  verificaTipoUsuario("usuario"),
  (req, res, next) => {
    // #swagger.tags = ['Ingressos']
    // #swagger.summary = 'Lista ingressos comprados pelo usuario autenticado'
    // #swagger.security = [{ bearerAuth: [] }]

    /* #swagger.responses[200] = {
        description: "Lista de ingressos do usuario",
        content: {
          "application/json": {
            schema: {
              type: "array",
              items: {
                id: 1,
                status: "pendente",
                evento_id: "evento123",
                eventos: {
                  nome: "Show do Matuê",
                  data: "2025-06-20",
                  local: "Ginásio Central"
                }
              }
            }
          }
        }
    } */

    next();
  },
  ingressosController.listarMeusIngressos
);

module.exports = router;
