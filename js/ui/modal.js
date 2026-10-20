/* =========================================================================
   ui/modal.js — вікно завдання: питання, 3 варіанти, перевірка, пояснення
   ========================================================================= */
BL.modal = {
  LETTERS: ["A", "B", "C"],
  current: -1,    // індекс відкритої картки
  selected: null, // обраний, але ще не підтверджений варіант

  get root() { return BL.utils.$("#modal"); },
  isOpen() { return !this.root.hidden; },
  currentCard() { return BL.game.cards[this.current]; },

  open(index) {
    const { $, el } = BL.utils;
    const card = BL.game.cards[index];
    const d = BL.departments[card.q.dept];
    this.current = index;
    this.selected = null;

    this.root.querySelector(".modal-card").style.setProperty("--c", d.color);
    $("#modalDept").textContent = `${d.ticker} · ${d.name}`;
    $("#modalNum").textContent = `Картка ${index + 1} / ${BL.game.cards.length}`;
    $("#modalQuestion").textContent = card.q.question;

    const box = $("#modalOptions");
    box.innerHTML = "";
    card.options.forEach((opt, i) => {
      const btn = el("button", { class: "option", type: "button" }, [
        el("span", { class: "letter", text: this.LETTERS[i] }),
        el("span", { class: "opt-text", text: opt.text })
      ]);
      btn.addEventListener("click", () => this.select(i));
      box.append(btn);
    });

    $("#modalFeedback").hidden = true;
    $("#confirmBtn").hidden = false;
    $("#confirmBtn").disabled = true;
    $("#backBtn").hidden = true;

    this.root.hidden = false;
    document.body.style.overflow = "hidden";

    if (card.answered) this.reveal(card);              // повторне відкриття — лише перегляд
    else box.querySelector(".option").focus({ preventScroll: true });
  },

  /** Вибір варіанта (до підтвердження можна передумати) */
  select(i) {
    const card = this.currentCard();
    if (!card || card.answered) return;
    this.selected = i;
    document.querySelectorAll("#modalOptions .option").forEach((b, idx) => b.classList.toggle("selected", idx === i));
    BL.utils.$("#confirmBtn").disabled = false;
  },

  /** Підтвердження: після цього відповідь змінити не можна */
  confirm() {
    if (this.selected == null) return;
    if (!BL.game.answer(this.current, this.selected)) return;
    this.reveal(this.currentCard());
    BL.board.render();
  },

  /** Зелений — правильний варіант, червоний — помилковий, + пояснення */
  reveal(card) {
    const { $, el } = BL.utils;
    document.querySelectorAll("#modalOptions .option").forEach((btn, i) => {
      const opt = card.options[i];
      btn.disabled = true;
      btn.classList.remove("selected");
      let mark = "";
      if (opt.isCorrect) { btn.classList.add("is-correct"); mark = "✓"; }
      else if (i === card.chosen) { btn.classList.add("is-wrong"); mark = "✗"; }
      else btn.classList.add("faded");
      if (mark) btn.append(el("span", { class: "mark", text: mark }));
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
    back.textContent = BL.game.isComplete() && BL.game.isRunning() ? "Подивитися результат →" : "До карток →";
    back.focus({ preventScroll: true });
  },

  close() {
    this.root.hidden = true;
    document.body.style.overflow = "";
    this.current = -1;
    if (BL.game.isComplete() && BL.game.isRunning()) BL.results.finish();
  },

  /** Клавіатура: 1/2/3 або A/B/C — вибір, Enter — підтвердити, Esc — закрити */
  handleKey(e) {
    if (!this.isOpen()) return;
    const card = this.currentCard();
    const map = { "1": 0, "2": 1, "3": 2, a: 0, b: 1, c: 2 };
    const key = e.key.toLowerCase();
    const onOption = document.activeElement && document.activeElement.classList.contains("option");

    if (e.key === "Escape") this.close();
    else if (card && !card.answered && key in map) this.select(map[key]);
    else if (e.key === "Enter" && !onOption && card && !card.answered && this.selected != null) {
      e.preventDefault();
      this.confirm();
    }
  }
};
