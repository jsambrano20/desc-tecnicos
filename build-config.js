// Roda na Vercel antes do deploy e gera o config.js com a URL do app.
// Ordem de prioridade:
//   1) variável de ambiente APP_URL (defina em Vercel > Settings > Environment Variables)
//   2) domínio de produção que a própria Vercel informa (VERCEL_PROJECT_PRODUCTION_URL)
//   3) mantém o config.js do repositório (o app usa o endereço atual se APP_URL ficar vazio)
const fs = require("fs");
const path = require("path");

let url = (process.env.APP_URL || "").trim();
if (!url && process.env.VERCEL_PROJECT_PRODUCTION_URL) url = "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL;
url = url.replace(/\/+$/, "");
if (url && !/^https?:\/\//.test(url)) url = "https://" + url;

if (url) {
  const out = `// Gerado por build-config.js — não edite aqui; use a variável APP_URL na Vercel.\nconst APP_URL = ${JSON.stringify(url)};\n`;
  fs.writeFileSync(path.join(__dirname, "config.js"), out);
  console.log("config.js gerado com APP_URL =", url);
} else {
  console.log("Nenhuma URL definida; mantendo config.js atual.");
}
