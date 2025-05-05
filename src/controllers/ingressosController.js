const supabase = require("../config/supabaseClient");
const { sendSuccess, sendError } = require("../utils/responseFormatter");

exports.comprarIngresso = async (req, res) => {
  try {
    const { eventoId } = req.body;
    const usuario_id = req.user.id;
    console.log("Comprando ingresso:", { eventoId, usuario_id });

    if (!eventoId) {
      return sendError(res, "O campo eventoId é obrigatório", {}, 400);
    }

    if (!isValidUUID(eventoId)) {
      return sendError(res, "O campo eventoId deve ser um UUID válido", {}, 400);
    }

    const { data: evento, error: eventoError } = await supabase
      .from("eventos")
      .select("id, preco, publico")
      .eq("id", eventoId)
      .single();
    console.log("Erro ao buscar evento:", eventoError);

    if (eventoError || !evento) {
      return sendError(res, "Evento não encontrado", {}, 404);
    }

    if (!evento.publico) {
      return sendError(res, "Este evento não está disponível para compra", {}, 403);
    }

    const { data, error: insertError } = await supabase
      .from("ingressos")
      .insert([
        {
          evento_id: eventoId,
          usuario_id,
          preco: evento.preco,
          status: "pendente",
          tipo: "inteira",
          data_compra: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    console.log("Erro ao inserir ingresso:", insertError);

    if (insertError) {
      console.error("Erro ao inserir ingresso:", insertError);
      return sendError(res, "Erro ao comprar ingresso", { details: insertError.message }, 500);
    }

    sendSuccess(res, "Ingresso comprado com sucesso", data, 201);
  } catch (err) {
    console.error("Erro em comprarIngresso:", err);
    sendError(res, "Erro ao comprar ingresso", { details: err.message }, 500);
  }
};

exports.listarMeusIngressos = async (req, res) => {
  try {
    const usuario_id = req.user.id;

    const { data, error } = await supabase
      .from("ingressos")
      .select(`
        id,
        evento_id,
        status,
        tipo,
        preco,
        data_compra,
        eventos(nome, data, local)
      `)
      .eq("usuario_id", usuario_id);

    if (error) {
      return sendError(res, "Erro ao listar ingressos", { details: error.message }, 500);
    }

    sendSuccess(res, "Ingressos listados com sucesso", data, 200);
  } catch (err) {
    console.error("Erro em listarMeusIngressos:", err);
    sendError(res, "Erro ao listar ingressos", { details: err.message }, 500);
  }
};

const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
};