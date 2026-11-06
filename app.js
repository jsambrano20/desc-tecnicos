(function () {
  const $ = (id) => document.getElementById(id);
  const SCALE = [
    { v: 2,  t: "Concordo totalmente" },
    { v: 1,  t: "Concordo" },
    { v: 0,  t: "Neutro / Depende" },
    { v: -1, t: "Discordo" },
    { v: -2, t: "Discordo totalmente" },
  ];
  const KEY = "12estilos.v1";
  const NQ = QUESTIONS.length;
  let N = NQ;

  let order = [], answers = [], idx = 0, lastResult = null;

  // ---- storage seguro ----
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } },
    set(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} },
    clear() { try { localStorage.removeItem(KEY); } catch (e) {} },
  };
  const save = () => store.set({ order, answers, idx });

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
  const saved = store.get();
  if (saved && saved.order && saved.answers && saved.answers.length === NQ && saved.idx < saved.order.length && saved.answers.some((x) => x !== null)) {
    $("resume").hidden = false;
  }
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
    idx = 0; save(); renderQ(); show("quiz");
  }));
  $("resume").onclick = () => {
    order = saved.order; answers = saved.answers; idx = saved.idx; N = order.length;
    renderQ(); show("quiz");
  };

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
    $("back").style.visibility = idx === 0 ? "hidden" : "visible";
  }
  function answer(v) {
    answers[order[idx]] = v;
    idx++;
    if (idx >= N) { store.clear(); finish(); } else { save(); renderQ(); }
  }
  $("back").onclick = () => { if (idx > 0) { idx--; save(); renderQ(); } };

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
    const m = list[cur], sc = lastResult.sc;
    const rows = m.c.v.map((v, i) => ({ i, v, d: Math.abs(v - 50) })).sort((a, b) => b.d - a.d).slice(0, 3)
      .map((r) => {
        const ax = AXES[r.i];
        return `<div class="hrow"><div class="ht"><span>${strength(r.v)} · <b>${poleOf(ax, r.v)}</b></span><span>${poleShare(r.v)}%</span></div>
          <div class="track sm"><div class="fill" style="left:${Math.min(50, r.v)}%;width:${Math.abs(r.v - 50)}%"></div>
          <div class="dot" style="left:${r.v}%"></div><div class="you" style="left:${sc[r.i]}%"></div></div>
          <div class="hl"><span>${ax.left}</span><span>${ax.right}</span></div></div>`;
      }).join("");
    $("hero").className = "hero" + (m.opp ? " opp" : "");
    $("hero").innerHTML = `
      <button class="nav" id="prev" aria-label="Anterior">‹</button>
      <div class="hbody">
        <div class="tag">${m.opp ? "NO OUTRO EXTREMO" : "#" + (cur + 1) + " MAIS COMPATÍVEL"}</div>
        <div class="hmain">${avatar(m.c.n, "big")}
          <div class="hid"><div class="hname">${m.c.n}</div><div class="hc">${m.c.c}</div>
          <div class="pct">${m.p}%<small>MATCH</small></div></div></div>
        <p class="hd">${m.c.d}</p>
        ${rows}
        <div class="legend"><span><i class="ld g"></i>técnico</span><span><i class="ld y"></i>você</span></div>
      </div>
      <button class="nav" id="next" aria-label="Próximo">›</button>`;
    $("prev").onclick = () => { cur = (cur + list.length - 1) % list.length; renderHero(); renderThumbs(); };
    $("next").onclick = () => { cur = (cur + 1) % list.length; renderHero(); renderThumbs(); };
  }
  function renderThumbs() {
    $("thumbs").innerHTML = list.map((m, i) => `<button class="th${i === cur ? " on" : ""}${m.opp ? " opp" : ""}" data-i="${i}">${avatar(m.c.n)}<span>${m.c.n.split(" ").slice(-1)[0]}</span><b>${m.p}%</b></button>`).join("");
    $("thumbs").querySelectorAll(".th").forEach((b) => (b.onclick = () => { cur = +b.dataset.i; renderHero(); renderThumbs(); }));
  }

  function renderResult() {
    const { sc, label } = lastResult;
    $("rlabel").textContent = label;
    $("axes").innerHTML = AXES.map((ax, i) => {
      const p = sc[i];
      return `<div class="axis">
        <div class="t"><span>${p < 50 ? "<b>" + ax.left + "</b>" : ax.left}</span><span>${p >= 50 ? "<b>" + ax.right + "</b>" : ax.right}</span></div>
        <div class="track"><div class="fill" style="left:${Math.min(50, p)}%;width:${Math.abs(p - 50)}%"></div><div class="dot" style="left:${p}%"></div></div>
        <div class="v">${strength(p)} · ${poleOf(ax, p)} ${poleShare(p)}%</div></div>`;
    }).join("");
    renderHero(); renderThumbs(); setTab("p-match");
  }
  function setTab(id) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.p === id));
    document.querySelectorAll(".pane").forEach((p) => p.classList.toggle("on", p.id === id));
  }
  document.querySelectorAll(".tab").forEach((t) => (t.onclick = () => setTab(t.dataset.p)));

  // ---- compartilhar ----
  function appUrl() {
    const u = (typeof APP_URL === "string" && APP_URL.trim()) ||
      (/^https?:/.test(location.href) ? location.origin + location.pathname.replace(/index\.html$/, "") : "");
    return u.trim();
  }
  function shareText() {
    const { label, top } = lastResult, u = appUrl();
    return `Fiz o teste Prancheta 12: meu perfil tático é "${label}" ⚽\n` +
      `Mais compatível com: ${top.slice(0, 3).map((m) => `${m.c.n} (${m.p}%)`).join(", ")}.\n` +
      `Qual técnico pensa como você? 🧠` + (u ? `\nFaça o teste: ${u}` : "");
  }
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.hidden = false;
    setTimeout(() => (t.hidden = true), 2500);
  }
  $("redo").onclick = () => { store.clear(); show("intro"); $("resume").hidden = true; };

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
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#0b1410"); bg.addColorStop(1, "#11301f");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 120) { g.fillStyle = "rgba(61,220,132,.04)"; g.fillRect(x, 0, 60, H); }

    g.textAlign = "left"; g.fillStyle = "#3ddc84"; g.font = `700 26px ${FONT}`; g.fillText("📋  PRANCHETA 12", 60, 78);
    g.textAlign = "right"; g.fillStyle = "#93ab9e"; g.font = `500 24px ${FONT}`; g.fillText("Qual técnico pensa como você?", W - 60, 78); g.textAlign = "left";
    g.fillStyle = "#93ab9e"; g.font = `600 24px ${FONT}`; g.fillText("MEU PERFIL TÁTICO", 60, 150);
    g.fillStyle = "#eaf3ee"; fit(g, label, 800, 82, W - 120); g.fillText(label, 60, 230);

    // painel do técnico #1
    rr(g, 60, 270, 960, 390, 28); g.fillStyle = "#12211a"; g.fill(); g.lineWidth = 2; g.strokeStyle = "#244033"; g.stroke();
    const cx = 230, cy = 465, R = 125, hue = hueOf(m.c.n);
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    const ag = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    ag.addColorStop(0, `hsl(${hue},55%,36%)`); ag.addColorStop(1, `hsl(${(hue + 50) % 360},60%,14%)`);
    g.fillStyle = ag; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    if (photo) {
      const s = Math.max((R * 2) / photo.width, (R * 2) / photo.height), w = photo.width * s, hh = photo.height * s;
      g.drawImage(photo, cx - w / 2, cy - R - (hh - 2 * R) * 0.22, w, hh);
    } else {
      g.fillStyle = "rgba(255,255,255,.16)"; g.beginPath(); g.arc(cx, cy - 36, 44, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(cx - 110, cy + R); g.quadraticCurveTo(cx - 100, cy + 15, cx, cy + 15); g.quadraticCurveTo(cx + 100, cy + 15, cx + 110, cy + R); g.fill();
      g.fillStyle = "#fff"; g.textAlign = "center"; g.font = `800 64px ${FONT}`; g.fillText(initials(m.c.n), cx, cy + 40); g.textAlign = "left";
    }
    g.restore(); g.lineWidth = 6; g.strokeStyle = "#3ddc84"; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();

    const tx = 390;
    g.fillStyle = "#3ddc84"; g.font = `700 22px ${FONT}`; g.fillText("#1 MAIS COMPATÍVEL", tx, 330);
    g.fillStyle = "#eaf3ee"; fit(g, m.c.n, 800, 56, 600); g.fillText(m.c.n, tx, 395);
    g.fillStyle = "#93ab9e"; g.font = `500 24px ${FONT}`; g.fillText(m.c.c, tx, 430);
    g.fillStyle = "#3ddc84"; g.font = `900 104px ${FONT}`; g.fillText(`${m.p}%`, tx, 535);
    const pw = g.measureText(`${m.p}%`).width;
    g.fillStyle = "#93ab9e"; g.font = `700 26px ${FONT}`; g.fillText("MATCH", tx + pw + 14, 535);
    g.fillStyle = "#c9dbd0"; g.font = `500 23px ${FONT}`; wrap(g, m.c.d, tx, 580, 590, 31, 3);

    // eixos
    g.fillStyle = "#93ab9e"; g.font = `600 24px ${FONT}`; g.fillText("MEUS 12 FUNDAMENTOS", 60, 715);
    AXES.forEach((ax, i) => {
      const col = i < 6 ? 0 : 1, row = i % 6, x0 = 60 + col * 510, w = 450, y = 770 + row * 84, p = sc[i];
      g.font = `500 21px ${FONT}`; g.textAlign = "left"; g.fillStyle = p < 50 ? "#eaf3ee" : "#6f8578"; g.fillText(ax.left, x0, y);
      g.textAlign = "right"; g.fillStyle = p >= 50 ? "#eaf3ee" : "#6f8578"; g.fillText(ax.right, x0 + w, y);
      g.fillStyle = "#182b21"; rr(g, x0, y + 14, w, 12, 6); g.fill();
      g.fillStyle = "#3ddc84"; g.fillRect(x0 + Math.min(50, p) / 100 * w, y + 14, Math.abs(p - 50) / 100 * w, 12);
      g.fillStyle = "#f5c542"; g.beginPath(); g.arc(x0 + p / 100 * w, y + 20, 13, 0, Math.PI * 2); g.fill();
      g.strokeStyle = "#0b1410"; g.lineWidth = 3; g.stroke();
    });
    g.textAlign = "left"; g.fillStyle = "#93ab9e";
    const also = "Também combino com: " + top.slice(1, 4).map((t) => `${t.c.n} (${t.p}%)`).join(" · ");
    fit(g, also, 500, 24, 960); g.fillText(also, 60, 1262);
    const u = appUrl().replace(/^https?:\/\//, "").replace(/\/$/, "");
    g.textAlign = "center";
    if (u) { g.fillStyle = "#3ddc84"; fit(g, `Faça o teste: ${u}`, 700, 28, 960); g.fillText(`Faça o teste: ${u}`, W / 2, 1303); }
    g.font = `500 20px ${FONT}`; g.fillStyle = "#587061"; g.fillText("Resultado lúdico, não é análise científica", W / 2, 1335);
    return cv;
  }
  function loadPhoto(name) {
    return new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `fotos/${slug(name)}.jpg`; });
  }
  let cardCanvas = null;
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

  $("share").onclick = async () => {
    const cv = await buildCard();
    $("cardimg").src = cv.toDataURL("image/png");
    const txt = encodeURIComponent(shareText());
    $("mwa").href = `https://wa.me/?text=${txt}`;
    $("mx").href = `https://twitter.com/intent/tweet?text=${txt}`;
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
  async function copyImage() {
    try {
      const blob = await toBlob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return true;
    } catch (e) { return false; }
  }
  $("mcopyimg").onclick = async () => {
    mtoast((await copyImage()) ? "Imagem copiada! Cole (Ctrl+V) na conversa." : "Não foi possível copiar. Use “Baixar imagem”.");
  };
  // WhatsApp/X só recebem texto por link: baixamos e copiamos a imagem para você anexar
  function viaLink(e) {
    e.preventDefault();
    const url = e.currentTarget.href;
    download();
    window.open(url, "_blank", "noopener");
    copyImage();
    mtoast("Imagem baixada e copiada: anexe ou cole (Ctrl+V) na conversa.");
  }
  $("mwa").onclick = viaLink;
  $("mx").onclick = viaLink;
  $("mshare").onclick = async () => {
    try {
      const blob = await toBlob();
      const file = new File([blob], "meu-perfil-tecnico.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText() });
      } else {
        download(); await copyImage();
        mtoast("Este navegador não envia imagem direto: ela foi baixada e copiada. Anexe ou cole na conversa.");
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
      download(); mtoast("Imagem baixada. Anexe na conversa.");
    }
  };
})();
