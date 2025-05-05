const request = require("supertest");
const app = require("../app");
const supabase = require("../src/config/supabaseClient");

describe("Eventos Endpoints", () => {
  const emailOrg = `organizador_${Date.now()}@tixup.com`;
  const emailCliente = `cliente_${Date.now()}@tixup.com`;
  const senhaOrg = "123456";
  let tokenOrganizador, tokenCliente, eventoId;

  beforeAll(async () => {
    const cadastroOrg = await request(app).post("/api/auth/cadastro").send({
      nome: "Organizador Teste",
      email: emailOrg,
      senha: senhaOrg,
      tipo: "organizador",
    });

    if (cadastroOrg.statusCode !== 201) {
      console.error("❌ Erro ao cadastrar organizador:", cadastroOrg.body);
      throw new Error("Falha ao cadastrar organizador");
    }

    await supabase
      .from("usuarios")
      .update({ is_organizador: true })
      .eq("email", emailOrg);

    const loginOrg = await request(app).post("/api/auth/login").send({
      email: emailOrg,
      senha: senhaOrg,
    });

    if (!loginOrg.body.data.token) {
      console.error("❌ Erro no login:", loginOrg.body);
      throw new Error("Login falhou");
    }

    tokenOrganizador = loginOrg.body.data.token;

    const cadastroCliente = await request(app).post("/api/auth/cadastro").send({
      nome: "Cliente Teste",
      email: emailCliente,
      senha: senhaOrg,
      tipo: "usuario",
    });

    const loginCliente = await request(app).post("/api/auth/login").send({
      email: emailCliente,
      senha: senhaOrg,
    });

    tokenCliente = loginCliente.body.data.token;

    const evento = await request(app)
      .post("/api/eventos")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        nome: "Evento de Teste",
        descricao: "Evento criado para teste",
        data: "2025-12-31",
        local: "Centro de Eventos",
        preco: 100,
        imagem: "https://imagem.com/evento.jpg",
        publico: true,
        categoria: "show",
      });

    eventoId = evento.body.data.id;

    await request(app)
      .post("/api/ingressos/comprar")
      .set("Authorization", `Bearer ${tokenCliente}`)
      .send({ eventoId });
  }, 15000);

  afterAll(async () => {
    await supabase.from("ingressos").delete().eq("evento_id", eventoId);
    await supabase.from("eventos").delete().eq("id", eventoId);
    await supabase.from("usuarios").delete().eq("email", emailOrg);
    await supabase.from("usuarios").delete().eq("email", emailCliente);
  });

  it("deve listar eventos públicos sem autenticação", async () => {
    const res = await request(app).get("/api/eventos");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Eventos públicos listados com sucesso");
    expect(Array.isArray(res.body.data)).toBe(true);
  }, 10000);

  it("deve listar eventos públicos com filtro por categoria", async () => {
    await request(app)
      .post("/api/eventos")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        nome: "Evento de Teste 2",
        descricao: "Outro evento para teste",
        data: "2025-12-31",
        local: "Centro de Eventos 2",
        preco: 150,
        imagem: "https://imagem.com/evento2.jpg",
        publico: true,
        categoria: "palestra",
      });

    const res = await request(app).get("/api/eventos?categoria=show");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Eventos públicos listados com sucesso");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((evento) => evento.categoria === "show")).toBe(
      true
    );
  }, 10000);

  it("deve listar eventos públicos com filtro por data", async () => {
    const res = await request(app).get("/api/eventos?data=2025-12-31");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Eventos públicos listados com sucesso");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.every((evento) => evento.data === "2025-12-31")).toBe(
      true
    );
  }, 10000);

  it("não deve listar eventos com data inválida", async () => {
    const res = await request(app).get("/api/eventos?data=2025-13-01");

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "O campo data deve estar no formato YYYY-MM-DD"
    );
    expect(res.body.error).toHaveProperty("code", "BAD_REQUEST");
    expect(res.body.error).toHaveProperty(
      "details",
      "Nenhum detalhe adicional disponível"
    );
    expect(res.body.error).toHaveProperty(
      "suggestion",
      "Verifique os dados enviados e tente novamente."
    );
  }, 10000);

  it("deve criar evento com organizador autenticado", async () => {
    const res = await request(app)
      .post("/api/eventos")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        nome: "Festival de Teste",
        descricao: "Evento criado via teste automatizado",
        data: "2025-12-31",
        local: "Centro de Eventos Teste",
        preco: 80,
        imagem: "https://imagem.com/evento.jpg",
        publico: true,
        categoria: "festival",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Evento criado com sucesso");
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.nome).toBe("Festival de Teste");
    expect(res.body.data.categoria).toBe("festival");
  }, 10000);

  it("não deve criar evento sem campos obrigatórios", async () => {
    const res = await request(app)
      .post("/api/eventos")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        nome: "Evento Incompleto",
        data: "2025-12-31",
        local: "Local",
        preco: 50,
        // publico ausente
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Campos obrigatórios: nome, data, local, preco, publico"
    );
    expect(res.body.error).toHaveProperty("code", "BAD_REQUEST");
    expect(res.body.error).toHaveProperty(
      "suggestion",
      "Verifique os dados enviados e tente novamente."
    );
  }, 10000);

  it("não deve criar evento com imagem inválida", async () => {
    const res = await request(app)
      .post("/api/eventos")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        nome: "Evento Inválido",
        descricao: "Evento com imagem inválida",
        data: "2025-12-31",
        local: "Local",
        preco: 50,
        imagem: "imagem-invalida",
        publico: true,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("O campo imagem deve ser uma URL válida");
    expect(res.body.error).toHaveProperty("code", "BAD_REQUEST");
  }, 10000);

  it("deve listar eventos do organizador logado", async () => {
    const res = await request(app)
      .get("/api/eventos/meus-eventos")
      .set("Authorization", `Bearer ${tokenOrganizador}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe(
      "Eventos do organizador listados com sucesso"
    );
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty("nome");
    expect(res.body.data[0]).toHaveProperty("descricao");
    expect(res.body.data[0]).toHaveProperty("categoria");
  }, 10000);

  it("deve deletar um evento do organizador autenticado", async () => {
    const criar = await request(app)
      .post("/api/eventos")
      .set("Authorization", `Bearer ${tokenOrganizador}`)
      .send({
        nome: "Evento para deletar",
        descricao: "Esse será deletado no teste",
        data: "2026-01-01",
        local: "Local do evento",
        preco: 50,
        imagem: "https://imagem.com/deletar.jpg",
        publico: false,
        categoria: "teste",
      });

    const eventoIdDel = criar.body.data.id;
    expect(criar.statusCode).toBe(201);
    expect(eventoIdDel).toBeDefined();

    const del = await request(app)
      .delete(`/api/eventos/${eventoIdDel}`)
      .set("Authorization", `Bearer ${tokenOrganizador}`);

    expect(del.statusCode).toBe(204);

    const confirmar = await request(app)
      .get("/api/eventos/meus-eventos")
      .set("Authorization", `Bearer ${tokenOrganizador}`);

    const existe = confirmar.body.data.find((e) => e.id === eventoIdDel);
    expect(existe).toBeUndefined();
  }, 10000);

  it("deve listar vendas de um evento para o organizador", async () => {
    const res = await request(app)
      .get(`/api/eventos/${eventoId}/vendas`)
      .set("Authorization", `Bearer ${tokenOrganizador}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Vendas listadas com sucesso");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty("id");
    expect(res.body.data[0]).toHaveProperty("nome_comprador");
    expect(res.body.data[0]).toHaveProperty("data_compra");
    expect(res.body.data[0]).toHaveProperty("status");
  }, 10000);

  it("não deve listar vendas para usuário não organizador", async () => {
    const res = await request(app)
      .get(`/api/eventos/${eventoId}/vendas`)
      .set("Authorization", `Bearer ${tokenCliente}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      "Apenas organizadores podem acessar esta rota"
    );
    expect(res.body.error).toHaveProperty("code", "FORBIDDEN");
    expect(res.body.error).toHaveProperty(
      "suggestion",
      "Você não tem permissão para realizar esta ação. Entre em contato com o administrador."
    );
  }, 10000);

  it("não deve listar vendas para evento inexistente", async () => {
    const res = await request(app)
      .get("/api/eventos/inexistente/vendas")
      .set("Authorization", `Bearer ${tokenOrganizador}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Evento não encontrado");
    expect(res.body.error).toHaveProperty("code", "NOT_FOUND");
    expect(res.body.error).toHaveProperty(
      "suggestion",
      "Verifique se o recurso existe ou se o ID está correto."
    );
  }, 10000);
});
