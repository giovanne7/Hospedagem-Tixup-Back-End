require("dotenv").config();
const app = require('../app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
  console.log(
    `Documentação Swagger disponível em http://localhost:${PORT}/api-docs`
  );
});
