const admin = require("../config/firebase");
const {
  gerarTokenJWT,
  gerarRefreshToken,
  hashSenha,
  verificarSenha,
} = require("../services/authService");
const supabase = require("../config/supabaseClient");
const { sendSuccess, sendError } = require("../utils/responseFormatter");

exports.loginFirebase = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return sendError(res, "Token do Firebase é obrigatório", {}, 400);
    }

    // 🔒 Verifica token com Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    if (!email) {
      return sendError(res, "Email não encontrado no token", {}, 400);
    }

    // 🔍 Busca no Supabase
    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();

    let user;

    if (error || !usuario) {
      // 🧠 Busca dados do usuário via Firebase (caso novo)
      const firebaseUser = await admin.auth().getUser(uid);
      const nome = firebaseUser.displayName || "Usuário Google";

      // 🆕 Insere no Supabase
      const { data, error: insertError } = await supabase
        .from("usuarios")
        .insert([{ nome, email, senha: "", tipo: "usuario" }])
        .select()
        .single();

      if (insertError) {
        return sendError(
          res,
          "Erro ao criar usuário",
          { details: insertError.message },
          500
        );
      }

      user = data;
    } else {
      const { data: usuarioAtualizado, error: refreshError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", email)
        .single();

      if (refreshError || !usuarioAtualizado) {
        return sendError(res, "Erro ao buscar usuário atualizado", {}, 500);
      }

      user = usuarioAtualizado;
      console.log("🔥 Usuario retornado:", user);
    }

    // 🔐 Geração de tokens
    const token = gerarTokenJWT(user);
    const refreshToken = gerarRefreshToken(user);

    return sendSuccess(
      res,
      "Login realizado com sucesso",
      { token, refreshToken, usuario: user },
      200
    );
  } catch (err) {
    console.error("❌ Erro no loginFirebase:", err);
    return sendError(
      res,
      "Erro ao realizar login",
      { details: err.message },
      500
    );
  }
};

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return sendError(res, "Email e senha são obrigatórios", {}, 400);
    }

    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !usuario) {
      return sendError(res, "Email ou senha inválidos", {}, 401);
    }

    const senhaValida = await verificarSenha(senha, usuario.senha);
    if (!senhaValida) {
      return sendError(res, "Email ou senha inválidos", {}, 401);
    }

    const token = gerarTokenJWT(usuario);
    const refreshToken = gerarRefreshToken(usuario);
    sendSuccess(
      res,
      "Login realizado com sucesso",
      { token, refreshToken, usuario },
      200
    );
  } catch (err) {
    sendError(res, "Erro ao realizar login", { details: err.message }, 500);
  }
};

exports.cadastro = async (req, res) => {
  try {
    const {
      nome,
      email,
      senha,
      tipo,
      cpf,
      telefone,
      endereco,
      datanascimento,
    } = req.body;

    if (!nome || !email || !senha || !tipo) {
      return sendError(
        res,
        "Todos os campos são obrigatórios: nome, email, senha e tipo",
        {},
        400
      );
    }

    if (!["usuario", "organizador"].includes(tipo)) {
      return sendError(
        res,
        "Tipo de usuário inválido. Use 'usuario' ou 'organizador'",
        {},
        400
      );
    }

    const { data: usuarioExistente, error: checkError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      return sendError(
        res,
        "Erro ao verificar usuário",
        { details: checkError.message },
        500
      );
    }

    if (usuarioExistente) {
      return sendError(res, "Email já cadastrado", {}, 400);
    }

    const senhaHash = await hashSenha(senha);

    const { data: novoUsuario, error: insertError } = await supabase
      .from("usuarios")
      .insert([
        {
          nome,
          email,
          senha: senhaHash,
          tipo,
          cpf,
          telefone,
          endereco,
          datanascimento,
        },
      ])
      .select()
      .single();

    if (insertError) {
      return sendError(
        res,
        "Erro ao criar usuário",
        { details: insertError.message },
        500
      );
    }

    if (!novoUsuario) {
      return sendError(
        res,
        "Não foi possível obter os dados do usuário após a criação",
        {},
        500
      );
    }

    const token = gerarTokenJWT(novoUsuario);
    const refreshToken = gerarRefreshToken(novoUsuario);
    sendSuccess(
      res,
      "Usuário criado com sucesso",
      { token, refreshToken, usuario: novoUsuario },
      201
    );
  } catch (err) {
    sendError(res, "Erro ao realizar cadastro", { details: err.message }, 500);
  }
};
