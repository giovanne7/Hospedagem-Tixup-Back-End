const sendSuccess = (res, message, data = {}, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message, error = {}, statusCode = 400) => {
  const errorResponse = {
    success: false,
    message,
    error: {
      code: getErrorCode(statusCode),
      details: error.details || "Nenhum detalhe adicional disponível",
      suggestion: getErrorSuggestion(statusCode, message),
    },
  };
  res.status(statusCode).json(errorResponse);
};

const getErrorCode = (statusCode) => {
  const codes = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    500: "INTERNAL_SERVER_ERROR",
  };
  return codes[statusCode] || "UNKNOWN_ERROR";
};

const getErrorSuggestion = (statusCode, message) => {
  const suggestions = {
    400: "Verifique os dados enviados e tente novamente.",
    401: "Faça login ou verifique suas credenciais.",
    403: "Você não tem permissão para realizar esta ação. Entre em contato com o administrador.",
    404: "Verifique se o recurso existe ou se o ID está correto.",
    500: "Ocorreu um erro no servidor. Tente novamente mais tarde ou contate o suporte.",
  };
  return suggestions[statusCode] || "Tente novamente ou contate o suporte.";
};

module.exports = { sendSuccess, sendError };