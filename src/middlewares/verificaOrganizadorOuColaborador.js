const supabase = require("../config/supabaseClient");
const { sendError } = require("../utils/responseFormatter");

module.exports = async function verificaOrganizadorOuColaborador(
  req,
  res,
  next
) {
  const usuarioId = req.user.id;
  const eventoId = req.params.id;

  const { data: evento, error: eventoError } = await supabase
    .from("eventos")
    .select("organizador_id")
    .eq("id", eventoId)
    .single();

  if (eventoError || !evento) {
    console.error("❌ Erro ao buscar evento:", eventoError);
    return sendError(res, "Evento não encontrado", {}, 404);
  }

  if (evento.organizador_id === usuarioId) return next();

  const { data: colaborador, error: colaboradorError } = await supabase
    .from("colaboradores_eventos")
    .select("id")
    .eq("evento_id", eventoId)
    .eq("usuario_id", usuarioId)
    .single();

  if (colaboradorError) {
    console.error("❌ Erro ao verificar colaborador:", colaboradorError);
    return sendError(res, "Erro ao verificar permissões", {}, 500);
  }

  if (!colaborador) {
    return sendError(res, "Acesso negado ao evento", {}, 403);
  }

  next();
};
