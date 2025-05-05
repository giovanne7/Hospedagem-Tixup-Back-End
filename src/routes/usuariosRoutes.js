const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const { autoPromover } = require("../controllers/usuariosController");

router.put(
  "/tornar-organizador",
  authMiddleware,
  (req, res, next) => {
    // #swagger.tags = ['Usuários']
    // #swagger.summary = 'Promove o usuário autenticado a organizador'
    // #swagger.description = 'Essa rota permite que um usuário comum ative o modo organizador.'
    // #swagger.security = [{ "bearerAuth": [] }]
    // #swagger.responses[200] = {
    //   description: 'Usuário promovido com sucesso',
    //   schema: {
    //     success: true,
    //     message: "Usuário promovido a organizador com sucesso",
    //     data: {
    //       usuario: {
    //         id: "uuid",
    //         nome: "João das Couves",
    //         email: "joao@email.com",
    //         is_organizador: true
    //       }
    //     }
    //   }
    // }
    // #swagger.responses[400] = {
    //   description: 'Usuário já é organizador'
    // }
    // #swagger.responses[401] = {
    //   description: 'Token JWT ausente ou inválido'
    // }
    // #swagger.responses[500] = {
    //   description: 'Erro interno ao promover'
    // }
    next();
  },
  autoPromover
);

module.exports = router;
