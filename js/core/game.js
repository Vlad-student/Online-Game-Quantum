/* =========================================================================
   core/game.js — стан гри та правила
   Тут немає роботи з HTML: лише дані, вибір питань і підрахунок балів.
   ========================================================================= */
BL.game = {
  player: "",
  cards: [],      // 10 карток поточної гри
  startedAt: 0,
  finishedAt: 0,
  resultId: null, // id запису в рейтингу після завершення

  /** Нова гра для гравця */
  start(name) {
    this.player = name;
    this.cards = this.pickCards();
    this.startedAt = Date.now();
    this.finishedAt = 0;
    this.resultId = null;
  },

  /** Випадковий вибір карток із банку питань (60 → 10) */
  pickCards() {
    const { shuffle, sparkPath } = BL.utils;
    const { cardsPerGame, balancedByDepartment, shuffleOptions } = BL.config;
    const all = BL.questions;
    const n = Math.min(cardsPerGame, all.length);
    let picked = [];

    if (balancedByDepartment) {
      // по одному випадковому питанню з кожної кафедри…
      const byDept = {};
      all.forEach((q) => (byDept[q.dept] = byDept[q.dept] || []).push(q));
      shuffle(Object.keys(byDept)).forEach((dept) => {
        if (picked.length < n) picked.push(shuffle(byDept[dept])[0]);
      });
      // …а решта — випадково з тих, що залишилися
      const rest = shuffle(all.filter((q) => !picked.includes(q)));
      picked = picked.concat(rest.slice(0, n - picked.length));
    } else {
      picked = shuffle(all).slice(0, n);
    }

    return shuffle(picked).map((q) => {
      let options = q.options.map((text, i) => ({ text, isCorrect: i === q.correct }));
      if (shuffleOptions) options = shuffle(options);
      return { q, options, answered: false, chosen: null, isCorrect: false, spark: sparkPath() };
    });
  },

  /** Зарахувати відповідь на картку. Повертає false, якщо відповідь уже була */
  answer(cardIndex, optionIndex) {
    const card = this.cards[cardIndex];
    if (!card || card.answered) return false;
    card.answered = true;
    card.chosen = optionIndex;
    card.isCorrect = card.options[optionIndex].isCorrect;
    return true;
  },

  score() {
    return this.cards.filter((c) => c.isCorrect).length;
  },

  answeredCount() {
    return this.cards.filter((c) => c.answered).length;
  },

  isComplete() {
    return this.cards.length > 0 && this.answeredCount() === this.cards.length;
  },

  isRunning() {
    return this.startedAt > 0 && !this.finishedAt;
  },

  elapsed() {
    return (this.finishedAt || Date.now()) - this.startedAt;
  },

  /** Завершити гру й записати результат у рейтинг */
  finish() {
    this.finishedAt = Date.now();
    const entry = BL.leaderboard.add({
      name: this.player,
      score: this.score(),
      total: this.cards.length,
      timeMs: this.elapsed()
    });
    this.resultId = entry.id;
    return entry;
  },

  /** Звання за результатом */
  grade(score, total) {
    const p = score / total;
    if (p >= 0.9) return { title: "Бізнес-акула 🦈", text: "Блискуче! Ти мислиш як досвідчений підприємець." };
    if (p >= 0.7) return { title: "Перспективний стартапер", text: "Дуже добре — ще трохи, і ти на вершині рейтингу." };
    if (p >= 0.5) return { title: "Молодий підприємець", text: "Непогано! Переглянь пояснення до помилок і спробуй ще раз." };
    if (p >= 0.3) return { title: "Стажер", text: "Є над чим попрацювати — пояснення допоможуть розібратися." };
    return { title: "Початок кар'єри", text: "Кожен бізнес починається з першого кроку. Спробуй ще раз!" };
  },

  /** Перевірка банку питань (повідомлення — у консолі браузера, F12) */
  validateQuestions() {
    const counts = {};
    BL.questions.forEach((q, i) => {
      const where = `Питання #${i + 1} (${q.dept})`;
      if (!BL.departments[q.dept]) console.warn(`${where}: невідома кафедра`);
      if (!Array.isArray(q.options) || q.options.length !== 3) console.warn(`${where}: має бути рівно 3 варіанти`);
      if (![0, 1, 2].includes(q.correct)) console.warn(`${where}: correct має бути 0, 1 або 2`);
      counts[q.dept] = (counts[q.dept] || 0) + 1;
    });
    console.info("Business Lab — питань по кафедрах:", counts, "усього:", BL.questions.length);
  }
};
