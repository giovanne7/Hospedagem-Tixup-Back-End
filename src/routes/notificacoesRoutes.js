const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const verificaTipoUsuario = require("../middlewares/verificaTipoUsuario");
const notificacoesController = require("../controllers/notificacoesController");

router.post(
  "/token",
  authMiddleware,
  (req, res, next) => {
    // #swagger.tags = ['Notificações']
    // #swagger.summary = 'Registra um token de push notification para o usuário autenticado'
    // #swagger.security = [{ bearerAuth: [] }]
    /* #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["token_push"],
            properties: {
              token_push: { type: "string", example: "fcm-token-exemplo" }
            }
          }
        }
      }
    } */
    /* #swagger.responses[201] = {
      description: "Token registrado com sucesso",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string", example: "Token registrado com sucesso" },
              dispositivo: {
                type: "object",
                properties: {
                  usuario_id: { type: "string", example: "uuid-do-usuario" },
                  token_push: { type: "string", example: "fcm-token-exemplo" }
                }
              }
            }
          }
        }
      }
    } */
    /* #swagger.responses[200] = { description: "Token já registrado" } */
    /* #swagger.responses[400] = { description: "Campos obrigatórios ausentes" } */
    /* #swagger.responses[401] = { description: "Não autorizado" } */
    /* #swagger.responses[500] = { description: "Erro interno do servidor" } */
    next();
  },
  notificacoesController.registrarToken
);

router.post(
  "/",
  authMiddleware,
  verificaTipoUsuario("organizador"),
  (req, res, next) => {
    // #swagger.tags = ['Notificações']
    // #swagger.summary = 'Envia uma notificação push para usuários de um evento ou um usuário específico'
    // #swagger.security = [{ bearerAuth: [] }]
    /* #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              evento_id: { type: "string", example: "uuid-do-evento" },
              usuario_id: { type: "string", example: "uuid-do-usuario" },
              titulo: { type: "string", example: "Evento Atualizado" },
              mensagem: { type: "string", example: "O evento foi atualizado, confira!" }
            }
          }
        }
      }
    } */
    /* #swagger.responses[200] = { description: "Notificação enviada com sucesso" } */
    /* #swagger.responses[400] = { description: "Campos obrigatórios ausentes" } */
    /* #swagger.responses[404] = { description: "Evento ou usuário não encontrado" } */
    /* #swagger.responses[500] = { description: "Erro interno do servidor" } */
    next();
  },
  (req, res) => {
    const { evento_id, usuario_id } = req.body;
    if (evento_id) {
      return notificacoesController.enviarNotificacaoPorEvento(req, res);
    } else if (usuario_id) {
      return notificacoesController.enviarNotificacaoParaUsuario(req, res);
    } else {
      return res.status(400).json({
        success: false,
        message: "É necessário fornecer evento_id ou usuario_id",
        error: {},
      });
    }
  }
);

router.get(
  "/",
  authMiddleware,
  (req, res, next) => {
    // #swagger.tags = ['Notificações']
    // #swagger.summary = 'Lista as notificações do usuário autenticado'
    // #swagger.security = [{ bearerAuth: [] }]
    /* #swagger.parameters['lida'] = {
      in: 'query',
      description: 'Filtrar por notificações lidas (true) ou não lidas (false)',
      type: 'boolean'
    } */
    /* #swagger.parameters['evento_id'] = {
      in: 'query',
      description: 'Filtrar por notificações de um evento específico',
      type: 'string'
    } */
    /* #swagger.responses[200] = {
      description: "Notificações listadas com sucesso",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", example: "uuid-da-notificacao" },
                tipo: { type: "string", example: "push" },
                mensagem: { type: "string", example: "O evento foi atualizado!" },
                titulo: { type: "string", example: "Evento Atualizado" },
                data_criacao: { type: "string", format: "date-time", example: "2025-04-18T10:00:00Z" },
                lida: { type: "boolean", example: false },
                status: { type: "string", example: "enviada" },
                evento_id: { type: "string", example: "uuid-do-evento" },
                eventos: {
                  type: "object",
                  properties: {
                    nome: { type: "string", example: "Show do Matuê" },
                    data: { type: "string", example: "2025-06-20" },
                    local: { type: "string", example: "Ginásio Central" }
                  }
                }
              }
            }
          }
        }
      }
    } */
    /* #swagger.responses[401] = { description: "Não autorizado" } */
    /* #swagger.responses[500] = { description: "Erro interno do servidor" } */
    next();
  },
  notificacoesController.listarNotificacoesUsuario
);

module.exports = router;
