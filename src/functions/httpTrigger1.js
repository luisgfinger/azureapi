const { app } = require("@azure/functions");
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
const sendgrid = require("@sendgrid/mail");

const keyVaultName = "luisfingerkeyvault";
const keyVaultUrl = `https://${keyVaultName}.vault.azure.net`;

const credential = new DefaultAzureCredential();
const client = new SecretClient(keyVaultUrl, credential);

async function getSendGridApiKey() {
  const secret = await client.getSecret("valutkey");
  return secret.value;
}

app.http("httpTriggerEmail", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.res = {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    };

    if (request.method === "OPTIONS") {
      context.res.status = 204; 
      return;
    }

    try {
      const { userEmail, text } = await request.json();

      const msgToYou = {
        to: "lggfinger@minha.fag.edu.br",
        from: "lggfinger@minha.fag.edu.br",
        subject: "Contato via site",
        text: `Você recebeu uma mensagem de ${userEmail}:\n\n${text}`,
        replyTo: userEmail,
      };

      const msgToSender = {
        to: userEmail,
        from: "lggfinger@minha.fag.edu.br",
        subject: "Confirmação de recebimento",
        text: `Olá,\n\nRecebemos sua mensagem e entraremos em contato em breve.\n\nResumo do seu e-mail:\n${text}\n\nAtenciosamente,\nEquipe Auto Posto Grando`,
      };

      const sendGridApiKey = await getSendGridApiKey();
      sendgrid.setApiKey(sendGridApiKey);

      await sendgrid.send(msgToYou);

      await sendgrid.send(msgToSender);

      context.log("E-mails enviados com sucesso!");
      context.res.status = 200;
      context.res.body = "E-mails enviados com sucesso!";
    } catch (error) {
      context.log("Erro ao enviar os e-mails:", error);
      context.res.status = 500;
      context.res.body = "Erro ao enviar os e-mails.";
    }
  },
});
