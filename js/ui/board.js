/* =========================================================================
   ui/board.js — поле з 10 картками, лічильники та таймер
   ========================================================================= */
BL.board = {
  timer: null,

  render() {
    const { $ } = BL.utils;
    const grid = $("#cardsGrid");
    grid.innerHTML = "";
    BL.game.cards.forEach((card, i) => grid.append(this.createCard(card, i)));
    this.updateStats();
  },

  /** Одна картка-«актив» у кольорі своєї кафедри */
  createCard(card, i) {
    const d = BL.departments[card.q.dept];
    const status = card.answered ? ` done ${card.isCorrect ? "correct" : "wrong"}` : "";
    const btn = BL.utils.el("button", {
      class: "card" + status,
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
    btn.addEventListener("click", () => BL.modal.open(i));
    return btn;
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
