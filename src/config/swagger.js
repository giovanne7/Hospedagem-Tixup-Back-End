const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
  info: {
    title: "TixUp API",
    description: "API para gerenciamento de eventos e ingressos",
  },
  host: "localhost:5000",
  basePath: "",
  schemes: ["http"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Token JWT no formato: Bearer <token>",
    },
  },
  security: [{ bearerAuth: [] }],
  components: {
    schemas: {
      Usuario: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nome: { type: "string" },
          email: { type: "string", format: "email" },
          tipo: { type: "string", enum: ["usuario", "organizador"] },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Evento: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          nome: { type: "string" },
          descricao: { type: "string" },
          data: { type: "string", format: "date" },
          local: { type: "string" },
          preco: { type: "number" },
          imagem: { type: "string" },
          publico: { type: "boolean" },
          categoria: { type: "string" },
          organizador_id: { type: "string", format: "uuid" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Notificacao: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          usuario_id: { type: "string", format: "uuid" },
          tipo: { type: "string" },
          mensagem: { type: "string" },
          titulo: { type: "string" },
          data_criacao: { type: "string", format: "date-time" },
          lida: { type: "boolean" },
          status: { type: "string" },
          evento_id: { type: "string", format: "uuid" },
        },
      },
    },
  },
};

const outputFile = './src/config/swagger-output.json';
const endpointsFiles = ['./app.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('✅ Swagger JSON gerado com sucesso!');
});