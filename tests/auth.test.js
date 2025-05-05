const request = require("supertest");
const app = require("../app");
const supabase = require("../src/config/supabaseClient");

describe("Auth Endpoints", () => {
  const testEmail = `pedrokatestador${Date.now()}@test.com`;
  const senha = "123456";

  afterAll(async () => {
    await supabase.from("usuarios").delete().eq("email", testEmail);
  });

  it("deve cadastrar um novo usuário", async () => {
    const res = await request(app).post("/api/auth/cadastro").send({
      nome: "Pedroka Teste",
      email: testEmail,
      senha,
      tipo: "organizador",
    });

    if (res.statusCode !== 201) {
      console.error("❌ Erro no cadastro:", res.body);
    }

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Usuário criado com sucesso");
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data).toHaveProperty("usuario");
    expect(res.body.data.usuario.email).toBe(testEmail);
  }, 10000);

  it("não deve cadastrar com email repetido", async () => {
    const res = await request(app).post("/api/auth/cadastro").send({
      nome: "Pedroka Repetido",
      email: testEmail,
      senha,
      tipo: "organizador",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email já cadastrado");
  }, 10000);

  it("deve fazer login com sucesso", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      senha,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Login realizado com sucesso");
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.usuario.email).toBe(testEmail);
  }, 10000);
});