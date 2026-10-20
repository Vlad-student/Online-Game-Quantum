/* =========================================================================
   ui/screens.js — перемикання екранів, бігуча стрічка, легенда кафедр
   ========================================================================= */
BL.screens = {
  /** Показати один екран: "screenStart" | "screenBoard" | "screenResult" */
  show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  /** Бігуча стрічка «котирувань» кафедр у верхній панелі */
  renderTicker() {
    const items = Object.values(BL.departments).map((d) => {
      const value = (80 + Math.random() * 120).toFixed(2);
      const change = Math.random() * 6 - 2;
      const up = change >= 0;
      return `<span class="ticker-item"><b style="color:${d.color}">${d.ticker}</b> ${value}
        <span class="${up ? "up" : "down"}">${up ? "▲" : "▼"} ${Math.abs(change).toFixed(2)}%</span></span>`;
    });
    items.push(`<span class="ticker-item"><b>BLAB</b> ${BL.questions.length} питань · ${Object.keys(BL.departments).length} кафедр · ${BL.config.cardsPerGame} карток</span>`);
    const html = items.join("");
    BL.utils.$("#tickerTrack").innerHTML = html + html; // дубль для безшовної анімації
  },

  /** Кольорова легенда кафедр на стартовому екрані */
  renderLegend() {
    const { el, $ } = BL.utils;
    const box = $("#deptLegend");
    box.innerHTML = "";
    Object.values(BL.departments).forEach((d) => {
      box.append(
        el("span", { class: "legend-item" }, [
          el("span", { class: "code", text: d.ticker, style: `background:${d.color}` }),
          d.name
        ])
      );
    });
  },

  /** Цифри на стартовому екрані (60 / 6 / 10) беруться з реальних даних */
  renderStats() {
    const { $ } = BL.utils;
    $("#statQuestions").textContent = BL.questions.length;
    $("#statDepts").textContent = Object.keys(BL.departments).length;
    $("#statCards").textContent = BL.config.cardsPerGame;
  }
};
