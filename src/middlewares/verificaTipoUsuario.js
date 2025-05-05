const { sendError } = require("../utils/responseFormatter");

const verificaTipoUsuario = (papelEsperado) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Usuário não autenticado", {}, 401);
    }

    if (papelEsperado === "organizador" && !req.user.is_organizador) {
      return sendError(
        res,
        "Apenas organizadores podem acessar esta rota",
        {},
        403
      );
    }

    if (papelEsperado === "usuario" && req.user.is_organizador) {
      return sendError(
        res,
        "Organizadores não podem acessar esta rota de usuário",
        {},
        403
      );
    }

    next();
  };
};

module.exports = verificaTipoUsuario;
