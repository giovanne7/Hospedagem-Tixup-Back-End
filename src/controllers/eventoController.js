const supabase = require("../config/supabaseClient");
const { sendSuccess, sendError } = require("../utils/responseFormatter");

exports.criarEvento = async (req, res) => {
  const organizador_id = req.user.id;
  console.log("criando evento como organizador:", organizador_id);
  try {
    const { nome, descricao, data, local, preco, imagem, publico, categoria } =
      req.body;

    if (
      !nome ||
      !data ||
      !local ||
      preco === undefined ||
      publico === undefined
    ) {
      return sendError(
        res,
        "Campos obrigatórios: nome, data, local, preco, publico",
        {},
        400
      );
    }

    if (typeof publico !== "boolean") {
      return sendError(res, "O campo publico deve ser booleano", {}, 400);
    }

    if (imagem && !isValidUrl(imagem)) {
      return sendError(res, "O campo imagem deve ser uma URL válida", {}, 400);
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("is_organizador")
      .eq("id", organizador_id)
      .single();

    if (usuarioError) {
      return sendError(
        res,
        "Erro ao verificar tipo de usuário",
        { details: usuarioError.message },
        500
      );
    }

    if (!usuario.is_organizador) {
      return sendError(
        res,
        "Apenas organizadores podem criar eventos",
        {},
        403
      );
    }

    const { data: evento, error: eventoError } = await supabase
      .from("eventos")
      .insert([
        {
          nome,
          descricao,
          data,
          local,
          preco,
          imagem,
          publico,
          categoria,
          organizador_id,
        },
      ])
      .select()
      .single();

    if (eventoError) {
      return sendError(
        res,
        "Erro ao criar evento",
        { details: eventoError.message },
        500
      );
    }

    sendSuccess(res, "Evento criado com sucesso", evento, 201);
  } catch (err) {
    sendError(res, "Erro ao criar evento", { details: err.message }, 500);
  }
};

exports.listarEventos = async (req, res) => {
  try {
    const { data: eventos, error } = await supabase
      .from("eventos")
      .select("*")
      .eq("publico", true);

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
};

exports.listarMeusEventos = async (req, res) => {
  try {
    if (!req.user.is_organizador) {
      return sendError(
        res,
        "Apenas organizadores podem listar seus eventos",
        {},
        403
      );
    }

    const { data: eventos, error } = await supabase
      .from("eventos")
      .select("*")
      .eq("organizador_id", req.user.id);

    if (error) {
      return sendError(
        res,
        "Erro ao buscar eventos do organizador",
        { details: error.message },
        500
      );
    }

    sendSuccess(
      res,
      "Eventos do organizador listados com sucesso",
      eventos,
      200
    );
  } catch (err) {
    sendError(res, "Erro ao listar eventos", { details: err.message }, 500);
  }
};

exports.deletarEvento = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const { data: evento, error: fetchError } = await supabase
      .from("eventos")
      .select("id, organizador_id")
      .eq("id", id)
      .single();

    if (fetchError || !evento) {
      return sendError(res, "Evento não encontrado", {}, 404);
    }

    if (evento.organizador_id !== userId) {
      return sendError(
        res,
        "Você não tem permissão para deletar este evento",
        {},
        403
      );
    }

    const { error: deleteError } = await supabase
      .from("eventos")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return sendError(
        res,
        "Erro ao deletar evento",
        { details: deleteError.message },
        500
      );
    }

    sendSuccess(res, "Evento deletado com sucesso", {}, 204);
  } catch (err) {
    sendError(res, "Erro ao deletar evento", { details: err.message }, 500);
  }
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};
