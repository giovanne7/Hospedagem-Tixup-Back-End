import dotenv from 'dotenv';
import app from '../app'; // ajuste o caminho conforme necessário

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Servidor ativo na porta ${PORT}`);
  console.log(`📄 Documentação Swagger: http://localhost:${PORT}/api-docs`);
});
