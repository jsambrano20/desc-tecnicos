(function () {
  const $ = (id) => document.getElementById(id);
  const SCALE = [
    { v: 2,  t: "Concordo totalmente" },
    { v: 1,  t: "Concordo" },
    { v: 0,  t: "Neutro / Depende" },
    { v: -1, t: "Discordo" },
    { v: -2, t: "Discordo totalmente" },
  ];
  const NQ = QUESTIONS.length;
  let N = NQ;

  let order = [], answers = [], idx = 0, lastResult = null;

  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
    window.scrollTo(0, 0);
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---- intro ----
  $("chips").innerHTML = AXES.map((a) => `<span>${a.name}</span>`).join("");
  // seleção equilibrada: k perguntas por eixo, metade em cada direção
  function buildOrder(k) {
    const pick = [];
    AXES.forEach((ax) => {
      const pos = shuffle(QUESTIONS.map((q, i) => i).filter((i) => QUESTIONS[i].a === ax.id && QUESTIONS[i].d === 1));
      const neg = shuffle(QUESTIONS.map((q, i) => i).filter((i) => QUESTIONS[i].a === ax.id && QUESTIONS[i].d === -1));
      let flip = Math.random() < 0.5;
      for (let n = 0; n < k; n++) {
        const src = flip ? pos : neg;
        pick.push(src.length ? src.pop() : (flip ? neg : pos).pop());
        flip = !flip;
      }
    });
    return shuffle(pick);
  }
  $("modes").innerHTML = Object.entries(MODES).map(([id, m]) =>
    `<button class="mode" data-m="${id}"><b>${m.nome}</b><span>${m.info}</span></button>`).join("");
  $("modes").querySelectorAll(".mode").forEach((b) => (b.onclick = () => {
    order = buildOrder(MODES[b.dataset.m].k);
    N = order.length;
    answers = Array(NQ).fill(null);
    idx = 0; renderQ(); show("quiz");
  }));

  // ---- quiz ----
  function renderQ() {
    const q = QUESTIONS[order[idx]];
    const axis = AXES.find((a) => a.id === q.a);
    $("count").textContent = `${idx + 1} / ${N}`;
    $("bar").style.width = `${(idx / N) * 100}%`;
    $("qaxis").textContent = axis.name;
    $("qtext").textContent = q.t;
    const cur = answers[order[idx]];
    $("answers").innerHTML = "";
    SCALE.forEach((s) => {
      const b = document.createElement("button");
      b.className = "ans" + (cur === s.v ? " sel" : "");
      b.innerHTML = `<i></i><span>${s.t}</span>`;
      b.onclick = () => answer(s.v);
      $("answers").appendChild(b);
    });
    updateNav();
  }
  function updateNav() {
    $("back").disabled = idx === 0;
    $("next").disabled = answers[order[idx]] === null;
    $("next").textContent = idx === N - 1 ? "Ver resultado ⚽" : "Próxima →";
  }
  function answer(v) {
    answers[order[idx]] = v;
    document.querySelectorAll("#answers .ans").forEach((b, i) => b.classList.toggle("sel", SCALE[i].v === v));
    updateNav();
  }
  $("next").onclick = () => {
    if (answers[order[idx]] === null) return;
    if (idx + 1 >= N) finish(); else { idx++; renderQ(); }
  };
  $("back").onclick = () => { if (idx > 0) { idx--; renderQ(); } };

  // ---- cálculo ----
  function computeScores() {
    return AXES.map((ax) => {
      let sum = 0, n = 0;
      QUESTIONS.forEach((q, i) => {
        if (q.a === ax.id && answers[i] !== null) { sum += q.d * answers[i]; n++; }
      });
      return n ? Math.round(50 + (sum / (n * 2)) * 50) : 50;
    });
  }
  function matchPct(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
    const rms = Math.sqrt(s / a.length);
    return Math.max(0, Math.round(100 - rms * 1.25));
  }
  function makeLabel(sc) {
    const ranked = sc.map((p, i) => ({ i, d: Math.abs(p - 50) })).sort((x, y) => y.d - x.d);
    if (ranked[0].d < 10) return "Técnico Equilibrado";
    const adj = (r) => (sc[r.i] >= 50 ? AXES[r.i].adjR : AXES[r.i].adjL);
    return `${adj(ranked[0])} ${adj(ranked[1])}`;
  }
  function strength(p) {
    const d = Math.abs(p - 50);
    return d < 10 ? "Equilibrado" : d < 25 ? "Leve" : d < 40 ? "Moderado" : "Forte";
  }
  const poleOf = (ax, p) => (p >= 50 ? ax.right : ax.left);
  const poleShare = (p) => (p >= 50 ? p : 100 - p);

  // ---- resultado ----
  let list = [], cur = 0;
  const slug = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  function avatar(name, cls) {
    let hsh = 0; for (const ch of name) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
    const hue = hsh % 360;
    const ini = name.split(" ").filter((w) => w.length > 2 || /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const svg = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g${hsh}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},55%,34%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360},60%,14%)"/></linearGradient></defs>
      <rect width="100" height="100" fill="url(#g${hsh})"/>
      <circle cx="50" cy="38" r="17" fill="rgba(255,255,255,.16)"/>
      <path d="M12 100c2-24 18-36 38-36s36 12 38 36z" fill="rgba(255,255,255,.16)"/>
      <text x="50" y="62" text-anchor="middle" font-size="26" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">${ini}</text></svg>`;
    return `<div class="av ${cls || ""}">${svg}<img src="fotos/${slug(name)}.jpg" alt="${name}" loading="lazy" onerror="this.remove()"></div>`;
  }

  function finish() {
    const sc = computeScores();
    const ranked = COACHES.map((c) => ({ c, p: matchPct(sc, c.v) })).sort((a, b) => b.p - a.p);
    lastResult = { sc, label: makeLabel(sc), top: ranked.slice(0, 5), opp: ranked[ranked.length - 1] };
    list = [...lastResult.top, { ...lastResult.opp, opp: true }];
    cur = 0;
    renderResult(); show("result");
  }

  function renderHero() {
    const m = list[cur];
    $("hero").className = "hero" + (m.opp ? " opp" : "");
    $("hero").innerHTML = `
      <button class="nav" id="hprev" type="button" aria-label="Anterior">‹</button>
      <div class="hbody">
        <div class="tag">${m.opp ? "NO OUTRO EXTREMO" : "#" + (cur + 1) + " MAIS COMPATÍVEL"}</div>
        <div class="hmain">${avatar(m.c.n, "big")}
          <div class="hid"><div class="hname">${m.c.n}</div><div class="hc">${m.c.c}</div>
          <div class="pct">${m.p}%<small>MATCH</small></div></div></div>
        <p class="hd">${m.c.d}</p>
      </div>
      <button class="nav" id="hnext" type="button" aria-label="Próximo">›</button>`;
    $("hprev").onclick = () => go(-1);
    $("hnext").onclick = () => go(1);
  }
  function go(d) { cur = (cur + d + list.length) % list.length; renderHero(); renderThumbs(); renderAxes(); }
  function renderThumbs() {
    $("thumbs").innerHTML = list.map((m, i) => `<button class="th${i === cur ? " on" : ""}${m.opp ? " opp" : ""}" data-i="${i}">${avatar(m.c.n)}<span>${m.c.n.split(" ").slice(-1)[0]}</span><b>${m.p}%</b></button>`).join("");
    $("thumbs").querySelectorAll(".th").forEach((b) => (b.onclick = () => { cur = +b.dataset.i; renderHero(); renderThumbs(); renderAxes(); }));
  }

  // barras divididas do usuário (esquerda dourado x direita verde) + marca do técnico selecionado
  function renderAxes() {
    const sc = lastResult.sc, cv = list[cur].c.v;
    $("axes").innerHTML = AXES.map((ax, i) => {
      const r = sc[i], l = 100 - r, tick = 100 - cv[i];
      const cl = l > r ? "win" : l === r ? "tie" : "", cr = r > l ? "win" : l === r ? "tie" : "";
      return `<div class="axis2">
        <div class="a2t"><span class="${cl}">${ax.left} <b>${l}%</b></span><span class="${cr}"><b>${r}%</b> ${ax.right}</span></div>
        <div class="a2bar"><i class="L ${cl}" style="width:${l}%"></i><i class="R ${cr}" style="width:${r}%"></i><u class="tick" style="left:${tick}%"></u></div>
      </div>`;
    }).join("");
  }
  function renderResult() {
    $("rlabel").textContent = lastResult.label;
    renderHero(); renderThumbs(); renderAxes();
  }

  // ---- compartilhar ----
  function appUrl() {
    const u = (typeof APP_URL === "string" && APP_URL.trim()) ||
      (/^https?:/.test(location.href) ? location.origin + location.pathname.replace(/index\.html$/, "") : "");
    return u.trim();
  }
  function shareText() {
    const { label, top } = lastResult, u = appUrl();
    return `Fiz o Perfil de Campo e meu estilo de técnico é "${label}".\n` +
      `Mais compatível com: ${top.slice(0, 3).map((m) => `${m.c.n} (${m.p}%)`).join(", ")}.\n` +
      `Qual técnico pensa como você?` + (u ? `\nFaça o teste: ${u}` : "");
  }
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.hidden = false;
    setTimeout(() => (t.hidden = true), 2500);
  }
  $("redo").onclick = () => show("intro");

  // ---- card compartilhável ----
  const hueOf = (name) => { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 360; };
  const initials = (name) => name.split(" ").filter((w) => w.length > 2 || /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const FONT = "system-ui, 'Segoe UI', Roboto, sans-serif";
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function fit(g, text, weight, size, maxW) { let s = size; g.font = `${weight} ${s}px ${FONT}`; while (g.measureText(text).width > maxW && s > 20) { s -= 2; g.font = `${weight} ${s}px ${FONT}`; } }
  function wrap(g, text, x, y, maxW, lh, maxLines) {
    const words = text.split(" "); let line = "", n = 0;
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y + n * lh); line = w; if (++n >= maxLines) return; } else line = t;
    }
    if (line) g.fillText(line, x, y + n * lh);
  }
  function drawCard(photo) {
    const { sc, label, top } = lastResult, m = top[0];
    const W = 1080, H = 1560, M = 96, CW = W - 2 * M;           // M = margem lateral; CW = largura útil
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#0b1410"); bg.addColorStop(1, "#11301f");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 120) { g.fillStyle = "rgba(61,220,132,.04)"; g.fillRect(x, 0, 60, H); }

    // cabeçalho
    g.textAlign = "left"; g.fillStyle = "#3ddc84"; g.font = `700 26px ${FONT}`; g.fillText("⚽  PERFIL DE CAMPO", M, 112);
    g.textAlign = "right"; g.fillStyle = "#93ab9e"; g.font = `500 24px ${FONT}`; g.fillText("Qual técnico pensa como você?", W - M, 112); g.textAlign = "left";
    g.fillStyle = "#93ab9e"; g.font = `600 24px ${FONT}`; g.fillText("MEU PERFIL TÁTICO", M, 200);
    g.fillStyle = "#eaf3ee"; fit(g, label, 800, 82, CW); g.fillText(label, M, 285);

    // painel do técnico #1
    const PY = 335, PH = 430, PAD = 44;
    rr(g, M, PY, CW, PH, 28); g.fillStyle = "#12211a"; g.fill(); g.lineWidth = 2; g.strokeStyle = "#244033"; g.stroke();
    const R = 112, cx = M + PAD + R, cy = PY + PH / 2, hue = hueOf(m.c.n);
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    const ag = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    ag.addColorStop(0, `hsl(${hue},55%,36%)`); ag.addColorStop(1, `hsl(${(hue + 50) % 360},60%,14%)`);
    g.fillStyle = ag; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    if (photo) {
      const s = Math.max((R * 2) / photo.width, (R * 2) / photo.height), w = photo.width * s, hh = photo.height * s;
      g.drawImage(photo, cx - w / 2, cy - R - (hh - 2 * R) * 0.22, w, hh);
    } else {
      g.fillStyle = "rgba(255,255,255,.16)"; g.beginPath(); g.arc(cx, cy - 34, 40, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(cx - 100, cy + R); g.quadraticCurveTo(cx - 90, cy + 14, cx, cy + 14); g.quadraticCurveTo(cx + 90, cy + 14, cx + 100, cy + R); g.fill();
      g.fillStyle = "#fff"; g.textAlign = "center"; g.font = `800 58px ${FONT}`; g.fillText(initials(m.c.n), cx, cy + 36); g.textAlign = "left";
    }
    g.restore(); g.lineWidth = 6; g.strokeStyle = "#3ddc84"; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();

    const tx = cx + R + 40, tw = M + CW - PAD - tx;               // coluna de texto do painel
    g.fillStyle = "#3ddc84"; g.font = `700 22px ${FONT}`; g.fillText("#1 MAIS COMPATÍVEL", tx, PY + 78);
    g.fillStyle = "#eaf3ee"; fit(g, m.c.n, 800, 52, tw); g.fillText(m.c.n, tx, PY + 140);
    g.fillStyle = "#93ab9e"; g.font = `500 24px ${FONT}`; g.fillText(m.c.c, tx, PY + 176);
    g.fillStyle = "#3ddc84"; g.font = `900 100px ${FONT}`; g.fillText(`${m.p}%`, tx, PY + 275);
    const pw = g.measureText(`${m.p}%`).width;
    g.fillStyle = "#93ab9e"; g.font = `700 26px ${FONT}`; g.fillText("MATCH", tx + pw + 14, PY + 275);
    g.fillStyle = "#c9dbd0"; g.font = `500 23px ${FONT}`; wrap(g, m.c.d, tx, PY + 322, tw, 31, 3);

    // 12 fundamentos
    g.fillStyle = "#93ab9e"; g.font = `600 24px ${FONT}`; g.fillText("MEUS 12 FUNDAMENTOS", M, 850);
    const GAP = 56, CWd = (CW - GAP) / 2;
    AXES.forEach((ax, i) => {
      const col = i < 6 ? 0 : 1, row = i % 6, x0 = M + col * (CWd + GAP), y = 915 + row * 88, r = sc[i], l = 100 - r;
      const tl = `${ax.left} ${l}%`, tr = `${r}% ${ax.right}`;
      let fs = 21; g.font = `600 ${fs}px ${FONT}`;
      while (g.measureText(tl).width + g.measureText(tr).width + 20 > CWd && fs > 14) { fs--; g.font = `600 ${fs}px ${FONT}`; }
      g.textAlign = "left"; g.fillStyle = l >= r ? "#eaf3ee" : "#7d968a"; g.fillText(tl, x0, y);
      g.textAlign = "right"; g.fillStyle = r >= l ? "#eaf3ee" : "#7d968a"; g.fillText(tr, x0 + CWd, y);
      g.textAlign = "left";
      const lw = (l / 100) * CWd, gp = 3;
      g.globalAlpha = l >= r ? 1 : 0.35; g.fillStyle = "#f5c542"; rr(g, x0, y + 16, Math.max(lw - gp, 0), 14, 7); g.fill();
      g.globalAlpha = r >= l ? 1 : 0.35; g.fillStyle = "#3ddc84"; rr(g, x0 + lw + gp, y + 16, Math.max(CWd - lw - gp, 0), 14, 7); g.fill();
      g.globalAlpha = 1;
    });

    // rodapé
    g.textAlign = "left"; g.fillStyle = "#93ab9e";
    const also = "Também combino com: " + top.slice(1, 3).map((t) => `${t.c.n} (${t.p}%)`).join(" · ");
    fit(g, also, 500, 24, CW); g.fillText(also, M, 1448);
    const u = appUrl().replace(/^https?:\/\//, "").replace(/\/$/, "");
    g.textAlign = "center";
    if (u) { g.fillStyle = "#3ddc84"; fit(g, `Faça o teste: ${u}`, 700, 30, CW); g.fillText(`Faça o teste: ${u}`, W / 2, 1498); }
    g.font = `500 20px ${FONT}`; g.fillStyle = "#587061"; g.fillText("Resultado lúdico, não é análise científica", W / 2, 1534);
    return cv;
  }
  function loadPhoto(name) {
    return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `fotos/${slug(name)}.jpg`; });
  }
  let cardCanvas = null, cardBlob = null;
  function loadScript(src) {
    return new Promise((res) => { const s = document.createElement("script"); s.src = src; s.onload = () => res(true); s.onerror = () => res(false); document.head.appendChild(s); });
  }
  async function loadEmbedded(name) {
    if (!window.FOTOS && !(await loadScript("fotos_data.js"))) return null;
    const src = window.FOTOS && window.FOTOS[slug(name)];
    if (!src) return null;
    return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  }
  async function buildCard() {
    const name = lastResult.top[0].c.n;
    let cv = drawCard(await loadPhoto(name));
    try { cv.toDataURL(); } catch (e) {
      // aberto via file://: o navegador bloqueia foto de arquivo no canvas -> usa a versão embutida (data URI)
      cv = drawCard(await loadEmbedded(name));
    }
    cardCanvas = cv;
    return cv;
  }
  function mtoast(msg) { const t = $("mtoast"); t.textContent = msg; t.hidden = false; setTimeout(() => (t.hidden = true), 2500); }
  const toBlob = () => new Promise((r) => cardCanvas.toBlob(r, "image/png"));
  function download() {
    const a = document.createElement("a"); a.download = "meu-perfil-tecnico.png"; a.href = cardCanvas.toDataURL("image/png"); a.click();
  }

  let canFiles = false;
  function detectFiles() {
    try {
      const f = new File([cardBlob || new Blob(["x"])], "meu-perfil-tecnico.png", { type: "image/png" });
      return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [f] }));
    } catch (e) { return false; }
  }
  $("share").onclick = async () => {
    const cv = await buildCard();
    $("cardimg").src = cv.toDataURL("image/png");
    cardBlob = await toBlob();
    $("msgprev").textContent = shareText();
    const txt = encodeURIComponent(shareText());
    $("mwa").href = `https://wa.me/?text=${txt}`;
    $("mx").href = `https://twitter.com/intent/tweet?text=${txt}`;
    // Onde o navegador consegue enviar arquivo (celulares), "Compartilhar" leva imagem + texto + link.
    // No computador isso não existe: o botão WhatsApp vira o principal (copia a imagem e abre a conversa com o texto).
    canFiles = detectFiles();
    $("mshare").hidden = !canFiles;
    $("mtext").hidden = !(navigator.share && canFiles);
    $("mhint").hidden = canFiles;
    $("mwa").classList.toggle("primary", !canFiles);
    $("steps").hidden = true;
    $("modal").hidden = false; document.body.style.overflow = "hidden";
  };
  const closeModal = () => { $("modal").hidden = true; document.body.style.overflow = ""; };
  $("mclose").onclick = closeModal;
  $("modal").onclick = (e) => { if (e.target.id === "modal") closeModal(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
  $("mdl").onclick = () => { download(); mtoast("Imagem baixada!"); };
  $("mcopy").onclick = async () => {
    try { await navigator.clipboard.writeText(shareText()); mtoast("Texto copiado!"); } catch (e) { mtoast("Não foi possível copiar."); }
  };
  // copia a imagem (e, se o navegador aceitar, o texto junto) para a área de transferência
  async function copyImage() {
    try {
      const blob = cardBlob || (await toBlob());
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob, "text/plain": new Blob([shareText()], { type: "text/plain" }) })]);
      } catch (e) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }
      return true;
    } catch (e) { return false; }
  }
  $("mcopyimg").onclick = async () => {
    mtoast((await copyImage()) ? "Imagem copiada! Cole (Ctrl+V) na conversa." : "Não foi possível copiar. Use “Baixar imagem”.");
  };
  // WhatsApp/X só recebem o texto pelo link: copiamos a imagem antes de abrir a conversa
  function showSteps(msg, warn) { const s = $("steps"); s.textContent = msg; s.classList.toggle("warn", !!warn); s.hidden = false; }
  async function viaLink(e) {
    e.preventDefault();
    const url = e.currentTarget.href, app = e.currentTarget.id === "mx" ? "no X" : "no WhatsApp";
    const copying = copyImage();          // inicia a cópia antes de a nova aba tomar o foco
    window.open(url, "_blank", "noopener");
    if (await copying) showSteps(`✅ Imagem copiada! Volte para a conversa ${app} e cole com Ctrl+V (no celular: segure e toque em Colar). O texto e o link já estão na mensagem.`);
    else { download(); showSteps("⚠ O navegador não deixou copiar a imagem, então ela foi baixada. Anexe o arquivo baixado na conversa. (Publicado em https, a cópia funciona.)", true); }
  }
  $("mwa").onclick = viaLink;
  $("mx").onclick = viaLink;
  $("mtext").onclick = async () => {
    const text = shareText();
    try { await navigator.share({ text, title: "Perfil de Campo" }); }
    catch (e) {
      if (e && e.name === "AbortError") return;
      try { await navigator.clipboard.writeText(text); mtoast("Texto copiado! Cole na conversa."); } catch (e2) { mtoast("Não foi possível enviar o texto."); }
    }
  };
  $("mshare").onclick = async () => {
    const text = shareText();
    // reserva: alguns apps descartam o texto quando recebem imagem; deixa o texto copiado para colar
    try { navigator.clipboard && navigator.clipboard.writeText(text).catch(() => {}); } catch (e) {}
    try {
      const file = new File([cardBlob], "meu-perfil-tecnico.png", { type: "image/png" });
      await navigator.share({ files: [file], text, title: "Perfil de Campo" });
      // WhatsApp e outros apps costumam descartar o texto quando recebem imagem: oferece o envio separado
      showSteps("Se a imagem foi sem o texto (o WhatsApp às vezes não leva os dois), toque em “Enviar só o texto” e escolha a mesma conversa, ou cole: o texto já está copiado.");
    } catch (e) {
      if (e && e.name === "AbortError") return;
      mtoast((await copyImage()) ? "Não deu para abrir o menu: imagem copiada, cole na conversa." : "Não deu para compartilhar. Use “Baixar imagem”.");
    }
  };
})();
