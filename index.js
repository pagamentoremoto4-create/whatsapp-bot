const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const axios = require("axios");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { qr, connection } = update;

    if (qr) {
      console.log("📲 ESCANEIE O QR:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ WhatsApp conectado!");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg.message) return;

    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (!texto) return;

    if (texto.toLowerCase().includes("pagar")) {
      try {
        const resposta = await axios.get("https://pix-api-z6a5.onrender.com/pix");

        const pix = resposta.data.copiaecola;

        await sock.sendMessage(msg.key.remoteJid, {
          text: `💰 Pagamento: R$50

📲 PIX Copia e Cola:
${pix}

⚡ Após o pagamento, envio automático!`
        });

      } catch (erro) {
        console.log("Erro ao gerar PIX", erro);
      }
    }
  });
}

startBot();
