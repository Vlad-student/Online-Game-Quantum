/* =========================================================================
   BUSINESS LAB — логіка гри
   ========================================================================= */
(function () {
  "use strict";

  // ---------------------------------------------------------------- утиліти
  const $ = (sel) => document.querySelector(sel);
  const LETTERS = ["A", "B", "C"];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function formatTime(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "style") node.style.cssText = v;
      else if (k.includes("-")) node.setAttribute(k, v);
      else node[k] = v;
    });
    [].concat(children).forEach((c) => c != null && node.append(c));
    return node;
  }

  function sparkPath() {
    // невеликий випадковий «графік» для прикраси картки
    let y = 20 + Math.random() * 10;
    let d = `M0 ${y.toFixed(1)}`;
    for (let x = 10; x <= 100; x += 10) {
      y = Math.min(32, Math.max(2, y + (Math.random() - 0.55) * 12));
      d += ` L${x} ${y.toFixed(1)}`;
    }
    return d;
  }

  // ------------------------------------------------- перевірка банку питань
  function validateQuestions() {
    const counts = {};
    QUESTIONS.forEach((q, i) => {
      if (!DEPARTMENTS[q.dept]) console.warn(`Питання #${i + 1}: невідома кафедра "${q.dept}"`);
      if (!Array.isArray(q.options) || q.options.length !== 3) console.warn(`Питання #${i + 1}: має бути рівно 3 варіанти`);
      if (![0, 1, 2].includes(q.correct)) console.warn(`Питання #${i + 1}: correct має бути 0, 1 або 2`);
      counts[q.dept] = (counts[q.dept] || 0) + 1;
    });
    console.info("Business Lab: питань по кафедрах", counts, "всього:", QUESTIONS.length);
  }

  // ------------------------------------------------------ вибір 10 питань
  function pickQuestions() {
    const n = Math.min(GAME_CONFIG.cardsPerGame, QUESTIONS.length);
    let picked = [];

    if (GAME_CONFIG.balancedByDepartment) {
      // по одному випадковому питанню з кожної кафедри…
      const byDept = {};
      QUESTIONS.forEach((q) => (byDept[q.dept] = byDept[q.dept] || []).push(q));
      shuffle(Object.keys(byDept)).forEach((dept) => {
        if (picked.length < n) picked.push(shuffle(byDept[dept])[0]);
      });
      // …а решту — випадково з усіх, що залишилися
      const rest = shuffle(QUESTIONS.filter((q) => !picked.includes(q)));
      picked = picked.concat(rest.slice(0, n - picked.length));
    } else {
      picked = shuffle(QUESTIONS).slice(0, n);
    }

    return shuffle(picked).map((q) => {
      let options = q.options.map((text, i) => ({ text, isCorrect: i === q.correct }));
      if (GAME_CONFIG.shuffleOptions) options = shuffle(options);
      return { q, options, answered: false, chosen: null, isCorrect: false, spark: sparkPath() };
    });
  }

  // ------------------------------------------------------------- рейтинг
  function loadBoard() {
    try {
      const raw = localStorage.getItem(GAME_CONFIG.storageKey);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }
  function saveBoard(list) {
    try { localStorage.setItem(GAME_CONFIG.storageKey, JSON.stringify(list)); } catch (e) { /* немає доступу */ }
  }
  function sortBoard(list) {
    // більше балів — вище; за рівних балів — швидший вище
    return list.slice().sort((a, b) => b.score - a.score || a.timeMs - b.timeMs || a.date - b.date);
  }

  // ---------------------------------------------------------------- стан
  const state = {
    player: "",
    cards: [],
    current: -1,
    selected: null,
    startedAt: 0,
    finishedAt: 0,
    timer: null,
    lastResultId: null
  };

  const score = () => state.cards.filter((c) => c.isCorrect).length;
  const done = () => state.cards.filter((c) => c.answered).length;

  // ------------------------------------------------------------- екрани
  function show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ----------------------------------------------------- стрічка й легенда
  function renderTicker() {
    const items = [];
    Object.values(DEPARTMENTS).forEach((d) => {
      const val = (80 + Math.random() * 120).toFixed(2);
      const ch = (Math.random() * 6 - 2).toFixed(2);
      const up = ch >= 0;
      items.push(
        `<span class="ticker-item"><b style="color:${d.color}">${d.ticker}</b> ${val} <span class="${up ? "up" : "down"}">${up ? "▲" : "▼"} ${Math.abs(ch)}%</span></span>`
      );
    });
    items.push(`<span class="ticker-item"><b>BLAB</b> 60 питань · 6 кафедр · 10 карток</span>`);
    const html = items.join("");
    $("#tickerTrack").innerHTML = html + html; // дубль для безшовної анімації
  }

  function renderLegend() {
    const box = $("#deptLegend");
    box.innerHTML = "";
    Object.values(DEPARTMENTS).forEach((d) => {
      box.append(
        el("span", { class: "legend-item" }, [
          el("span", { class: "code", text: d.ticker, style: `background:${d.color}` }),
          d.name
        ])
      );
    });
  }

  // --------------------------------------------------------- поле карток
  function renderBoard() {
    const grid = $("#cardsGrid");
    grid.innerHTML = "";
    state.cards.forEach((card, i) => {
      const d = DEPARTMENTS[card.q.dept];
      const btn = el("button", {
        class: "card" + (card.answered ? " done " + (card.isCorrect ? "correct" : "wrong") : ""),
        type: "button",
        style: `--c:${d.color}; animation-delay:${i * 45}ms`,
        "aria-label": `Картка ${i + 1}, ${d.name}${card.answered ? ", пройдена" : ""}`
      });
      btn.innerHTML = `
        <div class="card-top">
          <span class="card-ticker">${d.ticker}</span>
          <span class="card-label">Картка</span>
        </div>
        <div class="card-num">${i + 1}</div>
        <svg class="card-spark" viewBox="0 0 100 34" preserveAspectRatio="none"><path d="${card.spark}"/></svg>
        <div class="card-dept"></div>
        ${card.answered ? `<div class="card-stamp">${card.isCorrect ? "✓ +1 бал" : "✗ 0 балів"}</div>` : ""}
      `;
      btn.querySelector(".card-dept").textContent = d.name;
      btn.addEventListener("click", () => openCard(i));
      grid.append(btn);
    });
    updateKpis();
  }

  function updateKpis() {
    const total = state.cards.length;
    $("#kpiDone").textContent = done();
    $("#kpiTotal").textContent = total;
    $("#kpiScore").textContent = score();
    $("#kpiMax").textContent = total;
    $("#progressBar").style.width = `${(done() / total) * 100}%`;
    $("#finishBtn").hidden = done() < total;
  }

  function startTimer() {
    clearInterval(state.timer);
    const tick = () => ($("#kpiTime").textContent = formatTime(Date.now() - state.startedAt));
    tick();
    state.timer = setInterval(tick, 1000);
  }

  // -------------------------------------------------------- модальне вікно
  const modal = $("#modal");
  const modalCard = modal.querySelector(".modal-card");

  function openCard(i) {
    const card = state.cards[i];
    const d = DEPARTMENTS[card.q.dept];
    state.current = i;
    state.selected = null;

    modalCard.style.setProperty("--c", d.color);
    $("#modalDept").textContent = `${d.ticker} · ${d.name}`;
    $("#modalNum").textContent = `Картка ${i + 1} / ${state.cards.length}`;
    $("#modalQuestion").textContent = card.q.question;

    const opts = $("#modalOptions");
    opts.innerHTML = "";
    card.options.forEach((opt, idx) => {
      const b = el("button", { class: "option", type: "button" }, [
        el("span", { class: "letter", text: LETTERS[idx] }),
        el("span", { class: "opt-text", text: opt.text })
      ]);
      b.addEventListener("click", () => selectOption(idx));
      opts.append(b);
    });

    $("#modalFeedback").hidden = true;
    $("#confirmBtn").hidden = false;
    $("#confirmBtn").disabled = true;
    $("#backBtn").hidden = true;

    modal.hidden = false;
    document.body.style.overflow = "hidden";

    if (card.answered) {
      revealAnswer(card); // повторне відкриття — лише перегляд
    } else {
      opts.querySelector(".option").focus({ preventScroll: true });
    }
  }

  function selectOption(idx) {
    const card = state.cards[state.current];
    if (!card || card.answered) return;
    state.selected = idx;
    document.querySelectorAll("#modalOptions .option").forEach((b, i) => b.classList.toggle("selected", i === idx));
    $("#confirmBtn").disabled = false;
  }

  function confirmAnswer() {
    const card = state.cards[state.current];
    if (!card || card.answered || state.selected == null) return;
    card.answered = true;
    card.chosen = state.selected;
    card.isCorrect = card.options[state.selected].isCorrect;
    revealAnswer(card);
    renderBoard();
  }

  function revealAnswer(card) {
    const buttons = document.querySelectorAll("#modalOptions .option");
    buttons.forEach((b, i) => {
      const opt = card.options[i];
      b.disabled = true;
      b.classList.remove("selected");
      const mark = el("span", { class: "mark" });
      if (opt.isCorrect) {
        b.classList.add("is-correct");
        mark.textContent = "✓";
      } else if (i === card.chosen) {
        b.classList.add("is-wrong");
        mark.textContent = "✗";
      } else {
        b.classList.add("faded");
      }
      if (mark.textContent) b.append(mark);
    });

    const fb = $("#modalFeedback");
    fb.className = "feedback " + (card.isCorrect ? "good" : "bad");
    $("#modalVerdict").textContent = card.isCorrect ? "Правильно! +1 бал" : "Неправильно. 0 балів";
    const right = card.options.find((o) => o.isCorrect).text;
    $("#modalExplanation").textContent = card.isCorrect
      ? card.q.explanation
      : `Правильна відповідь: «${right}». ${card.q.explanation}`;
    fb.hidden = false;

    $("#confirmBtn").hidden = true;
    const back = $("#backBtn");
    back.hidden = false;
    back.textContent = done() === state.cards.length ? "Подивитися результат →" : "До карток →";
    back.focus({ preventScroll: true });
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    state.current = -1;
    if (done() === state.cards.length && !state.finishedAt) finishGame();
  }

  // ------------------------------------------------------- завершення
  function finishGame() {
    state.finishedAt = Date.now();
    clearInterval(state.timer);
    const timeMs = state.finishedAt - state.startedAt;
    const s = score();

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: state.player,
      score: s,
      total: state.cards.length,
      timeMs,
      date: Date.now()
    };
    const list = loadBoard();
    list.push(entry);
    saveBoard(list);
    state.lastResultId = entry.id;

    renderResult(entry);
    renderRating(entry.id);
    $("#resultCard").hidden = false;
    show("screenResult");
  }

  function gradeFor(s, total) {
    const p = s / total;
    if (p >= 0.9) return ["Бізнес-акула 🦈", "Блискуче! Ти мислиш як досвідчений підприємець."];
    if (p >= 0.7) return ["Перспективний стартапер", "Дуже добре — ще трохи, і ти на вершині рейтингу."];
    if (p >= 0.5) return ["Молодий підприємець", "Непогано! Переглянь пояснення до помилок і спробуй ще раз."];
    if (p >= 0.3) return ["Стажер", "Є над чим попрацювати — пояснення допоможуть розібратися."];
    return ["Початок кар'єри", "Кожен бізнес починається з першого кроку. Спробуй ще раз!"];
  }

  function renderResult(entry) {
    const [title, text] = gradeFor(entry.score, entry.total);
    $("#resultScore").textContent = entry.score;
    $("#resultCard .result-score small").textContent = `/ ${entry.total}`;
    $("#resultTitle").textContent = title;
    $("#resultText").textContent = text;
    $("#resultTime").textContent = formatTime(entry.timeMs);

    const sorted = sortBoard(loadBoard());
    const place = sorted.findIndex((r) => r.id === entry.id) + 1;
    $("#resultPlace").innerHTML = `Твоє місце в рейтингу: <b>${place}</b> із ${sorted.length}`;

    const bd = $("#resultBreakdown");
    bd.innerHTML = "";
    state.cards.forEach((c, i) => {
      bd.append(
        el("span", {
          class: c.isCorrect ? "ok" : "no",
          style: `--c:${DEPARTMENTS[c.q.dept].color}`,
          title: `Картка ${i + 1}: ${c.isCorrect ? "правильно" : "неправильно"} (${DEPARTMENTS[c.q.dept].ticker})`
        })
      );
    });
  }

  function renderRating(highlightId) {
    const sorted = sortBoard(loadBoard());
    const body = $("#ratingBody");
    body.innerHTML = "";
    $("#ratingEmpty").hidden = sorted.length > 0;
    const n = sorted.length;
    $("#ratingCount").textContent = `${n} ${n % 10 === 1 && n % 100 !== 11 ? "учасник" : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? "учасники" : "учасників"}`;

    sorted.forEach((r, i) => {
      const place = i + 1;
      const tr = el("tr", { class: r.id === highlightId ? "me" : "" });
      const nameTd = el("td", { text: r.name });
      if (r.id === highlightId) nameTd.append(el("span", { class: "you-tag", text: "ти" }));
      tr.append(
        el("td", {}, el("span", { class: "place" + (place <= 3 ? ` p${place}` : ""), text: String(place) })),
        nameTd,
        el("td", { text: `${r.score} із ${r.total}` }),
        el("td", { text: formatTime(r.timeMs) }),
        el("td", { text: String(r.score) })
      );
      body.append(tr);
    });

    const me = body.querySelector("tr.me");
    if (me) setTimeout(() => me.scrollIntoView({ block: "nearest", behavior: "smooth" }), 400);
  }

  // ------------------------------------------------------------ старт
  function startGame(name) {
    state.player = name;
    state.cards = pickQuestions();
    state.current = -1;
    state.selected = null;
    state.startedAt = Date.now();
    state.finishedAt = 0;
    $("#boardPlayer").textContent = name;
    renderBoard();
    startTimer();
    show("screenBoard");
  }

  // ------------------------------------------------------------ події
  $("#startForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#playerName").value.trim().replace(/\s+/g, " ");
    if (!name) { $("#playerName").focus(); return; }
    startGame(name);
  });

  $("#openRatingBtn").addEventListener("click", () => {
    $("#resultCard").hidden = true;
    renderRating(null);
    show("screenResult");
  });

  $("#confirmBtn").addEventListener("click", confirmAnswer);
  $("#backBtn").addEventListener("click", closeModal);
  modal.querySelectorAll("[data-close]").forEach((n) => n.addEventListener("click", closeModal));
  $("#finishBtn").addEventListener("click", () => { if (!state.finishedAt) finishGame(); else show("screenResult"); });

  $("#playAgainBtn").addEventListener("click", () => startGame(state.player));
  $("#backToStartBtn").addEventListener("click", () => { clearInterval(state.timer); show("screenStart"); });
  $("#clearRatingBtn").addEventListener("click", () => {
    if (confirm("Видалити всі результати з рейтингу на цьому комп'ютері?")) {
      saveBoard([]);
      renderRating(null);
    }
  });

  // клавіатура: 1/2/3 або A/B/C — вибір, Enter — підтвердити, Esc — закрити
  document.addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    const card = state.cards[state.current];
    const k = e.key.toLowerCase();
    const map = { "1": 0, "2": 1, "3": 2, a: 0, b: 1, c: 2 };
    const onOption = document.activeElement && document.activeElement.classList.contains("option");
    if (e.key === "Escape") closeModal();
    else if (card && !card.answered && k in map) selectOption(map[k]);
    else if (e.key === "Enter" && !onOption && card && !card.answered && state.selected != null) { e.preventDefault(); confirmAnswer(); }
  });

  // попередження, якщо закрити вкладку посеред гри
  window.addEventListener("beforeunload", (e) => {
    if (state.startedAt && !state.finishedAt && done() > 0) { e.preventDefault(); e.returnValue = ""; }
  });

  // ------------------------------------------------------------ init
  validateQuestions();
  renderTicker();
  renderLegend();
  $("#sessionId").textContent = "#" + String(Math.floor(1000 + Math.random() * 9000));
})();
