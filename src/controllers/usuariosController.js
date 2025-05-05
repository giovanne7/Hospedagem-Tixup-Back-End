const supabase = require("../config/supabaseClient");
const { sendSuccess, sendError } = require("../utils/responseFormatter");

exports.autoPromover = async (req, res) => {
  const id = req.user.id;

  console.log("👤 ID do usuário autenticado:", req.user?.id);

  const { data: usuario, error: getUserErr } = await supabase
    .from("usuarios")
    .select("id, is_organizador, nome, email")
    .eq("id", id)
    .single();

  if (getUserErr || !usuario) {
    return sendError(res, "Usuário não encontrado", {}, 404);
  }

  if (usuario.is_organizador) {
    return sendError(res, "Você já é organizador", {}, 400);
  }

  console.log("🔥 Tentando promover:", req.user?.id);

  const { data: promovido, error } = await supabase
    .from("usuarios")
    .update({ is_organizador: true })
    .eq("id", id)
    .select("id, nome, email, is_organizador")
    .single();

  console.log("🔧 Resultado da promoção:", promovido, error);

  if (error) {
    return sendError(
      res,
      "Erro ao se promover",
      { details: error.message },
      500
    );
  }

  return sendSuccess(
    res,
    "Usuário promovido a organizador com sucesso",
    { usuario: promovido },
    200
  );
};
