/* =========================================================================
   core/leaderboard.js — збереження та сортування рейтингу
   Зараз результати зберігаються в браузері (localStorage).
   Щоб зробити спільний рейтинг для різних пристроїв, достатньо
   переписати лише цей файл (наприклад, під Firebase) — решта гри не зміниться.
   ========================================================================= */
BL.leaderboard = {
  /** Усі збережені результати */
  load() {
    try {
      const raw = localStorage.getItem(BL.config.storageKey);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },

  save(list) {
    try {
      localStorage.setItem(BL.config.storageKey, JSON.stringify(list));
    } catch (e) {
      /* браузер заборонив збереження — просто пропускаємо */
    }
  },

  /** Більше балів — вище; за рівних балів — швидший вище */
  sorted() {
    return this.load().sort((a, b) => b.score - a.score || a.timeMs - b.timeMs || a.date - b.date);
  },

  /** Додати результат, повертає збережений запис */
  add({ name, score, total, timeMs }) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name, score, total, timeMs,
      date: Date.now()
    };
    const list = this.load();
    list.push(entry);
    this.save(list);
    return entry;
  },

  /** Місце запису в рейтингу (1, 2, 3 …) */
  placeOf(id) {
    return this.sorted().findIndex((r) => r.id === id) + 1;
  },

  clear() {
    this.save([]);
  }
};
