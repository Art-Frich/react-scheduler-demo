# React Scheduler Demo — Спецификация

## Цель
Интерактивный учебный проект, демонстрирующий как React 19 планирует и откладывает обновления. Основан на материале главы 7 книги "Конкурентный React" (стр. 225–233).

## Концепция

Три раздела — от проблемы к решению, от решения к пониманию "почему это работает":

1. **SlowChat** — ощути проблему на себе
2. **FastChat** — ощути решение (A/B переключатель)
3. **SchedulerVisualizer** — пойми механизм: одна большая интерактивная визуализация, которая объединяет `ensureRootIsScheduled`, event loop, очереди задач и lanes в единую анимированную картину

## Структура проекта

```
react-scheduler-demo/
├── src/
│   ├── App.tsx                    # Роутинг между разделами
│   ├── main.tsx                   # Точка входа
│   │
│   ├── sections/
│   │   ├── SlowChat.tsx           # Раздел 1: "Медленный" чат
│   │   ├── FastChat.tsx           # Раздел 2: "Быстрый" чат (useTransition)
│   │   └── SchedulerVisualizer.tsx# Раздел 3: Визуализация всего механизма
│   │
│   ├── components/
│   │   ├── MessageList.tsx        # Список сообщений (общий)
│   │   ├── MessageInput.tsx       # Инпут (общий)
│   │   ├── HeavyMessage.tsx       # "Тяжёлый" компонент (имитация нагрузки)
│   │   ├── FakeWebSocket.ts       # Эмуляция входящих сообщений
│   │   ├── FpsMeter.tsx           # Индикатор FPS + input latency
│   │   └── Nav.tsx                # Навигация между разделами
│   │
│   ├── visualizer/
│   │   ├── SchedulerScene.tsx     # Главная сцена визуализатора
│   │   ├── CodePanel.tsx          # Подсвеченный код ensureRootIsScheduled с курсором-шагом
│   │   ├── EventLoopPanel.tsx     # Анимированные блоки: call stack, macrotask queue, microtask queue
│   │   ├── LanesPanel.tsx         # Полосы рендеринга (Sync, Default, Transition) как цветные дорожки
│   │   ├── RootScheduleList.tsx   # Linked list scheduled roots (анимация добавления)
│   │   ├── TimelineBar.tsx        # Горизонтальная шкала времени — "кадр браузера" 16мс
│   │   └── Controls.tsx           # Play/Pause/Step/Speed/Сценарий
│   │
│   └── styles/
│       └── global.css
│
├── docs/
│   └── ensureRootIsScheduled.md   # Актуальный исходный код из React 19 + разбор
│
├── SPEC.md
└── package.json
```

## Раздел 1: SlowChat — "Медленный интерфейс"

**Цель:** Дать пользователю _почувствовать_ проблему.

- `FakeWebSocket` шлёт входящие сообщения каждые 100–300мс.
- `HeavyMessage` — компонент с искусственной задержкой рендеринга (~50мс блокирующий цикл).
- `MessageInput` для ввода текста.
- **Эффект:** Ввод лагает, буквы появляются с задержкой.
- `FpsMeter` в углу — FPS и input latency в реальном времени.

## Раздел 2: FastChat — "Быстрый интерфейс"

**Цель:** Показать решение и дать сравнить.

- Тот же чат, но `setMessages` обёрнут в `startTransition`.
- `isPending` → индикатор загрузки рядом со списком.
- **Переключатель режима** прямо на странице: "Без transition" / "С transition".
- `FpsMeter` — видно разницу в цифрах.

## Раздел 3: SchedulerVisualizer — Как это работает под капотом

**Цель:** Визуализировать весь механизм планирования React в одной интерактивной сцене.

### Макет (слева направо / сверху вниз):

```
┌─────────────────────────────────────────────────────────────────────┐
│  [▶ Play] [⏸ Pause] [⏭ Step] [Speed: 1x/0.5x/0.25x]              │
│  Сценарий: [setState синхронный ▼] [setState в transition ▼]       │
├───────────────────────────┬─────────────────────────────────────────┤
│                           │                                         │
│   📄 Код                  │   🎬 Визуализация                       │
│   ensureRootIsScheduled   │                                         │
│                           │   ┌─ Call Stack ─────────────┐          │
│   function ensure...  ◀── │   │ onClick()                │          │
│     if (root === last..   │   │ setState()               │          │
│  ▶  } else {              │   │ ensureRootIsScheduled()  │          │
│       if (lastScheduled.. │   └──────────────────────────┘          │
│         firstScheduled..  │                                         │
│       ...                 │   ┌─ Root Schedule ──────────┐          │
│     }                     │   │ [Root #1] → [Root #2] → ∅│          │
│     mightHavePending..    │   └──────────────────────────┘          │
│     scheduleImmediate..   │                                         │
│   }                       │   ┌─ Microtask Queue ────────┐          │
│                           │   │ [processRootSchedule...] │          │
│                           │   └──────────────────────────┘          │
│                           │                                         │
│                           │   ┌─ Macrotask Queue ────────┐          │
│                           │   │ [Scheduler.callback]     │          │
│                           │   └──────────────────────────┘          │
│                           │                                         │
│                           │   ┌─ Lanes ──────────────────┐          │
│                           │   │ ████ Sync (красная)      │          │
│                           │   │ ░░░░ Transition (синяя)  │          │
│                           │   └──────────────────────────┘          │
│                           │                                         │
│                           │   ── Timeline: [===|===|===] 16ms ──   │
│                           │                                         │
├───────────────────────────┴─────────────────────────────────────────┤
│  💬 Комментарий к текущему шагу (на русском)                        │
│  "Root добавляется в linked list расписания. Если это первый root,  │
│   он становится и первым и последним в списке."                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Сценарии анимации:

**Сценарий A: Синхронное обновление (обычный setState)**
1. Пользователь "нажимает кнопку" → `onClick` попадает в Call Stack
2. `setState()` → вызывается `ensureRootIsScheduled(root)`
3. Root добавляется в linked list (анимация: блок появляется в Root Schedule)
4. `mightHavePendingSyncWork = true` (флаг загорается)
5. `scheduleImmediateTask(processRootScheduleInMicrotask)` → блок летит в Microtask Queue
6. Call Stack опустошается
7. Microtask Queue → `processRootScheduleInMicrotask` попадает в Call Stack
8. Lane = Sync → `queueMicrotask(processNextLane)` → ещё одна микрозадача
9. Рендеринг происходит → блок в Lanes (Sync) заполняется
10. Браузер рисует кадр

**Сценарий B: Transition (startTransition + setState)**
1. Пользователь "нажимает кнопку" → `onClick` в Call Stack
2. `startTransition(() => setState(...))` → вызывается `ensureRootIsScheduled(root)`
3. Root добавляется в linked list
4. `mightHavePendingSyncWork = true`
5. `scheduleImmediateTask(processRootScheduleInMicrotask)` → Microtask Queue
6. Call Stack опустошается
7. Microtask → `processRootScheduleInMicrotask`
8. Lane = Transition → `Scheduler.scheduleCallback(callback, processNextLane)` → блок летит в **Macrotask Queue** (не микро!)
9. Браузер рисует кадр (UI не заблокирован!)
10. В следующем кадре: Macrotask → рендеринг transition

**Ключевая разница видна визуально:** 
- Sync: всё в микрозадачах → рендеринг ДО отрисовки кадра → блокировка
- Transition: рендеринг уходит в макрозадачу → браузер успевает нарисовать кадр → плавность

### Особенности визуализатора:

- **Курсор в коде** — жёлтая строка подсветки перемещается по коду `ensureRootIsScheduled` синхронно с анимацией
- **Анимация перелёта блоков** — задачи "летят" из одной очереди в другую
- **Цветовое кодирование:** Sync = красный, Transition = синий, Microtask = зелёный, Macrotask = оранжевый
- **Timeline bar** — полоска "16мс кадр браузера", показывающая когда происходит paint
- **Комментарий** — внизу текстовый блок с объяснением текущего шага на русском

## Технологии

- **React 19** + **TypeScript** + **Vite**
- **CSS** — без UI-библиотек, стили вручную (тёмная тема, неоновые акценты)
- **framer-motion** — анимации блоков (перелёт, появление, подсветка)
- Никаких роутеров — простой state-based tab switching

## Принципы

- Минимум кода, максимум наглядности
- Каждый раздел самодостаточен
- Все тексты на русском
- Современный React 19 (function components, hooks)
- Тёмная тема, приятная для глаз

## Порядок работы

1. Создать директорию, инициализировать Vite + React 19 + TS
2. Скопировать PDF в `docs/`
3. Реализовать SlowChat (проблема)
4. Реализовать FastChat (решение с переключателем)
5. Найти актуальный `ensureRootIsScheduled` из React 19, написать разбор в `docs/`
6. Реализовать SchedulerVisualizer со всеми панелями и сценариями
7. Навигация, стили, финальная полировка
