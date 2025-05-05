const express = require("express");
const router = express.Router();
const eventoController = require("../controllers/eventoController");
const authMiddleware = require("../middlewares/authMiddleware");
const verificaTipoUsuario = require("../middlewares/verificaTipoUsuario");
const supabase = require("../config/supabaseClient");
const { sendSuccess, sendError } = require("../utils/responseFormatter");

// Rota pública para listar eventos
router.get(
  "/",
  (req, res, next) => {
    // #swagger.tags = ['Eventos']
    // #swagger.summary = 'Lista todos os eventos públicos'
    // #swagger.parameters['categoria'] = { in: 'query', description: 'Filtrar por categoria', type: 'string' }
    // #swagger.parameters['data'] = { in: 'query', description: 'Filtrar por data (formato YYYY-MM-DD)', type: 'string' }
    /* #swagger.responses[200] = {
      description: "Eventos públicos listados com sucesso",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: { $ref: "#/components/schemas/Evento" }
          }
        }
      }
    } */
    next();
  },
  async (req, res) => {
    try {
      const { categoria, data } = req.query;

      let query = supabase.from("eventos").select("*").eq("publico", true);

      if (categoria) {
        query = query.eq("categoria", categoria);
      }

      if (data) {
        if (!isValidDate(data)) {
          return sendError(
            res,
            "O campo data deve estar no formato YYYY-MM-DD",
            {},
            400
          );
        }
        query = query.eq("data", data);
      }

      const { data: eventos, error } = await query;

      if (error) {
        return sendError(
          res,
          "Erro ao buscar eventos públicos",
          { details: error.message },
          500
        );
      }

      sendSuccess(res, "Eventos públicos listados com sucesso", eventos, 200);
    } catch (err) {
      sendError(res, "Erro ao listar eventos", { details: err.message }, 500);
    }
  }
);

// Aplica o middleware de autenticação nas rotas abaixo
router.use(authMiddleware);

const colaboradorController = require("../controllers/colaboradoresController");
// Adiciona colaborador
router.post(
  "/:id/colaboradores",
  verificaTipoUsuario("organizador"),
  colaboradorController.adicionarColaborador
);

// Lista colaboradores
router.get(
  "/:id/colaboradores",
  verificaTipoUsuario("organizador"),
  colaboradorController.listarColaboradores
);

// Lista eventos do organizador logado
router.get(
  "/meus-eventos",
  (req, res, next) => {
    // #swagger.tags = ['Eventos']
    // #swagger.summary = 'Lista os eventos do organizador logado'
    // #swagger.security = [{ bearerAuth: [] }]
    next();
  },
  eventoController.listarMeusEventos
);

// Cria novo evento
router.post(
  "/",
  (req, res, next) => {
    // #swagger.tags = ['Eventos']
    // #swagger.summary = 'Cria um novo evento'
    // #swagger.security = [{ bearerAuth: [] }]
    /* #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              nome: { type: "string", example: "Show do Matuê" },
              descricao: { type: "string", example: "Evento com atrações especiais" },
              data: { type: "string", format: "date", example: "2025-06-20" },
              local: { type: "string", example: "Ginásio Central" },
              preco: { type: "number", example: 99.9 },
              imagem: { type: "string", example: "https://imagem.com/img.jpg" },
              publico: { type: "boolean", example: true },
              categoria: { type: "string", example: "show" }
            }
          }
        }
      }
    } */
    /* #swagger.responses[201] = {
      description: "Evento criado com sucesso",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Evento" }
        }
      }
    } */
    next();
  },
  eventoController.criarEvento
);

// Deleta evento
router.delete(
  "/:id",
  (req, res, next) => {
    // #swagger.tags = ['Eventos']
    // #swagger.summary = 'Deleta um evento por ID'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', description: 'ID do evento', required: true, type: 'string' }
    // #swagger.responses[204] = { description: "Evento deletado com sucesso" }
    // #swagger.responses[403] = { description: "Não autorizado a deletar este evento" }
    // #swagger.responses[404] = { description: "Evento não encontrado" }
    next();
  },
  eventoController.deletarEvento
);

// Lista vendas (ingressos) de um evento
router.get(
  "/:id/vendas",
  verificaTipoUsuario("organizador"),
  async (req, res, next) => {
    // #swagger.tags = ['Vendas']
    // #swagger.summary = 'Lista todos os ingressos vendidos para um evento'
    // #swagger.security = [{ bearerAuth: [] }]
    // #swagger.parameters['id'] = { in: 'path', description: 'ID do evento', required: true, type: 'string' }
    /* #swagger.responses[200] = {
      description: "Lista de ingressos vendidos",
      content: {
        "application/json": {
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", example: "uuid-do-ingresso" },
                nome_comprador: { type: "string", example: "João Comprador" },
                data_compra: { type: "string", format: "date-time", example: "2025-04-18T10:00:00Z" },
                status: { type: "string", example: "pendente" }
              }
            }
          }
        }
      }
    } */
    /* #swagger.responses[401] = { description: "Não autorizado" } */
    /* #swagger.responses[403] = { description: "Apenas organizadores podem visualizar vendas" } */
    /* #swagger.responses[404] = { description: "Evento não encontrado" } */
    /* #swagger.responses[500] = { description: "Erro interno do servidor" } */

    try {
      const { id } = req.params;
      const organizadorId = req.user.id;

      console.log("Buscando evento com id:", id);
      const { data: evento, error: eventoError } = await supabase
        .from("eventos")
        .select("id, organizador_id")
        .eq("id", id)
        .single();
      if (eventoError || !evento) {
        console.error("Erro ao buscar evento:", eventoError);
        return sendError(res, "Evento não encontrado", {}, 404);
      }

      if (evento.organizador_id !== organizadorId) {
        return sendError(
          res,
          "Você não tem permissão para visualizar as vendas deste evento",
          {},
          403
        );
      }

      const { data: ingressos, error: ingressosError } = await supabase
        .from("ingressos")
        .select(
          `
          id,
          status,
          data_compra,
          usuario_id,
          usuarios!inner(nome)
        `
        )
        .eq("evento_id", id);

      if (ingressosError) {
        console.error("Erro ao buscar ingressos:", ingressosError);
        return sendError(
          res,
          "Erro ao buscar ingressos",
          { details: ingressosError.message },
          500
        );
      }

      const vendas = ingressos.map((ingresso) => ({
        id: ingresso.id,
        nome_comprador: ingresso.usuarios.nome,
        data_compra: ingresso.data_compra,
        status: ingresso.status,
      }));

      sendSuccess(res, "Vendas listadas com sucesso", vendas, 200);
    } catch (err) {
      console.error("Erro na rota /vendas:", err);
      sendError(res, "Erro ao listar vendas", { details: err.message }, 500);
    }
  }
);

const isValidDate = (dateString) => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

module.exports = router;
