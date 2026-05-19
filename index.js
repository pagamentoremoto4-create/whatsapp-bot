const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const axios = require("axios");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
    });

    sock.ev.on("creds.update", saveCreds);

    // 🔥 CONEXÃO + QR CODE
    sock.ev.on("connection.update", (update) => {
        const { connection, qr } = update;

        if (qr) {
            console.log("📱 Escaneie o QR abaixo:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("✅ Conectado ao WhatsApp!");
        }

        if (connection === "close") {
            console.log("❌ Conexão fechada...");
        }
    });

    // 💬 RECEBER MENSAGENS
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];

        if (!msg.message) return;

        const texto =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text;

        if (!texto) return;

        const from = msg.key.remoteJid;

        console.log("Mensagem:", texto);

        // 🔥 COMANDO PAGAR
        if (texto.toLowerCase().startsWith("pagar")) {
            const valor = texto.split(" ")[1] || "50";

            try {
                const resposta = await axios.post(
                    "https://pix-api-z6a5.onrender.com/pix",
                    {
                        valor: Number(valor),
                    }
                );

                const pix = resposta.data.copiaecola;

                await sock.sendMessage(from, {
                    text: `💰 Pagamento de R$${valor}\n\n🔑 PIX Copia e Cola:\n${pix}\n\n📲 Pague e aguarde confirmação!`,
                });
            } catch (err) {
                console.log(err);
                await sock.sendMessage(from, {
                    text: "❌ Erro ao gerar PIX",
                });
            }
        }
    });
}

startBot();
