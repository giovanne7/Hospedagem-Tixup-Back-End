const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

try {
  if (!admin.apps.length) {
    const serviceAccount = require(path.resolve(
      __dirname,
      "../../firebase-adminsdk.json"
    ));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("🔥 Firebase Admin SDK iniciado com service account");
  }
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase Admin:", error.message);
}

module.exports = admin;
