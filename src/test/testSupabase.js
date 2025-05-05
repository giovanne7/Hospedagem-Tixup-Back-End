const supabase = require("./config/supabaseClient");

async function testConnection() {
  const { data, error } = await supabase.from("usuarios").select("*");
  if (error) console.error("Erro ao buscar usuários:", error);
  else console.log("Usuários:", data);
}

testConnection();
