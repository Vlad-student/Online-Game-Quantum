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
    BL.screens.show("screenBoard"); // спочатку показати, щоб поле мало ширину
    BL.board.render();
    BL.board.startTimer();
  }

  /** Вийти з незавершеної гри (з підтвердженням, якщо вже є відповіді) */
  function leaveGame() {
    if (BL.game.isRunning() && BL.game.answeredCount() > 0 &&
        !confirm("Вийти з гри? Поточний результат не збережеться.")) {
      return false;
    }
    if (BL.game.isRunning()) BL.game.reset();
    BL.board.stopTimer();
    return true;
  }

  function goHome() {
    if (leaveGame()) BL.screens.show("screenStart");
  }

  function openRules() {
    if (!leaveGame()) return;
    BL.screens.show("screenStart");
    const rules = $("#rules");
    rules.open = true;
    setTimeout(() => rules.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
  }

  function openRating() {
    if (leaveGame()) BL.results.showRatingOnly();
  }

  // --- хедер і меню
  $("#logoLink").addEventListener("click", (e) => { e.preventDefault(); goHome(); });
  BL.menu.init((action) => {
    if (action === "home") goHome();
    else if (action === "rating") openRating();
    else if (action === "rules") openRules();
  });

  // --- стартовий екран
  $("#startForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#playerName").value.trim().replace(/\s+/g, " ");
    if (!name) { $("#playerName").focus(); return; }
    startGame(name);
  });
  $("#openRatingBtn").addEventListener("click", openRating);

  // --- поле карток
  $("#finishBtn").addEventListener("click", () => {
    if (BL.game.isRunning()) BL.results.finish();
    else BL.screens.show("screenResult");
  });
  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => BL.board.layout());
  });

  // --- вікно завдання
  $("#confirmBtn").addEventListener("click", () => BL.modal.confirm());
  $("#backBtn").addEventListener("click", () => BL.modal.close());
  document.querySelectorAll("#modal [data-close]").forEach((n) => n.addEventListener("click", () => BL.modal.close()));
  document.addEventListener("keydown", (e) => BL.modal.handleKey(e));

  // --- результат і рейтинг
  $("#playAgainBtn").addEventListener("click", () => startGame(BL.game.player));
  $("#backToStartBtn").addEventListener("click", goHome);
  $("#clearRatingBtn").addEventListener("click", () => BL.results.clearRating());

  // попередження, якщо закрити вкладку посеред гри
  window.addEventListener("beforeunload", (e) => {
    if (BL.game.isRunning() && BL.game.answeredCount() > 0) { e.preventDefault(); e.returnValue = ""; }
  });

  // --- ініціалізація
  BL.game.validateQuestions();
  BL.screens.renderHeader();
  BL.screens.renderStats();
})();
