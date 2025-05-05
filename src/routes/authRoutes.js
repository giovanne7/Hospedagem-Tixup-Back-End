const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post(
  "/cadastro",
  (req, res, next) => {
    // #swagger.tags = ['Autenticação']
    // #swagger.summary = 'Cadastro de novo usuário'
    // #swagger.description = 'Cria um novo usuário com os dados fornecidos'
    /* #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["nome", "email", "senha", "tipo"],
            properties: {
              nome: { type: "string", example: "Maria Silva" },
              email: { type: "string", format: "email", example: "maria@exemplo.com" },
              senha: { type: "string", format: "password", example: "Senha@123" },
              is_organizador: { type: "boolean", example: false }
              cpf: { type: "string", example: "123.456.789-00" },
              telefone: { type: "string", example: "(11) 91234-5678" },
              endereco: { type: "string", example: "Rua das Flores, 123" },
              datanascimento: { type: "string", format: "date", example: "1990-05-01" }
            }
          }
        }
      }
    } */
    // #swagger.responses[201] = { description: 'Usuário criado com sucesso' }
    // #swagger.responses[400] = { description: 'Erro de validação ou email já existente' }
    // #swagger.responses[500] = { description: 'Erro interno ao cadastrar' }
    next();
  },
  authController.cadastro
);

router.post(
  "/login",
  (req, res, next) => {
    // #swagger.tags = ['Autenticação']
    // #swagger.summary = 'Login com email e senha'
    // #swagger.description = 'Realiza login de usuário já cadastrado'
    /* #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "senha"],
            properties: {
              email: { type: "string", example: "maria@exemplo.com" },
              senha: { type: "string", example: "Senha@123" }
            }
          }
        }
      }
    } */
    // #swagger.responses[200] = { description: 'Login realizado com sucesso' }
    // #swagger.responses[401] = { description: 'Credenciais inválidas' }
    // #swagger.responses[500] = { description: 'Erro interno ao fazer login' }
    next();
  },
  authController.login
);

router.post(
  "/login-firebase",
  (req, res, next) => {
    // #swagger.tags = ['Autenticação']
    // #swagger.summary = 'Login com Firebase'
    // #swagger.description = 'Faz login ou cria usuário com token do Firebase'
    /* #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["idToken"],
            properties: {
              idToken: { type: "string", example: "eyJhbGciOiJSUzI1NiIsIn..." }
            }
          }
        }
      }
    } */
    // #swagger.responses[200] = { description: 'Login Firebase com sucesso' }
    // #swagger.responses[400] = { description: 'Token Firebase ausente ou inválido' }
    // #swagger.responses[500] = { description: 'Erro interno ao logar via Firebase' }
    next();
  },
  authController.loginFirebase
);

module.exports = router;
