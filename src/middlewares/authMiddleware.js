const jwt = require("jsonwebtoken");
const admin = require("../config/firebase");
const { sendError } = require("../utils/responseFormatter");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "Token não fornecido", {}, 401);
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Primeiro tenta verificar como ID token do Firebase
    const decodedFirebase = await admin.auth().verifyIdToken(token);
    req.user = {
      id: decodedFirebase.uid,
      email: decodedFirebase.email,
    };
    return next();
  } catch (errFirebase) {
    try {
      // Fallback para JWT do backend
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (errJwt) {
      return sendError(
        res,
        "Token inválido",
        {
          firebase: errFirebase.message,
          jwt: errJwt.message,
        },
        401
      );
    }
  }
};

module.exports = authMiddleware;
