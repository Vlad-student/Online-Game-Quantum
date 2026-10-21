/* Банк питань збирається з файлів js/questions/*.js (див. js/config.js) */
const QUESTIONS = window.BL.questions;

const DEPTS = {
  mkt:  { code: "МЛ",  name: "Маркетинг і логістика", color: "var(--d-mkt)",
          desc: "Як продукт знаходить клієнта: ринок, сегментація, просування, ціна й ланцюги постачання." },
  mgt:  { code: "МА",  name: "Менеджмент та адміністрування", color: "var(--d-mgt)",
          desc: "Управління командами та процесами: цілі, лідерство, делегування, рішення й конфлікти." },
  acc:  { code: "ОФ",  name: "Облік та фінанси", color: "var(--d-acc)",
          desc: "Мова бізнесу: баланс, звітність, амортизація, податки, аудит." },
  fin:  { code: "БУ",  name: "Бізнес та управління", color: "var(--d-fin)",
          desc: "Гроші в рішеннях: інвестиції, кредити, ризики, ліквідність і фінансова безпека." },
  it:   { code: "ЦТ",  name: "Цифрові технології в бізнесі та економіці", color: "var(--d-it)",
          desc: "Цифрові інструменти компанії: CRM, ERP, хмари, дані, кібербезпека." },
  econ: { code: "ЕМС", name: "Економіка та митна справа", color: "var(--d-econ)", on: "#1a1203", text: "var(--econ-text)",
          desc: "Як працюють ринки: попит і пропозиція, інфляція, ВВП, монетарна політика." }
};
const ORDER = ["mkt", "mgt", "acc", "fin", "it", "econ"];
const CARDS = 10;
function paint(n, k) { const d = DEPTS[k]; n.style.setProperty("--c", d.color); if (d.on) n.style.setProperty("--on", d.on); if (d.text) n.style.setProperty("--c-text", d.text); }
const LETTERS = ["A", "B", "C"];
const LS_KEY = "businessLab.results.v1";

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");
const fmt = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return pad(Math.floor(s / 60)) + ":" + pad(s % 60); };
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many; };
function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 3500); }
function sparkPath() {
  let y = 20 + Math.random() * 10, d = "M0 " + y.toFixed(1);
  for (let x = 10; x <= 100; x += 10) { y = Math.min(28, Math.max(2, y + (Math.random() - 0.55) * 12)); d += " L" + x + " " + y.toFixed(1); }
  return d;
}

/* ---------- стан ---------- */
let state = { screen: "start", player: "", cards: [], startedAt: 0, finishedAt: 0, resultId: null };
let openIdx = -1, selected = null, timerId = null;

/* ---------- старт: біжучий рядок і кафедри ---------- */
const FACULTIES = [
  ["ФКНТ", "Факультет комп'ютерних наук і технологій", "#2563eb"],
  ["ФІБЕК", "Факультет інформаційної безпеки та електронних комунікацій", "#0891b2"],
  ["ФБАД", "Факультет будівництва, архітектури та дизайну", "#ea580c"],
  ["МФ", "Машинобудівний факультет", "#64748b"],
  ["ЕТФ", "Електротехнічний факультет", "#eab308", "#1a1203"],
  ["ІФФ", "Інженерно-фізичний факультет", "#7c3aed"],
  ["ТФ", "Транспортний факультет", "#0d9488"],
  ["ФБТЕ", "Факультет бізнес-технологій та економіки", "#f5b83d", "#1a1203"],
  ["ЮФ", "Юридичний факультет", "#9f1239"],
  ["ФСН", "Факультет соціальних наук", "#db2777"],
  ["ГФ", "Гуманітарний факультет", "#65a30d"],
  ["ФУФКС", "Факультет управління фізичною культурою та спортом", "#dc2626"]
];
function renderTicker() {
  const group = () => {
    const g = el("span", "ticker-group");
    FACULTIES.forEach(([code, name, color, ink]) => {
      const it = el("span", "ticker-item" + (code === "ФБТЕ" ? " home" : ""));
      it.style.setProperty("--c", color);
      if (ink) it.style.setProperty("--on", ink);
      it.append(el("span", "code", code), name);
      g.append(it);
    });
    return g;
  };
  const tr = $("tickerTrack");
  tr.textContent = "";
  const second = group(); second.setAttribute("aria-hidden", "true");
  tr.append(group(), second);
}

/* ---------- тема: світла / темна ---------- */
const THEME_KEY = "businessLab.theme";
const ICONS = {
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  sun: "M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
};
function applyTheme(t) {
  document.documentElement.setAttribute("data-bl-theme", t);
  const dark = t === "dark";
  $("themeIcon").setAttribute("d", dark ? ICONS.sun : ICONS.moon);
  $("themeLabel").textContent = dark ? "Світла" : "Темна";
  $("themeBtn").setAttribute("aria-label", dark ? "Увімкнути світлу тему" : "Увімкнути темну тему");
}
function initTheme() {
  let t = "light";
  try { t = localStorage.getItem(THEME_KEY) || "light"; } catch (e) {}
  applyTheme(t);
  $("themeBtn").addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-bl-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });
}
function renderDepts() {
  $("statQ").textContent = QUESTIONS.length;
}

/* ---------- екрани ---------- */
function show(screen) {
  state.screen = screen;
  ["start", "board", "result"].forEach((s) => $("screen" + s[0].toUpperCase() + s.slice(1)).classList.toggle("active", s === screen));
  $("homeBtn").hidden = screen === "start";
  window.scrollTo(0, 0);
}

/* ---------- гра ---------- */
function pickCards() {
  // по одному питанню з кожної кафедри, решта — випадково з банку
  const picked = ORDER.map((k) => shuffle(QUESTIONS.filter((q) => q.dept === k))[0]);
  shuffle(QUESTIONS.filter((q) => !picked.includes(q))).slice(0, CARDS - picked.length).forEach((q) => picked.push(q));
  return shuffle(picked).map((q) => ({ qi: QUESTIONS.indexOf(q), order: shuffle([0, 1, 2]), chosen: null, answered: false, ok: false, spark: sparkPath() }));
}
const score = () => state.cards.filter((c) => c.ok).length;
const answeredCount = () => state.cards.filter((c) => c.answered).length;

function startGame(name) {
  state = { screen: "board", player: name, cards: pickCards(), startedAt: Date.now(), finishedAt: 0, resultId: null };
  $("boardPlayer").textContent = name;
  renderBoard(true);
  show("board");
  startTimer();
}
function startTimer() {
  clearInterval(timerId);
  const tick = () => { $("kpiTime").textContent = fmt((state.finishedAt || Date.now()) - state.startedAt); };
  tick();
  if (!state.finishedAt) timerId = setInterval(tick, 500);
}

function renderBoard(deal) {
  const grid = $("cards");
  grid.textContent = "";
  grid.classList.toggle("deal", !!deal);
  state.cards.forEach((c, i) => {
    const q = QUESTIONS[c.qi], d = DEPTS[q.dept];
    const b = el("button", "card" + (c.answered ? " done " + (c.ok ? "correct" : "wrong") : ""));
    b.type = "button";
    paint(b, q.dept);
    b.style.animationDelay = i * 45 + "ms";
    b.setAttribute("aria-label", "Картка " + (i + 1) + ", " + d.name + (c.answered ? (c.ok ? ", правильно" : ", неправильно") : ""));
    const top = el("div", "card-top");
    top.append(el("span", "card-ticker", d.code));
    b.append(top, el("div", "card-dept", d.name), el("div", "card-num", String(i + 1)));
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "card-spark"); svg.setAttribute("viewBox", "0 0 100 30"); svg.setAttribute("preserveAspectRatio", "none");
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", c.spark); svg.append(p);
    b.append(svg);
    if (c.answered) b.append(el("div", "card-stamp", c.ok ? "✓ +1 бал" : "✗ 0 балів"));
    b.addEventListener("click", () => openCard(i));
    grid.append(b);
  });
  const track = $("track");
  track.textContent = "";
  state.cards.forEach((c) => track.append(el("i", c.answered ? (c.ok ? "ok" : "bad") : "")));
  $("kpiLeft").textContent = CARDS - answeredCount();
  $("kpiScore").textContent = score() + " / " + CARDS;
  $("finishBtn").hidden = answeredCount() < CARDS;
}

/* ---------- вікно завдання ---------- */
function openCard(i) {
  openIdx = i;
  const c = state.cards[i], q = QUESTIONS[c.qi], d = DEPTS[q.dept];
  paint($("modalCard"), q.dept);
  $("mDept").textContent = d.code + " · " + d.name;
  $("mNum").textContent = "Картка " + (i + 1) + " / " + CARDS;
  $("mQuestion").textContent = q.question;
  selected = null;
  renderOptions();
  $("modal").hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => (c.answered ? $("backBtn") : $("mOptions").querySelector("button"))?.focus({ preventScroll: true }), 30);
}
function renderOptions() {
  const c = state.cards[openIdx], q = QUESTIONS[c.qi];
  const box = $("mOptions");
  box.textContent = "";
  c.order.forEach((oi, pos) => {
    const b = el("button", "option");
    b.type = "button";
    b.append(el("span", "letter", LETTERS[pos]), el("span", "opt-text", q.options[oi]));
    if (c.answered) {
      b.disabled = true;
      if (oi === q.correct) { b.classList.add("is-correct"); b.append(el("span", "mark", "✓")); }
      else if (oi === c.chosen) { b.classList.add("is-wrong"); b.append(el("span", "mark", "✗")); }
      else b.classList.add("faded");
    } else {
      if (oi === selected) b.classList.add("selected");
      b.addEventListener("click", () => { selected = oi; renderOptions(); box.children[pos].focus(); });
    }
    box.append(b);
  });
  $("confirmBtn").hidden = c.answered;
  $("confirmBtn").disabled = selected === null;
  $("backBtn").hidden = !c.answered;
  $("backBtn").textContent = answeredCount() === CARDS ? "Подивитися результат →" : "До карток →";
  const fb = $("mFeedback");
  fb.hidden = !c.answered;
  if (c.answered) {
    fb.className = "feedback " + (c.ok ? "good" : "bad");
    $("mVerdict").textContent = c.ok ? "Правильно! +1 бал" : "Неправильно. 0 балів";
    $("mExpl").textContent = c.ok ? q.explanation : "Правильна відповідь: «" + q.options[q.correct] + "». " + q.explanation;
  }
}
function confirmAnswer() {
  const c = state.cards[openIdx];
  if (!c || c.answered || selected === null) return;
  c.answered = true; c.chosen = selected; c.ok = selected === QUESTIONS[c.qi].correct;
  if (answeredCount() === CARDS) { state.finishedAt = Date.now(); startTimer(); }
  renderOptions();
  renderBoard();
  $("backBtn").focus({ preventScroll: true });
  if (state.finishedAt && !state.resultId) saveResult();
}
function closeModal() {
  if ($("modal").hidden) return;
  $("modal").hidden = true;
  document.body.style.overflow = "";
  const last = openIdx;
  openIdx = -1;
  if (state.screen === "board" && answeredCount() === CARDS) finish();
  else $("cards").children[last]?.focus({ preventScroll: true });
}

/* ---------- рейтинг: спільна база, запасний варіант — цей браузер ---------- */
let db = null, results = [], localMode = true, isOwner = false;
function readLocal() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; } }
function writeLocal(list) { try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {} }
const sorted = () => results.slice().sort((a, b) => b.score - a.score || a.timeMs - b.timeMs || a.finishedAt - b.finishedAt);

async function saveResult() {
  const rec = { name: state.player, score: score(), total: CARDS, timeMs: state.finishedAt - state.startedAt, finishedAt: state.finishedAt };
  const id = "r" + state.finishedAt.toString(36) + Math.random().toString(36).slice(2, 8);
  state.resultId = id;
  if (db && !localMode) {
    try {
      await db.collection("results").doc(id).set(rec);
      if (!results.some((r) => r.id === id)) results.push({ id, ...rec });
      renderRating();
      return;
    } catch (e) {
      toast(e && e.code === "quota_exceeded" ? "Рейтинг переповнений, результат збережено лише на цьому пристрої." : "Немає права запису в загальний рейтинг, результат збережено на цьому пристрої.");
    }
  }
  const list = readLocal(); list.push({ id, ...rec }); writeLocal(list);
  if (localMode) results = list; else results.push({ id, ...rec, localOnly: true });
  renderRating();
}
function renderRating() {
  const list = sorted();
  const body = $("ratingBody");
  body.textContent = "";
  list.forEach((r, i) => {
    const place = i + 1, isMe = r.id === state.resultId;
    const tr = el("tr", isMe ? "me" : "");
    const td1 = el("td"); td1.append(el("span", "place" + (place <= 3 ? " p" + place : ""), String(place)));
    const td2 = el("td", "name", String(r.name || "Без імені").slice(0, 48));
    if (isMe) td2.append(el("span", "you-tag", "ти"));
    tr.append(td1, td2, el("td", "num score", (r.score | 0) + " / " + (r.total || CARDS)), el("td", "num", fmt(r.timeMs || 0)));
    body.append(tr);
  });
  $("ratingEmpty").hidden = list.length > 0;
  $("ratingCount").textContent = list.length + " " + plural(list.length, "учасник", "учасники", "учасників");
  const place = list.findIndex((r) => r.id === state.resultId);
  $("resultPlace").textContent = place >= 0 ? place + 1 + " із " + list.length : "—";
  $("clearBtn").hidden = !(localMode || isOwner) || list.length === 0;
}
async function initStore() {
  const note = (t) => { $("storeNote").textContent = t; renderRating(); };
  results = readLocal();
  note("Рейтинг цього браузера.");
  try { db = await window.claude?.use?.("db"); } catch (e) { db = null; }
  if (!db) { note("Загальний рейтинг недоступний, показано результати цього браузера."); return; }
  try { const user = await window.claude.use("user"); isOwner = (await user?.isOwner()) ?? false; } catch (e) {}
  localMode = false;
  results = [];
  note("Загальний рейтинг усіх учасників.");
  db.collection("results").onSnapshot((snap) => {
    const mine = results.filter((r) => r.localOnly);
    results = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((r) => typeof r.score === "number").concat(mine);
    renderRating();
  }, () => { localMode = true; results = readLocal(); note("Загальний рейтинг недоступний, показано результати цього браузера."); });
}
let clearArmed = false;
async function clearRating() {
  const btn = $("clearBtn");
  if (!clearArmed) {
    clearArmed = true; btn.textContent = "Точно очистити? Натисніть ще раз";
    setTimeout(() => { clearArmed = false; btn.textContent = "Очистити рейтинг"; }, 4000);
    return;
  }
  clearArmed = false; btn.textContent = "Очистити рейтинг";
  if (localMode) { writeLocal([]); results = []; renderRating(); return; }
  for (const r of results.slice()) { try { await db.collection("results").doc(r.id).delete(); } catch (e) {} }
  toast("Рейтинг очищено.");
}

/* ---------- результат ---------- */
function grade(s) {
  const p = s / CARDS;
  if (p >= 0.9) return ["Бізнес-акула", "Блискуче! Ти мислиш як досвідчений підприємець."];
  if (p >= 0.7) return ["Перспективний стартапер", "Дуже добре, ще трохи — і ти на вершині рейтингу."];
  if (p >= 0.5) return ["Молодий підприємець", "Непогано! Переглянь пояснення до помилок і спробуй ще раз."];
  if (p >= 0.3) return ["Стажер", "Є над чим попрацювати, пояснення допоможуть розібратися."];
  return ["Початок кар'єри", "Кожен бізнес починається з першого кроку. Спробуй ще раз!"];
}
function finish() {
  clearInterval(timerId);
  const s = score(), [title, text] = grade(s);
  $("resultScore").textContent = s;
  $("resultTime").textContent = fmt(state.finishedAt - state.startedAt);
  $("resultTitle").textContent = title;
  $("resultText").textContent = text;
  const bd = $("breakdown");
  bd.textContent = "";
  ORDER.forEach((k) => {
    const own = state.cards.filter((c) => QUESTIONS[c.qi].dept === k);
    if (!own.length) return;
    const row = el("div", "bd-row");
    paint(row, k);
    row.append(el("span", "bd-code", DEPTS[k].code), el("span", "", DEPTS[k].name), el("span", "mono", own.filter((c) => c.ok).length + " / " + own.length));
    bd.append(row);
  });
  $("resultPanel").hidden = false;
  renderRating();
  show("result");
}
function openRatingOnly() {
  $("resultPanel").hidden = true;
  renderRating();
  show("result");
}

/* ---------- події ---------- */
$("startForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("playerName").value.replace(/\s+/g, " ").trim();
  const ok = name.length >= 3 && name.split(" ").length >= 2;
  $("nameErr").hidden = ok;
  if (!ok) { $("playerName").focus(); return; }
  startGame(name);
});
$("openRatingBtn").addEventListener("click", openRatingOnly);
$("homeBtn").addEventListener("click", () => { clearInterval(timerId); show("start"); });
$("playAgainBtn").addEventListener("click", () => startGame(state.player));
$("finishBtn").addEventListener("click", finish);
$("confirmBtn").addEventListener("click", confirmAnswer);
$("backBtn").addEventListener("click", closeModal);
$("clearBtn").addEventListener("click", clearRating);
document.querySelectorAll("[data-close]").forEach((n) => n.addEventListener("click", closeModal));
document.addEventListener("keydown", (e) => {
  if ($("modal").hidden) return;
  const c = state.cards[openIdx];
  const map = { "1": 0, "2": 1, "3": 2, a: 0, b: 1, c: 2 };
  const key = e.key.toLowerCase();
  if (e.key === "Escape") closeModal();
  else if (c && !c.answered && key in map) { selected = c.order[map[key]]; renderOptions(); }
});

/* ---------- запуск (гра переживає оновлення сторінки) ---------- */
function boot(saved) {
  initTheme();
  renderTicker();
  renderDepts();
  initStore();
  const s = saved && saved.state;
  if (s && s.screen === "board" && s.cards && s.cards.length === CARDS) {
    state = s;
    $("boardPlayer").textContent = state.player;
    renderBoard(); show("board"); startTimer();
  }
}
window.claude?.hot?.snapshot?.(() => ({ state }));
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
