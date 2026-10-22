/* config.js — підключається ПЕРШИМ: створює простір імен BL,
   у який файли з js/questions/ додають питання своєї кафедри. */
window.BL = window.BL || {};
BL.questions = [];
BL.addQuestions = function (dept, list) {
  list.forEach((q) => BL.questions.push(Object.assign({ dept }, q)));
};
