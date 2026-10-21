/* =========================================================================
   ui/board.js — поле з 10 картками-«стільниками», лічильники та таймер
   ========================================================================= */
BL.board = {
  timer: null,

  render() {
    const grid = BL.utils.$("#cardsGrid");
    grid.innerHTML = "";
    BL.game.cards.forEach((card, i) => grid.append(this.createCard(card, i)));
    this.layout();
    this.updateStats();
  },

  /** Одна шестикутна картка в кольорі своєї кафедри */
  createCard(card, i) {
    const d = BL.departments[card.q.dept];
    const status = card.answered ? ` done ${card.isCorrect ? "correct" : "wrong"}` : "";
    const btn = BL.utils.el("button", {
      class: "hex-card" + status,
      type: "button",
      style: `--c:${d.color}; --ink-c:${d.ink}; animation-delay:${i * 50}ms`,
      "aria-label": `Картка ${i + 1}, ${d.name}${card.answered ? (card.isCorrect ? ", правильно" : ", неправильно") : ""}`
    });
    btn.innerHTML = `
      <span class="hx-border"></span>
      <span class="hx-gap"></span>
      <span class="hx-face"></span>
      <span class="hx-content">
        <span class="hx-ticker">${d.ticker}</span>
        <span class="hx-num">${i + 1}</span>
        <span class="hx-name"></span>
      </span>
      ${card.answered ? `<span class="hx-stamp">${card.isCorrect ? "✓ +1 бал" : "✗ 0 балів"}</span>` : ""}
    `;
    btn.querySelector(".hx-name").textContent = d.short;
    btn.addEventListener("click", () => BL.modal.open(i));
    return btn;
  },

  /** Скільки карток у ряду залежно від ширини поля */
  columnsFor(width) {
    if (width >= 900) return 5;
    if (width >= 640) return 4;
    if (width >= 430) return 3;
    return 2;
  },

  /** Розкладка «стільниками»: кожен другий ряд зсунутий на пів картки,
      неповний останній ряд вирівнюється по центру */
  layout() {
    const grid = BL.utils.$("#cardsGrid");
    const width = grid.clientWidth;
    if (!width) return; // поле ще приховане

    const cols = this.columnsFor(width);
    grid.style.setProperty("--cols", cols);
    grid.style.gridTemplateColumns = `repeat(${cols * 2 + 1}, minmax(0, 1fr))`;

    const items = [...grid.children];
    items.forEach((item, i) => {
      const row = Math.floor(i / cols);
      const inRow = Math.min(cols, items.length - row * cols);
      const slot = (i % cols) + Math.floor((cols - inRow) / 2);
      const start = 1 + (row % 2) + slot * 2;
      item.style.gridColumn = `${start} / span 2`;
      item.style.gridRow = String(row + 1);
    });
  },

  /** «Пройдено карток», «Ваш результат», смуга прогресу */
  updateStats() {
    const { $ } = BL.utils;
    const total = BL.game.cards.length;
    const done = BL.game.answeredCount();
    $("#kpiDone").textContent = done;
    $("#kpiTotal").textContent = total;
    $("#kpiScore").textContent = BL.game.score();
    $("#kpiMax").textContent = total;
    $("#progressBar").style.width = `${(done / total) * 100}%`;
    $("#finishBtn").hidden = !BL.game.isComplete();
  },

  startTimer() {
    this.stopTimer();
    const tick = () => (BL.utils.$("#kpiTime").textContent = BL.utils.formatTime(BL.game.elapsed()));
    tick();
    this.timer = setInterval(tick, 1000);
  },

  stopTimer() {
    clearInterval(this.timer);
  }
};
