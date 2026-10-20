/* =========================================================================
   ui/results.js — підсумковий екран і таблиця рейтингу студентів
   ========================================================================= */
BL.results = {
  /** Кінець гри: зберегти результат і одразу показати рейтинг */
  finish() {
    BL.board.stopTimer();
    const entry = BL.game.finish();
    this.renderSummary(entry);
    this.renderRating(entry.id);
    BL.utils.$("#resultCard").hidden = false;
    BL.screens.show("screenResult");
  },

  /** Лише рейтинг (кнопка «Переглянути рейтинг» на старті) */
  showRatingOnly() {
    BL.utils.$("#resultCard").hidden = true;
    this.renderRating(null);
    BL.screens.show("screenResult");
  },

  renderSummary(entry) {
    const { $, el, formatTime } = BL.utils;
    const { title, text } = BL.game.grade(entry.score, entry.total);

    $("#resultScore").textContent = entry.score;
    $("#resultTotal").textContent = `/ ${entry.total}`;
    $("#resultTitle").textContent = title;
    $("#resultText").textContent = text;
    $("#resultTime").textContent = formatTime(entry.timeMs);

    const place = BL.leaderboard.placeOf(entry.id);
    const count = BL.leaderboard.load().length;
    $("#resultPlace").innerHTML = `Твоє місце в рейтингу: <b>${place}</b> із ${count}`;

    // смужка з 10 квадратиків: зелений — правильно, червоний — ні
    const bar = $("#resultBreakdown");
    bar.innerHTML = "";
    BL.game.cards.forEach((c, i) => {
      const d = BL.departments[c.q.dept];
      bar.append(el("span", {
        class: c.isCorrect ? "ok" : "no",
        style: `--c:${d.color}`,
        title: `Картка ${i + 1}: ${c.isCorrect ? "правильно" : "неправильно"} (${d.ticker})`
      }));
    });
  },

  /** Таблиця рейтингу; highlightId — підсвітити рядок поточного гравця */
  renderRating(highlightId) {
    const { $, el, formatTime, plural } = BL.utils;
    const rows = BL.leaderboard.sorted();
    const body = $("#ratingBody");
    body.innerHTML = "";

    $("#ratingEmpty").hidden = rows.length > 0;
    $("#ratingCount").textContent = `${rows.length} ${plural(rows.length, "учасник", "учасники", "учасників")}`;

    rows.forEach((r, i) => {
      const place = i + 1;
      const isMe = r.id === highlightId;
      const nameCell = el("td", { text: r.name });
      if (isMe) nameCell.append(el("span", { class: "you-tag", text: "ти" }));

      body.append(
        el("tr", { class: isMe ? "me" : "" }, [
          el("td", {}, el("span", { class: "place" + (place <= 3 ? ` p${place}` : ""), text: String(place) })),
          nameCell,
          el("td", { text: `${r.score} із ${r.total}` }),
          el("td", { text: formatTime(r.timeMs) }),
          el("td", { text: String(r.score) })
        ])
      );
    });

    const me = body.querySelector("tr.me");
    if (me) setTimeout(() => me.scrollIntoView({ block: "nearest", behavior: "smooth" }), 400);
  },

  clearRating() {
    if (confirm("Видалити всі результати з рейтингу на цьому комп'ютері?")) {
      BL.leaderboard.clear();
      this.renderRating(null);
    }
  }
};
