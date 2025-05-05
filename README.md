O TixUp Backend é a API REST desenvolvida com Node.js e Express, responsável por gerenciar a autenticação, cadastro de usuários, criação e gerenciamento de eventos e ingressos. O projeto utiliza PostgreSQL (via Supabase ou Docker) como banco de dados e implementa autenticação segura com JWT e Firebase Authentication.

Funcionalidades:
- Autenticação de usuários via Google OAuth, Apple e Email/Senha.
- Gerenciamento de usuários, eventos e ingressos.
- API estruturada com controllers, services, models e routes.
- Middleware global para logs de requisições.
- Variáveis de ambiente configuradas para maior segurança.
