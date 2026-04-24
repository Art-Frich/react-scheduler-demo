import { useState } from "react";

interface Option {
  text: string;
  correct: boolean;
  explain: string;
}

interface Question {
  title: string;
  context: string;
  options: Option[];
  reference: string;
}

const QUESTIONS: Question[] = [
  {
    title: "Fiber-согласователь",
    context: "Что такое Fiber-согласователь React и как он способствует работе со сложными высокопроизводительными приложениями?",
    options: [
      {
        text: "Это старый алгоритм из React 15, который заменили на виртуальный DOM",
        correct: false,
        explain: "Наоборот — Fiber пришёл на замену stack-согласователю в React 16 и работает поверх virtual DOM.",
      },
      {
        text: "Ядро конкурентного рендеринга: разбивает работу на мелкие фрагменты и управляет приоритетом, позволяя рендеру быть прерываемым",
        correct: true,
        explain: "Fiber — структура данных и алгоритм обхода дерева, где каждый узел (fiber node) можно обработать независимо. Именно эта архитектура делает возможным прерывание рендера.",
      },
      {
        text: "Оптимизация, которая просто быстрее пересчитывает diff компонентов",
        correct: false,
        explain: "Это побочный эффект, но не суть. Главное Fiber — возможность прерывать и возобновлять работу.",
      },
    ],
    reference: "См. вкладку 3 «Планировщик React» — визуализация ensureRootIsScheduled",
  },
  {
    title: "Планирование и отсрочка обновлений",
    context: "Как React поддерживает бесперебойную работу при большой нагрузке?",
    options: [
      {
        text: "Делает все обновления через setTimeout чтобы не блокировать UI",
        correct: false,
        explain: "setTimeout не используется как основной механизм. React планирует работу через микрозадачи и MessageChannel, выбирая приоритет по lane.",
      },
      {
        text: "Запускает все обновления в Web Worker параллельно",
        correct: false,
        explain: "React работает в main thread. Главная идея — не параллелизм, а приоритизация и прерывание.",
      },
      {
        text: "Присваивает обновлениям приоритет и откладывает низкоприоритетные в пользу высокоприоритетных (например, ввод пользователя)",
        correct: true,
        explain: "Это суть конкурентного рендеринга. Ввод → Sync lane (немедленно). Транзиции → Transition lane (в макрозадаче, после paint). React может прервать низкоприоритетный рендер ради высокоприоритетного.",
      },
    ],
    reference: "См. вкладки 1–2 «Медленный/Быстрый чат» и вкладку 4 «Event Loop»",
  },
  {
    title: "Полосы рендеринга (lanes)",
    context: "Что такое полосы рендеринга и как они работают с растровыми масками (bitmasks)?",
    options: [
      {
        text: "Каждая полоса — бит в 32-битном числе. Обновление помечается lane'ом, несколько обновлений = OR нескольких бит. Это позволяет дёшево проверять и комбинировать приоритеты битовыми операциями",
        correct: true,
        explain: "Именно так. Sync = 0b0001, InputContinuous = 0b0010, Default = 0b0100, Transition = 0b1000 и т.д. Проверка «есть ли sync-работа» — это просто lanes & SyncLane.",
      },
      {
        text: "Это отдельные потоки (threads) браузера, каждый со своим приоритетом",
        correct: false,
        explain: "JavaScript однопоточный. Lanes — чисто логическое разделение внутри одного потока.",
      },
      {
        text: "Массив объектов {priority, update}, который React сортирует на каждом рендере",
        correct: false,
        explain: "Слишком дорого. React использует битовые маски именно потому что это O(1) операция.",
      },
    ],
    reference: "См. вкладку 3 «Планировщик React» — блок Lanes",
  },
  {
    title: "useTransition vs useDeferredValue",
    context: "Цель двух хуков и когда каждый полезен?",
    options: [
      {
        text: "Это один и тот же хук с разным синтаксисом — выбирай любой",
        correct: false,
        explain: "Механика общая (оба уходят в Transition lane), но применимость разная.",
      },
      {
        text: "useTransition — когда ты контролируешь setState (оборачиваешь вызов). useDeferredValue — когда значение приходит снаружи (пропс, библиотека) и ты не можешь дотянуться до setState",
        correct: true,
        explain: "Точно. useDeferredValue — это по сути useEffect + startTransition(setState), применённый снаружи. Используй его для чужих значений, startTransition — для своих.",
      },
      {
        text: "useTransition для анимаций, useDeferredValue для сетевых запросов",
        correct: false,
        explain: "Ни то, ни другое. Оба — о приоритете рендеринга, не об анимациях или сети.",
      },
    ],
    reference: "См. вкладки 2 «Быстрый чат» (useTransition) и 5 «useDeferredValue»",
  },
  {
    title: "Когда НЕ использовать useDeferredValue",
    context: "Какие компромиссы у этого хука?",
    options: [
      {
        text: "Никогда — он всегда делает приложение быстрее",
        correct: false,
        explain: "Неверно. Он откладывает обновление — значит пользователь какое-то время видит устаревшее значение. Это приемлемо не всегда.",
      },
      {
        text: "Когда обновление — прямой ответ на действие пользователя (ввод текста в поле, клик по чекбоксу). Такие обновления должны быть мгновенными, иначе UI ощущается «сломанным»",
        correct: true,
        explain: "Именно. Правило из книги: «если обновление побуждает пользователя ожидать реакции — его нельзя откладывать». Defer — только для дорогих производных вычислений (список, график, preview).",
      },
      {
        text: "Когда у пользователя медленный интернет",
        correct: false,
        explain: "useDeferredValue не связан с сетью — только с приоритетом рендеринга внутри React.",
      },
    ],
    reference: "См. вкладку 5 «useDeferredValue» — info card",
  },
];

interface AnswerState {
  [questionIdx: number]: number; // индекс выбранного варианта
}

export default function Quiz() {
  const [answers, setAnswers] = useState<AnswerState>({});

  const handleSelect = (qIdx: number, optIdx: number) => {
    if (answers[qIdx] !== undefined) return; // нельзя переотвечать
    setAnswers({ ...answers, [qIdx]: optIdx });
  };

  const handleReset = () => setAnswers({});

  const answered = Object.keys(answers).length;
  const correct = Object.entries(answers).filter(
    ([qIdx, optIdx]) => QUESTIONS[Number(qIdx)].options[optIdx].correct
  ).length;
  const allAnswered = answered === QUESTIONS.length;

  return (
    <div className="section">
      <h2>Проверь себя</h2>
      <p className="subtitle">
        5 вопросов по конкурентному React. Вопросы из книги — ответь на каждый, чтобы увидеть объяснение.
      </p>

      <div className="quiz-progress">
        <div className="quiz-progress-bar">
          <div
            className="quiz-progress-fill"
            style={{ width: `${(answered / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <div className="quiz-progress-text">
          {allAnswered ? (
            <>
              <strong className={correct === QUESTIONS.length ? "quiz-perfect" : ""}>
                {correct} / {QUESTIONS.length}
              </strong>{" "}
              {correct === QUESTIONS.length ? "идеально!" : "правильных ответов"}
              <button className="quiz-reset" onClick={handleReset}>сбросить</button>
            </>
          ) : (
            <>Отвечено {answered} из {QUESTIONS.length}</>
          )}
        </div>
      </div>

      <div className="quiz-list">
        {QUESTIONS.map((q, qIdx) => {
          const selected = answers[qIdx];
          const hasAnswer = selected !== undefined;

          return (
            <div key={qIdx} className="quiz-card">
              <div className="quiz-card-header">
                <div className="quiz-card-num">Вопрос {qIdx + 1}</div>
                <h3 className="quiz-card-title">{q.title}</h3>
                <p className="quiz-card-context">{q.context}</p>
              </div>

              <div className="quiz-options">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selected === optIdx;
                  const showAsCorrect = hasAnswer && opt.correct;
                  const showAsWrong = hasAnswer && isSelected && !opt.correct;

                  let stateClass = "";
                  if (showAsCorrect) stateClass = "correct";
                  else if (showAsWrong) stateClass = "wrong";
                  else if (hasAnswer) stateClass = "dim";

                  return (
                    <button
                      key={optIdx}
                      className={`quiz-option ${stateClass}`}
                      onClick={() => handleSelect(qIdx, optIdx)}
                      disabled={hasAnswer}
                    >
                      <span className="quiz-option-marker">
                        {showAsCorrect ? "✓" : showAsWrong ? "✗" : String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="quiz-option-text">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {hasAnswer && (
                <div className={`quiz-explain ${q.options[selected].correct ? "correct" : "wrong"}`}>
                  <div className="quiz-explain-label">
                    {q.options[selected].correct ? "Верно" : "Не совсем"}
                  </div>
                  <div className="quiz-explain-text">
                    {q.options[selected].explain}
                  </div>
                  {!q.options[selected].correct && (
                    <div className="quiz-explain-correct">
                      <strong>Правильный ответ:</strong>{" "}
                      {q.options.find((o) => o.correct)!.text}
                    </div>
                  )}
                  <div className="quiz-explain-ref">{q.reference}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
