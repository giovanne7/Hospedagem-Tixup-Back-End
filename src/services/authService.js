const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.gerarTokenJWT = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      is_organizador: usuario.is_organizador,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

exports.gerarRefreshToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      is_organizador: usuario.is_organizador,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

exports.hashSenha = async (senha) => {
  return await bcrypt.hash(senha, 10);
};

exports.verificarSenha = async (senha, hash) => {
  return await bcrypt.compare(senha, hash);
};
