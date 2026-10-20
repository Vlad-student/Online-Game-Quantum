/* =========================================================================
   main.js — запуск гри та обробники кнопок
   Підключається ОСТАННІМ, коли всі інші частини вже завантажені.
   ========================================================================= */
(function () {
  "use strict";
  const { $ } = BL.utils;

  function startGame(name) {
    BL.game.start(name);
    $("#boardPlayer").textContent = name;
    BL.board.render();
    BL.board.startTimer();
    BL.screens.show("screenBoard");
  }

  // --- стартовий екран
  $("#startForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#playerName").value.trim().replace(/\s+/g, " ");
    if (!name) { $("#playerName").focus(); return; }
    startGame(name);
  });
  $("#openRatingBtn").addEventListener("click", () => BL.results.showRatingOnly());

  // --- поле карток
  $("#finishBtn").addEventListener("click", () => {
    if (BL.game.isRunning()) BL.results.finish();
    else BL.screens.show("screenResult");
  });

  // --- вікно завдання
  $("#confirmBtn").addEventListener("click", () => BL.modal.confirm());
  $("#backBtn").addEventListener("click", () => BL.modal.close());
  document.querySelectorAll("#modal [data-close]").forEach((n) => n.addEventListener("click", () => BL.modal.close()));
  document.addEventListener("keydown", (e) => BL.modal.handleKey(e));

  // --- результат і рейтинг
  $("#playAgainBtn").addEventListener("click", () => startGame(BL.game.player));
  $("#backToStartBtn").addEventListener("click", () => {
    BL.board.stopTimer();
    BL.screens.show("screenStart");
  });
  $("#clearRatingBtn").addEventListener("click", () => BL.results.clearRating());

  // попередження, якщо закрити вкладку посеред гри
  window.addEventListener("beforeunload", (e) => {
    if (BL.game.isRunning() && BL.game.answeredCount() > 0) { e.preventDefault(); e.returnValue = ""; }
  });

  // --- ініціалізація
  BL.game.validateQuestions();
  BL.screens.renderTicker();
  BL.screens.renderLegend();
  BL.screens.renderStats();
  $("#sessionId").textContent = "#" + Math.floor(1000 + Math.random() * 9000);
})();
