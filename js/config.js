/* =========================================================================
   config.js — налаштування гри та список кафедр
   Підключається ПЕРШИМ: створює спільний простір імен BL,
   у який інші файли додають свої частини.
   ========================================================================= */
window.BL = window.BL || {};

BL.config = {
  cardsPerGame: 10,           // скільки карток у грі
  balancedByDepartment: true, // true — у кожній грі є хоча б 1 питання з кожної кафедри
  shuffleOptions: true,       // перемішувати варіанти відповідей A/B/C
  storageKey: "businessLab.leaderboard.v1"
};

/* Кафедри: код → назва, коротка «біржова» мітка, колір картки.
   Назви можна змінити на точні назви ваших кафедр. */
BL.departments = {
  econ: { name: "Кафедра економіки",                       ticker: "ECON", color: "#F5B83D" },
  fin:  { name: "Кафедра фінансів і банківської справи",   ticker: "FIN",  color: "#5B8CFF" },
  mkt:  { name: "Кафедра маркетингу",                      ticker: "MKT",  color: "#F472B6" },
  mgt:  { name: "Кафедра менеджменту",                     ticker: "MGT",  color: "#A78BFA" },
  it:   { name: "Кафедра інформаційних технологій",        ticker: "IT",   color: "#2DD4E6" },
  acc:  { name: "Кафедра обліку, аудиту та оподаткування", ticker: "ACC",  color: "#EDE3CC" }
};

/* Спільний банк питань. Кожен файл із папки js/questions/
   додає сюди питання своєї кафедри через BL.addQuestions(). */
BL.questions = [];

BL.addQuestions = function (dept, list) {
  list.forEach((q) => BL.questions.push(Object.assign({ dept }, q)));
};
