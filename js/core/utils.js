/* =========================================================================
   core/utils.js — дрібні допоміжні функції
   ========================================================================= */
BL.utils = {
  /** Короткий пошук елемента на сторінці */
  $(selector) {
    return document.querySelector(selector);
  },

  /** Перемішування масиву (алгоритм Фішера–Єйтса), оригінал не змінюється */
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  /** Мілісекунди → "мм:сс" */
  formatTime(ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  },

  /** Створення HTML-елемента: el("span", { class: "x", text: "..." }, [діти]) */
  el(tag, props = {}, children = []) {
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
  },

  /** Випадкова лінія-«графік» для прикраси картки (SVG path) */
  sparkPath() {
    let y = 20 + Math.random() * 10;
    let d = `M0 ${y.toFixed(1)}`;
    for (let x = 10; x <= 100; x += 10) {
      y = Math.min(32, Math.max(2, y + (Math.random() - 0.55) * 12));
      d += ` L${x} ${y.toFixed(1)}`;
    }
    return d;
  },

  /** Українська форма слова: 1 учасник, 2 учасники, 5 учасників */
  plural(n, one, few, many) {
    const n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
    return many;
  }
};
