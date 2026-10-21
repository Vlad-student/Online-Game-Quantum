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

/* Кафедри факультету — показуються в хедері, у меню та на картках.
   name   — повна назва
   short  — коротка назва (хедер і картки)
   ticker — мітка на картці
   color  — колір картки цієї кафедри
   ink    — колір тексту поверх color (білий на темних, темний на світлих) */
BL.departments = {
  econ: { name: "Кафедра економіки",                       short: "Економіка",     ticker: "ECON", color: "#FFC400", ink: "#1B1400" },
  fin:  { name: "Кафедра фінансів і банківської справи",   short: "Фінанси",       ticker: "FIN",  color: "#2342F0", ink: "#FFFFFF" },
  mkt:  { name: "Кафедра маркетингу",                      short: "Маркетинг",     ticker: "MKT",  color: "#E8358A", ink: "#FFFFFF" },
  mgt:  { name: "Кафедра менеджменту",                     short: "Менеджмент",    ticker: "MGT",  color: "#7A3CF0", ink: "#FFFFFF" },
  it:   { name: "Кафедра інформаційних технологій",        short: "IT",            ticker: "IT",   color: "#12B5D6", ink: "#062530" },
  acc:  { name: "Кафедра обліку, аудиту та оподаткування", short: "Облік і аудит", ticker: "ACC",  color: "#FF7A1A", ink: "#2A1000" }
};

/* Спільний банк питань. Кожен файл із папки js/questions/
   додає сюди питання своєї кафедри через BL.addQuestions(). */
BL.questions = [];

BL.addQuestions = function (dept, list) {
  list.forEach((q) => BL.questions.push(Object.assign({ dept }, q)));
};
