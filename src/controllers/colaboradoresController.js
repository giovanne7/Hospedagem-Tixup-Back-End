const supabase = require("../config/supabaseClient");
const { sendSuccess, sendError } = require("../utils/responseFormatter");

exports.adicionarColaborador = async (req, res) => {
  console.log("Entrou em adicionarColaborador");
  try {
    const { usuario_id, permissao } = req.body;
    const { id: evento_id } = req.params;
    const organizador_id = req.user.id;

    console.log("Adicionando colaborador:", {
      usuario_id,
      permissao,
      evento_id,
    });

    if (!usuario_id || !permissao) {
      return sendError(
        res,
        "Campos obrigatórios: usuario_id, permissao",
        {},
        400
      );
    }

    const { data: evento, error: eventoError } = await supabase
      .from("eventos")
      .select("id, organizador_id")
      .eq("id", evento_id)
      .eq("organizador_id", organizador_id)
      .single();

    if (eventoError || !evento) {
      return sendError(
        res,
        "Evento não encontrado ou você não é o organizador",
        {},
        404
      );
    }

    const { data: existingColaborador, error: checkError } = await supabase
      .from("colaboradores_eventos")
      .select("id")
      .eq("evento_id", evento_id)
      .eq("usuario_id", usuario_id);

    if (checkError) {
      console.error("Erro ao verificar colaborador existente:", checkError);
      return sendError(
        res,
        "Erro interno ao verificar colaborador",
        { details: checkError.message },
        500
      );
    }

    if (existingColaborador?.length > 0) {
      return sendError(res, "Colaborador já adicionado a este evento", {}, 400);
    }

    const { data, error: insertError } = await supabase
      .from("colaboradores_eventos")
      .insert([{ evento_id, usuario_id, permissao }])
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao inserir colaborador:", insertError);
      return sendError(
        res,
        "Erro ao adicionar colaborador",
        { details: insertError.message },
        500
      );
    }

    sendSuccess(res, "Colaborador adicionado com sucesso", data, 201);
  } catch (err) {
    console.error("Erro em adicionarColaborador:", err);
    sendError(
      res,
      "Erro ao adicionar colaborador",
      { details: err.message },
      500
    );
  }
};

exports.listarColaboradores = async (req, res) => {
  console.log("Entrou em listarColaboradores");
  try {
    const { id: evento_id } = req.params;
    const organizador_id = req.user.id;

    const { data: evento, error: eventoError } = await supabase
      .from("eventos")
      .select("id, organizador_id")
      .eq("id", evento_id)
      .eq("organizador_id", organizador_id)
      .single();

    if (eventoError || !evento) {
      return sendError(
        res,
        "Evento não encontrado ou você não é o organizador",
        {},
        404
      );
    }

    const { data, error } = await supabase
      .from("colaboradores_eventos")
      .select(
        `
        id,
        permissao,
        usuario:usuarios(id, nome, email)
      `
      )
      .eq("evento_id", evento_id);

    if (error) {
      return sendError(
        res,
        "Erro ao listar colaboradores",
        { details: error.message },
        500
      );
    }

    sendSuccess(res, "Colaboradores listados com sucesso", data, 200);
  } catch (err) {
    console.error("Erro em listarColaboradores:", err);
    sendError(
      res,
      "Erro ao listar colaboradores",
      { details: err.message },
      500
    );
  }
};

exports.promoverOrganizador = async (req, res) => {
  console.log("Entrou em promoverOrganizador");
  try {
    const { usuario_id } = req.body;

    if (!usuario_id) {
      return sendError(res, "Campo obrigatório: usuario_id", {}, 400);
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id, is_organizador")
      .eq("id", usuario_id)
      .single();

    if (usuarioError || !usuario) {
      return sendError(res, "Usuário não encontrado", {}, 404);
    }

    if (usuario.is_organizador) {
      return sendError(res, "Usuário já é organizador", {}, 400);
    }

    const { data: promovido, error } = await supabase
      .from("usuarios")
      .update({ is_organizador: true })
      .eq("id", usuario_id)
      .select("id, nome, email, is_organizador")
      .single();

    if (error) {
      return sendError(
        res,
        "Erro ao promover usuário",
        { details: error.message },
        500
      );
    }

    sendSuccess(
      res,
      "Usuário promovido a organizador com sucesso",
      { usuario: promovido },
      200
    );
  } catch (err) {
    console.error("Erro em promoverOrganizador:", err);
    sendError(res, "Erro ao promover usuário", { details: err.message }, 500);
  }
};
