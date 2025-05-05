const request = require("supertest");
const app = require("../app");
const supabase = require("../src/config/supabaseClient");

let tokenCliente;
let eventoId;
const clienteEmail = `cliente-${Date.now()}@tixup.com`;
const organizadorEmail = `organizador-${Date.now()}@tixup.com`;
const clienteSenha = "markencrypted";

describe("Ingressos Endpoints", () => {
  beforeAll(async () => {
    const cadastroOrg = await request(app).post("/api/auth/cadastro").send({
      nome: "Organizador Teste",
      email: organizadorEmail,
      senha: clienteSenha,
      tipo: "organizador",
    });

    await supabase
      .from("usuarios")
      .update({ is_organizador: true })
      .eq("email", organizadorEmail);

    if (cadastroOrg.statusCode !== 201) {
      console.error("❌ Falha ao cadastrar organizador:", cadastroOrg.body);
      throw new Error("Erro ao cadastrar organizador");
    }

    const loginOrg = await request(app).post("/api/auth/login").send({
      email: organizadorEmail,
      senha: clienteSenha,
    });

    if (loginOrg.statusCode !== 200) {
      console.error("❌ Falha no login do organizador:", loginOrg.body);
      throw new Error("Login do organizador falhou");
    }

    const tokenOrganizador = loginOrg.body.data.token;

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

    if (evento.statusCode !== 201) {
      console.error("❌ Falha ao criar evento:", evento.body);
      throw new Error("Erro ao criar evento");
    }

    eventoId = evento.body.data.id;

    const cadastro = await request(app).post("/api/auth/cadastro").send({
      nome: "Cliente Teste",
      email: clienteEmail,
      senha: clienteSenha,
      tipo: "usuario",
    });

    if (
      cadastro.statusCode !== 201 &&
      cadastro.body?.error !== "Email já cadastrado"
    ) {
      console.error("❌ Falha no cadastro:", cadastro.body);
      throw new Error("Erro ao cadastrar usuario");
    }

    const login = await request(app).post("/api/auth/login").send({
      email: clienteEmail,
      senha: clienteSenha,
    });

    if (login.statusCode !== 200) {
      console.error("❌ Falha no login do cliente:", login.body);
      throw new Error("Login do cliente falhou");
    }

    tokenCliente = login.body.data.token;

    if (!tokenCliente) {
      console.error("❌ Token do cliente não encontrado:", login.body);
      throw new Error("Login falhou");
    }
  }, 15000);

  afterAll(async () => {
    await supabase.from("ingressos").delete().eq("evento_id", eventoId);
    await supabase.from("eventos").delete().eq("id", eventoId);
    await supabase.from("usuarios").delete().eq("email", clienteEmail);
    await supabase.from("usuarios").delete().eq("email", organizadorEmail);
  });

  it("deve permitir que um usuario compre um ingresso", async () => {
    const res = await request(app)
      .post("/api/ingressos/comprar")
      .set("Authorization", `Bearer ${tokenCliente}`)
      .send({ eventoId });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Ingresso comprado com sucesso");
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data).toHaveProperty("evento_id", eventoId);
    expect(res.body.data).toHaveProperty("status", "pendente");
    expect(res.body.data).toHaveProperty("preco");
    expect(res.body.data).toHaveProperty("tipo");
  }, 10000);

  it("não deve permitir compra com eventoId inválido (não UUID)", async () => {
    const res = await request(app)
      .post("/api/ingressos/comprar")
      .set("Authorization", `Bearer ${tokenCliente}`)
      .send({ eventoId: "invalid-uuid" });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("O campo eventoId deve ser um UUID válido");
    expect(res.body.error).toHaveProperty("code", "BAD_REQUEST");
    expect(res.body.error).toHaveProperty(
      "suggestion",
      "Verifique os dados enviados e tente novamente."
    );
  }, 10000);

  it("deve listar os ingressos do cliente autenticado", async () => {
    const res = await request(app)
      .get("/api/ingressos/meus")
      .set("Authorization", `Bearer ${tokenCliente}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Ingressos listados com sucesso");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0]).toHaveProperty("evento_id");
    expect(res.body.data[0]).toHaveProperty("status");
    expect(res.body.data[0]).toHaveProperty("tipo");
    expect(res.body.data[0]).toHaveProperty("preco");
    expect(res.body.data[0]).toHaveProperty("eventos");
  }, 10000);
});
