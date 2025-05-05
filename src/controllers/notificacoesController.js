const supabase = require("../config/supabaseClient");
const admin = require("../config/firebase");
const { sendSuccess, sendError } = require("../utils/responseFormatter");

// Registrar token push para usuário autenticado
exports.registrarToken = async (req, res) => {
  try {
    const { token_push } = req.body;
    const usuario_id = req.user.id;

    if (!token_push) {
      return sendError(res, "O campo token_push é obrigatório", {}, 400);
    }

    const { data: existingToken, error: checkError } = await supabase
      .from("dispositivos_push")
      .select("id")
      .eq("usuario_id", usuario_id)
      .eq("token_push", token_push);
    if (checkError)
      console.error("Erro ao verificar token existente:", checkError);

    if (existingToken && existingToken.length > 0) {
      return sendSuccess(res, "Token já registrado", {}, 200);
    }

    const { data, error: insertError } = await supabase
      .from("dispositivos_push")
      .insert([{ usuario_id, token_push }])
      .select()
      .single();
    if (insertError) {
      return sendError(
        res,
        "Erro ao registrar token",
        { details: insertError.message },
        500
      );
    }

    return sendSuccess(res, "Token registrado com sucesso", data, 201);
  } catch (err) {
    console.error("Erro em registrarToken:", err);
    return sendError(
      res,
      "Erro ao registrar token",
      { details: err.message },
      500
    );
  }
};

// Função interna: envia push de forma não bloqueante
async function enviarPush(usuario_id, titulo, mensagem) {
  try {
    const { data: dispositivos, error: errDis } = await supabase
      .from("dispositivos_push")
      .select("token_push")
      .eq("usuario_id", usuario_id);
    if (errDis) {
      console.error("Erro ao buscar dispositivos:", errDis);
      return;
    }
    if (!dispositivos || dispositivos.length === 0) return;

    const tokens = dispositivos.map((d) => d.token_push);
    const message = { notification: { title: titulo, body: mensagem }, tokens };
    const resp = await admin.messaging().sendEachForMulticast(message);

    // remove tokens que falharam
    if (resp.failureCount > 0) {
      const failed = resp.responses
        .map((r, i) => (!r.success ? tokens[i] : null))
        .filter(Boolean);
      await supabase
        .from("dispositivos_push")
        .delete()
        .in("token_push", failed);
    }
  } catch (err) {
    console.error("FCM error:", err);
  }
}

// Envia notificação para todos usuários de um evento
exports.enviarNotificacaoPorEvento = async (req, res) => {
  try {
    const { evento_id, titulo, mensagem } = req.body;
    const organizador_id = req.user.id;

    if (!evento_id || !titulo || !mensagem) {
      return sendError(
        res,
        "Campos obrigatórios: evento_id, titulo, mensagem",
        {},
        400
      );
    }

    // Verifica evento e organizador
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

    // Recupera usuários do evento
    const { data: ingressos, error: ingressosError } = await supabase
      .from("ingressos")
      .select("usuario_id")
      .eq("evento_id", evento_id);
    if (ingressosError || !ingressos || ingressos.length === 0) {
      return sendError(
        res,
        "Nenhum usuário encontrado para este evento",
        {},
        404
      );
    }
    const usuarios = [...new Set(ingressos.map((i) => i.usuario_id))];

    let successCount = 0;
    for (const usuario_id of usuarios) {
      // Insere no banco
      const { error: notiError } = await supabase.from("notificacoes").insert([
        {
          usuario_id,
          tipo: "push",
          titulo,
          mensagem,
          evento_id,
          data_criacao: new Date().toISOString(),
          lida: false,
          status: "pendente",
        },
      ]);
      if (!notiError) successCount++;

      // Dispara push assíncrono
      enviarPush(usuario_id, titulo, mensagem);
    }

    return sendSuccess(
      res,
      `Notificação enviada para ${successCount} de ${usuarios.length} usuários`,
      {},
      200
    );
  } catch (err) {
    console.error("Erro em enviarNotificacaoPorEvento:", err);
    return sendError(
      res,
      "Erro ao enviar notificação",
      { details: err.message },
      500
    );
  }
};

// Envia notificação para um usuário específico
exports.enviarNotificacaoParaUsuario = async (req, res) => {
  try {
    const { usuario_id, titulo, mensagem } = req.body;

    if (!usuario_id || !titulo || !mensagem) {
      return sendError(
        res,
        "Campos obrigatórios: usuario_id, titulo, mensagem",
        {},
        400
      );
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", usuario_id)
      .single();
    if (usuarioError || !usuario) {
      return sendError(res, "Usuário não encontrado", {}, 404);
    }

    // Insere no banco
    const { error: notiError } = await supabase.from("notificacoes").insert([
      {
        usuario_id,
        tipo: "push",
        titulo,
        mensagem,
        evento_id: null,
        data_criacao: new Date().toISOString(),
        lida: false,
        status: "pendente",
      },
    ]);
    if (notiError) {
      return sendError(
        res,
        "Erro ao enviar notificação",
        { details: notiError.message },
        500
      );
    }

    // Dispara push sem aguardar resposta
    enviarPush(usuario_id, titulo, mensagem);

    return sendSuccess(res, "Notificação enviada com sucesso", {}, 200);
  } catch (err) {
    console.error("Erro em enviarNotificacaoParaUsuario:", err);
    return sendError(
      res,
      "Erro ao enviar notificação",
      { details: err.message },
      500
    );
  }
};

// Lista notificações do usuário autenticado
exports.listarNotificacoesUsuario = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const { lida, evento_id } = req.query;

    let query = supabase
      .from("notificacoes")
      .select(
        `
        id,
        tipo,
        mensagem,
        titulo,
        data_criacao,
        lida,
        status,
        evento_id,
        eventos(nome, data, local)
      `
      )
      .eq("usuario_id", usuario_id)
      .order("data_criacao", { ascending: false });

    if (lida !== undefined) {
      query = query.eq("lida", lida === "true");
    }
    if (evento_id) {
      query = query.eq("evento_id", evento_id);
    }

    const { data, error } = await query;
    if (error) {
      return sendError(
        res,
        "Erro ao listar notificações",
        { details: error.message },
        500
      );
    }
    return sendSuccess(res, "Notificações listadas com sucesso", data, 200);
  } catch (err) {
    console.error("Erro em listarNotificacoesUsuario:", err);
    return sendError(
      res,
      "Erro ao listar notificações",
      { details: err.message },
      500
    );
  }
};
