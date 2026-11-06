# Perfil de Campo ⚽

> **Qual técnico pensa como você?**

Um quiz **só para diversão** que mapeia o seu jeito de ver o futebol em **12 fundamentos táticos** e mostra com quais técnicos, de lendas a nomes da atualidade, você tem mais afinidade.

🔗 **Jogue agora:** https://desc-tecnicos.vercel.app

## Como funciona

Você responde a afirmações numa escala de 5 pontos ("Concordo totalmente" … "Discordo totalmente"). Cada resposta empurra o seu perfil para um dos lados de um dos 12 fundamentos:

| # | Fundamento | Lado esquerdo | Lado direito |
|---|---|---|---|
| 1 | Posse × Jogo direto | Jogo direto | Posse de bola |
| 2 | Pressão alta × Bloco baixo | Bloco baixo | Pressão alta |
| 3 | Ataque × Defesa | Defesa | Ataque |
| 4 | Rigidez × Liberdade | Liberdade criativa | Rigidez tática |
| 5 | Jogo aéreo × Pelo chão | Jogo aéreo | Pelo chão |
| 6 | Time-base × Rotação | Time-base fixo | Rotação |
| 7 | Contratações × Base | Contratações | Base |
| 8 | Pelo meio × Pelos lados | Pelo meio | Pelos lados |
| 9 | Contra-ataque × Construção | Contra-ataque | Construção |
| 10 | Disciplina × Emoção | Disciplina | Liderança emocional |
| 11 | Linha recuada × Linha alta | Linha recuada | Linha alta |
| 12 | Resultado × Espetáculo | Resultado | Espetáculo |

No fim você recebe:

- um **rótulo** de estilo, formado pelos seus dois traços mais fortes (ex.: *Posicional Pressionador*);
- as **barras dos 12 fundamentos**, com o percentual de cada lado;
- os **técnicos mais compatíveis** (e o do outro extremo), com foto, % de afinidade e uma marca nas barras mostrando onde o técnico está;
- um **card para compartilhar** (imagem) com o resultado e o link do app.

### Três tamanhos de teste

| Modo | Perguntas | Tempo |
|---|---|---|
| Rápido | 24 | ~3 min |
| Médio | 48 | ~6 min |
| Completo | 72 | ~9 min |

### Cálculo da afinidade

Cada técnico tem uma posição de 0 a 100 em cada fundamento (em `data.js`). A afinidade é `100 − RMS(diferenças) × 1,25`, ou seja, quanto menor a distância média entre o seu perfil e o do técnico, maior o percentual.

> ⚠️ As posições dos técnicos são **estimativas subjetivas**, feitas para diversão. Não é análise científica, e você pode discordar à vontade (ou abrir um PR! 😉).

## Rodando localmente

É um site estático (HTML, CSS e JavaScript puro), sem build nem dependências.

```bash
git clone https://github.com/jsambrano20/desc-tecnicos.git
cd desc-tecnicos

# opção 1: abrir o index.html direto no navegador
# opção 2: servir localmente (recomendado, igual à produção)
python -m http.server 8000      # depois abra http://localhost:8000
```

> Aberto direto do disco (`file://`), o navegador bloqueia algumas coisas (compartilhar imagem, copiar para a área de transferência). Em `localhost` ou `https` tudo funciona.

## Publicando na Vercel

1. Importe o repositório na Vercel. O `vercel.json` já define o build (`node build-config.js`) e a pasta de saída; não precisa configurar mais nada.
2. O endereço do app usado nos links de compartilhamento vem, em ordem de prioridade, de: variável de ambiente `APP_URL` → domínio de produção da Vercel → valor do `config.js`.
3. Para fixar um domínio próprio, crie a variável `APP_URL` em *Settings → Environment Variables* (ex.: `https://meuapp.com`).

## Estrutura

```
index.html          telas: início, teste e resultado
style.css           tema "gramado de estádio" (escuro)
app.js              lógica do quiz, resultado e card compartilhável (canvas)
data.js             fundamentos, perguntas e técnicos (dados editáveis)
config.js           APP_URL (endereço público do app)
build-config.js     gera o config.js no deploy a partir de variáveis de ambiente
vercel.json         configuração de deploy
fotos/              uma foto por técnico: fotos/<nome-sem-acento-com-hifen>.jpg
fotos_data.js       miniaturas embutidas (usadas só para o card quando aberto via file://)
gerar_fotos_data.py gera o fotos_data.js a partir de fotos/
img/                ícones da aba do navegador
```

## Personalizando

**Adicionar ou ajustar um técnico** (`data.js`, lista `COACHES`): informe nome, país/época, descrição curta e 12 valores de 0 a 100, na ordem dos fundamentos da tabela acima (0 = lado esquerdo, 100 = lado direito).

```js
{ n: "Nome do Técnico", c: "País", v: [95,90,85,80,95,75,45,45,95,40,90,75], d: "Descrição curta." }
```

**Foto do técnico:** salve em `fotos/` com o nome em minúsculas, sem acento e com hífen (ex.: `Telê Santana` → `fotos/tele-santana.jpg`). Use imagens de até ~800 px de lado. Sem foto, o app mostra um avatar com as iniciais. Depois, rode `python gerar_fotos_data.py` (requer `pip install pillow`) para atualizar as miniaturas do card.

**Perguntas:** edite `QUESTIONS` em `data.js`. Cada pergunta tem o fundamento (`a`), a direção (`d`: `1` empurra para o lado direito, `-1` para o esquerdo) e o texto (`t`). Mantenha o mesmo número de perguntas em cada direção por fundamento.

## Contribuindo

Contribuições são bem-vindas: sugestões de técnicos, ajuste de perfis, novas perguntas, correções e melhorias. Faça um **fork**, crie uma branch e abra um **Pull Request** explicando a mudança. Para novas fotos, informe no PR a origem e a licença da imagem.

## Créditos e avisos

- As fotos dos técnicos vêm do [Wikimedia Commons](https://commons.wikimedia.org/) e estão sob licenças livres (CC BY, CC BY-SA, CC0 ou domínio público). Várias exigem atribuição ao autor, conforme a página de cada arquivo no Commons.
- Projeto de diversão, sem vínculo com os técnicos citados.

## Autor

Feito por [jsambrano20](https://github.com/jsambrano20) · [github.com/jsambrano20/desc-tecnicos](https://github.com/jsambrano20/desc-tecnicos)
