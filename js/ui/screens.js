/* =========================================================================
   ui/screens.js — перемикання екранів, кафедри в хедері, меню (≡)
   ========================================================================= */
BL.screens = {
  /** Показати один екран: "screenStart" | "screenBoard" | "screenResult" */
  show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
    BL.menu.close();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  /** Кафедри факультету: у хедері (короткі назви) та в меню (повні назви) */
  renderHeader() {
    const { $, el } = BL.utils;
    const nav = $("#deptNav");
    const list = $("#menuDepts");
    nav.innerHTML = "";
    list.innerHTML = "";

    Object.values(BL.departments).forEach((d) => {
      nav.append(
        el("li", {}, el("span", { class: "dept-chip", style: `--c:${d.color}`, title: d.name }, [
          el("i", { class: "dept-dot" }),
          d.short
        ]))
      );
      list.append(
        el("li", { class: "menu-dept", style: `--c:${d.color}` }, [el("i", { class: "dept-dot" }), d.name])
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

/* ---------------------------------------------------------- меню (≡) */
BL.menu = {
  get btn() { return BL.utils.$("#menuBtn"); },
  get panel() { return BL.utils.$("#menu"); },

  isOpen() { return !this.panel.hidden; },

  open() {
    this.panel.hidden = false;
    this.btn.setAttribute("aria-expanded", "true");
  },

  close() {
    if (!this.panel) return;
    this.panel.hidden = true;
    this.btn.setAttribute("aria-expanded", "false");
  },

  toggle() { this.isOpen() ? this.close() : this.open(); },

  /** onAction(name) викликається для кнопок меню з data-action */
  init(onAction) {
    this.btn.addEventListener("click", (e) => { e.stopPropagation(); this.toggle(); });
    this.panel.addEventListener("click", (e) => {
      const action = e.target.closest("[data-action]");
      if (action) { this.close(); onAction(action.dataset.action); }
    });
    document.addEventListener("click", (e) => {
      if (this.isOpen() && !this.panel.contains(e.target)) this.close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen()) { this.close(); this.btn.focus(); }
    });
  }
};
