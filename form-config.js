/**
 * Настройка формы заявок (без Web3Forms).
 *
 * 1) FormSubmit — письма на почту (основной канал)
 *    При первой заявке на svpodols@mail.ru придёт письмо «Activate Form».
 *    Откройте его и нажмите ссылку — после этого заявки будут приходить на почту.
 *
 * 2) Telegram — мгновенные уведомления (рекомендуется как запасной канал)
 *    а) В Telegram найдите @BotFather → /newbot → скопируйте токен бота
 *    б) Напишите боту любое сообщение
 *    в) Откройте в браузере:
 *       https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates
 *       и найдите "chat":{"id": ЧИСЛО}
 *    г) Вставьте токен и chat id ниже
 */
window.FORM_CONFIG = {
  recipientEmail: "svpodols@mail.ru",
  fromName: "Сайт — Светлана Подольская",

  // Оставьте пустым, если Telegram не нужен
  telegramBotToken: "",
  telegramChatId: "",
};
