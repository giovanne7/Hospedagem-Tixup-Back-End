const request = require("supertest");
const app = require("../app");
const supabase = require("../src/config/supabaseClient"); // Ajustado para o caminho correto

describe("Notificações Endpoints", () => {
  const emailOrganizador = `organizador_${Date.now()}@tixup.com`;
  const emailUsuario = `usuario_${Date.now()}@tixup.com`;
  const senha = "123456";
  let tokenOrganizador, tokenUsuario, usuarioId, eventoId;

  beforeAll(async () => {
    const cadastroOrg = await request(app).post("/api/auth/cadastro").send({
      nome: "Organizador Teste",
      email: emailOrganizador,
      senha,
      tipo: "organizador",
    });

    if (cadastroOrg.statusCode !== 201) {
      console.error("❌ Erro ao cadastrar organizador:", cadastroOrg.body);
      throw new Error("Falha ao cadastrar organizador");
    }

    await supabase
      .from("usuarios")
      .update({ is_organizador: true })
      .eq("email", emailOrganizador);

    const loginOrg = await request(app).post("/api/auth/login").send({
      email: emailOrganizador,
      senha,
    });

    tokenOrganizador = loginOrg.body.data.token;

    const evento = await request(app)
      .post("/api/eventos")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        nome: "Evento de Teste",
        descricao: "Evento para teste de notificações",
        data: "2025-12-31",
        local: "Centro de Eventos",
        preco: 100,
        imagem: "https://imagem.com/evento.jpg",
        publico: true,
        categoria: "show",
      });

    eventoId = evento.body.data.id;

    const cadastroUsuario = await request(app).post("/api/auth/cadastro").send({
      nome: "Usuário Teste",
      email: emailUsuario,
      senha,
      tipo: "usuario",
    });

    if (cadastroUsuario.statusCode !== 201) {
      console.error("❌ Erro ao cadastrar usuário:", cadastroUsuario.body);
      throw new Error("Falha ao cadastrar usuário");
    }

    const loginUsuario = await request(app).post("/api/auth/login").send({
      email: emailUsuario,
      senha,
    });

    if (!loginUsuario.body.data.token) {
      console.error("❌ Erro no login:", loginUsuario.body);
      throw new Error("Login falhou");
    }

    tokenUsuario = loginUsuario.body.data.token;
    usuarioId = loginUsuario.body.data.usuario.id;

    await request(app)
      .post("/api/ingressos/comprar")
      .set("Authorization", `Bearer ${tokenUsuario}`)
      .send({ eventoId });

    await request(app)
      .post("/api/notificacoes/token")
      .set("Authorization", `Bearer ${tokenUsuario}`)
      .send({ token_push: "fcm-token-exemplo-123" });
  }, 15000);

  afterAll(async () => {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", emailUsuario)
      .single();
    if (usuario) {
      await supabase
        .from("dispositivos_push")
        .delete()
        .eq("usuario_id", usuario.id);
      await supabase.from("notificacoes").delete().eq("usuario_id", usuario.id);
    }
    await supabase.from("ingressos").delete().eq("evento_id", eventoId);
    await supabase.from("eventos").delete().eq("id", eventoId);
    await supabase.from("usuarios").delete().eq("email", emailOrganizador);
    await supabase.from("usuarios").delete().eq("email", emailUsuario);
  });

  it("deve registrar um token de push notification", async () => {
    const res = await request(app)
      .post("/api/notificacoes/token")
      .set("Authorization", `Bearer ${tokenUsuario}`)
      .send({ token_push: "fcm-token-exemplo-456" });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Token registrado com sucesso");
    expect(res.body.data).toHaveProperty("usuario_id");
    expect(res.body.data).toHaveProperty("token_push", "fcm-token-exemplo-456");
  }, 10000);

  it("deve retornar mensagem para token já registrado", async () => {
    const res = await request(app)
      .post("/api/notificacoes/token")
      .set("Authorization", `Bearer ${tokenUsuario}`)
      .send({ token_push: "fcm-token-exemplo-123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Token já registrado");
  }, 10000);

  it("não deve registrar token sem token_push", async () => {
    const res = await request(app)
      .post("/api/notificacoes/token")
      .set("Authorization", `Bearer ${tokenUsuario}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("O campo token_push é obrigatório");
    expect(res.body.error).toHaveProperty("code", "BAD_REQUEST");
  }, 10000);

  it("não deve registrar token sem autenticação", async () => {
    const res = await request(app)
      .post("/api/notificacoes/token")
      .send({ token_push: "fcm-token-exemplo-456" });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Token não fornecido");
    expect(res.body.error).toHaveProperty("code", "UNAUTHORIZED");
  }, 10000);

  it("deve registrar notificação para usuários de um evento", async () => {
    const res = await request(app)
      .post("/api/notificacoes")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        evento_id: eventoId,
        titulo: "Evento Atualizado",
        mensagem: "Confira as novidades do evento!",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(
      /Notificação enviada para \d+ de \d+ usuários/
    );

    const { data: notificacoes } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("evento_id", eventoId);

    expect(notificacoes.length).toBeGreaterThan(0);
    expect(notificacoes[0].titulo).toBe("Evento Atualizado");
    expect(notificacoes[0].mensagem).toBe("Confira as novidades do evento!");
  }, 10000);

  it("deve registrar notificação para um usuário específico", async () => {
    const res = await request(app)
      .post("/api/notificacoes")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        usuario_id: usuarioId,
        titulo: "Bem-vindo",
        mensagem: "Obrigado por participar do evento!",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Notificação enviada com sucesso");

    const { data: notificacoes } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("titulo", "Bem-vindo");

    expect(notificacoes.length).toBeGreaterThan(0);
    expect(notificacoes[0].mensagem).toBe("Obrigado por participar do evento!");
  }, 10000);

  it("não deve enviar notificação sem campos obrigatórios", async () => {
    const res = await request(app)
      .post("/api/notificacoes")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        evento_id: eventoId,
        // titulo e mensagem ausentes
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Campos obrigatórios: evento_id, titulo, mensagem"
    );
    expect(res.body.error).toHaveProperty("code", "BAD_REQUEST");
  }, 10000);

  it("deve listar notificações do usuário autenticado", async () => {
    await request(app)
      .post("/api/notificacoes")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        usuario_id: usuarioId,
        titulo: "Teste Notificação",
        mensagem: "Notificação de teste",
      });

    const res = await request(app)
      .get("/api/notificacoes")
      .set("Authorization", `Bearer ${tokenUsuario}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Notificações listadas com sucesso");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty("titulo");
    expect(res.body.data[0]).toHaveProperty("mensagem");
    expect(res.body.data[0]).toHaveProperty("lida", false);
  }, 10000);

  it("deve listar notificações com filtro por lida", async () => {
    const res = await request(app)
      .get("/api/notificacoes?lida=false")
      .set("Authorization", `Bearer ${tokenUsuario}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every((notif) => notif.lida === false)).toBe(true);
  }, 10000);

  it("deve listar notificações com filtro por evento_id", async () => {
    const res = await request(app)
      .get(`/api/notificacoes?evento_id=${eventoId}`)
      .set("Authorization", `Bearer ${tokenUsuario}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every((notif) => notif.evento_id === eventoId)).toBe(
      true
    );
  }, 10000);
});
