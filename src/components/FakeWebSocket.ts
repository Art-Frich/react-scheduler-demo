const NAMES = ["Алиса", "Борис", "Вика", "Глеб", "Даша", "Егор", "Жанна"];
const MESSAGES = [
  "Привет! Как дела?",
  "Кто видел последний коммит?",
  "Деплой прошёл успешно",
  "Нужен код-ревью на PR #42",
  "Встреча через 10 минут",
  "Кто-нибудь тестировал новый API?",
  "Баг в продакшене!",
  "Исправил, мерджу",
  "Ланч?",
  "Документация обновлена",
  "CI опять сломался",
  "Перезапустил пайплайн",
  "Всем хорошего вечера!",
  "Новый тикет в Jira",
  "Кто дежурит сегодня?",
  "Релиз в пятницу",
  "Тесты зелёные",
  "Откатил последний коммит",
  "Проверьте staging",
  "Обновил зависимости",
];

export interface FakeMessage {
  id: number;
  author: string;
  text: string;
  timestamp: number;
}

let nextId = 1;

function randomMessage(): FakeMessage {
  return {
    id: nextId++,
    author: NAMES[Math.floor(Math.random() * NAMES.length)],
    text: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    timestamp: Date.now(),
  };
}

export function startFakeStream(
  onMessage: (msg: FakeMessage) => void,
  intervalMs: number = 200,
): () => void {
  const id = setInterval(() => onMessage(randomMessage()), intervalMs);
  return () => clearInterval(id);
}
