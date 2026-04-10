# React Scheduler Demo — Спецификация

## Цель
Интерактивный учебный проект, демонстрирующий как React 19 планирует и откладывает обновления. Основан на материале главы 7 книги "Конкурентный React" (стр. 225–259).

## Концепция

Шесть разделов — от проблемы к решению, от решения к пониманию "почему это работает", и далее к смежным инструментам и проблемам:

1. **SlowChat** — ощути проблему на себе
2. **FastChat** — ощути решение (A/B переключатель с `useTransition`)
3. **SchedulerVisualizer** — пойми механизм: одна большая интерактивная визуализация `ensureRootIsScheduled`, event loop, очереди задач и lanes
4. **DeferredSearch** — `useDeferredValue`: поиск с тяжёлым списком, A/B через тоггл
5. **TearingDemo** — разрыв (tearing): 5 дорогих компонентов читают внешний счётчик, видно несогласованные числа; кнопка "Исправить" включает `useSyncExternalStore`
6. **EventLoop** — интерактивная диаграмма браузерного event loop

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
- **React Compiler** (`babel-plugin-react-compiler`) — включён глобально; демо-компоненты где важна ручная мемоизация помечены `"use no memo"`
- **CSS** — без UI-библиотек, стили вручную (тёмная тема, неоновые акценты)
- **framer-motion** — анимации блоков (перелёт, появление, подсветка)
- Никаких роутеров — простой state-based tab switching

## Принципы

- Минимум кода, максимум наглядности
- Каждый раздел самодостаточен
- Все тексты на русском
- Современный React 19 (function components, hooks)
- Тёмная тема, приятная для глаз

## Раздел 4: DeferredSearch — "useDeferredValue"

**Цель:** Показать `useDeferredValue` как инструмент для дорогих синхронных вычислений — и объяснить что это просто обёртка над `startTransition` для случая, когда ты не контролируешь `setState`.

**Ключевая идея для пользователя:**
```js
// Вот что делает useDeferredValue под капотом:
function useDeferredValue(value) {
  const [newValue, setNewValue] = useState(value);
  useEffect(() => {
    startTransition(() => setNewValue(value)); // тот же startTransition!
  }, [value]);
  return newValue;
}
```
Используй `useDeferredValue` когда не можешь дотянуться до `setState` (пропс, внешняя библиотека).
Если контролируешь источник — `startTransition` прямолинейнее.

### Механика

- Список из **10 000 элементов** (`useMemo`, генерируется один раз).
- `ItemList` обёрнут в `memo` — ре-рендерится только при изменении `filter`.
- Поле поиска фильтрует список через `useMemo` по вхождению строки.
- **Тоггл:** "Без defer" / "С useDeferredValue".

### Режим "Без defer"
- `filter` сразу передаётся в `ItemList`.
- При каждом нажатии клавиши — тяжёлый ре-рендер 10к элементов.
- Инпут лагает (задержка появления символов).

### Режим "С useDeferredValue"
- `deferredFilter = useDeferredValue(filter)` передаётся в `ItemList`.
- Инпут обновляется мгновенно — `filter` синхронный.
- `ItemList` отрисовывается с `deferredFilter` — React откладывает тяжёлый рендер.
- Пока идёт рендер — визуально затемнённый список (`opacity: 0.6`) + `isPending`-индикатор.

### Индикатор "stale"
- Пока `filter !== deferredFilter` — показываем пульсирующий оверлей на списке: "Обновление...".
- Как только совпали — оверлей исчезает.

### Макет

```
┌─────────────────────────────────┬──────────────────────────┐
│  🔍 [   поиск...              ] │  Режим: [тоггл]          │
│                                 │  FpsMeter                │
│  ┌── ItemList ──────────────┐   │                          │
│  │ (затемнён пока stale)    │   │  Info Card:              │
│  │ item 1                   │   │  "useDeferredValue       │
│  │ item 2                   │   │   откладывает рендер     │
│  │ ...                      │   │   списка, не блокируя    │
│  └──────────────────────────┘   │   ввод пользователя"     │
└─────────────────────────────────┴──────────────────────────┘
```

### Технические детали

- `generateItems(10_000)` — массив строк `"Item #N — <random phrase>"`.
- Фильтрация: `items.filter(item => item.toLowerCase().includes(filter.toLowerCase()))`.
- `ItemList = memo(({ items }) => ...)` — принципиально важно для демо.
- **Нет** искусственного `while`-блокера — замедление реальное, от объёма DOM.
- `ItemList` помечен `"use no memo"` — директива React Compiler, отключает автомемоизацию для этого компонента, чтобы `memo()` был явным и наглядным.

---

## Раздел 5: TearingDemo — "Разрыв и useSyncExternalStore"

**Цель:** Показать проблему tearing при конкурентном рендере и её решение.

### Механика tearing

- **Глобальный счётчик** `let count = 0` — обновляется через `setInterval(..., 1)` вне React.
- **5 экземпляров** `ExpensiveItem` — каждый блокирует поток на ~80мс (`while (perf.now() - start < 80)`).
- `App` оборачивает `setName` в `startTransition` — чтобы React мог прерываться.
- Из-за прерываний каждый `ExpensiveItem` читает `count` в разное время → **разные числа**.

### Режим "С useSyncExternalStore"

- `ExpensiveItem` читает `count` через `useSyncExternalStore(noopSubscribe, () => count)`.
- React гарантирует: все экземпляры получают **один и тот же снимок** за рендер.
- Числа одинаковые, разрыв устранён.

### Интерактивность

- Инпут (имя) — пользователь вводит текст → запускает transition → провоцирует прерывания.
- Без ввода разрыва нет — нужен активный ввод.
- Подсказка: "Начните быстро печатать, чтобы увидеть разрыв".

### Визуализация

```
┌──────────────────────────────────────────────┬────────────────────────┐
│  Имя: [     введите текст...              ]  │  Режим: [тоггл]        │
│                                              │                        │
│  ┌── Item 1 ─────────────────────────┐       │  Без useSyncExt...     │
│  │  Expensive count is 568           │       │  ─────────────────     │
│  └───────────────────────────────────┘       │  • Счётчик читается    │
│  ┌── Item 2 ─────────────────────────┐       │    в разное время      │
│  │  Expensive count is 568           │       │  • Числа могут         │
│  └───────────────────────────────────┘       │    расходиться         │
│  ┌── Item 3 ─────────────────────────┐       │                        │
│  │  Expensive count is 569  ← разрыв │       │  С useSyncExt...       │
│  └───────────────────────────────────┘       │  ─────────────────     │
│  ┌── Item 4 ─────────────────────────┐       │  • getSnapshot()       │
│  │  Expensive count is 569           │       │    вызывается синхр.   │
│  └───────────────────────────────────┘       │  • Все видят одно      │
│  ┌── Item 5 ─────────────────────────┐       │    значение            │
│  │  Expensive count is 570  ← разрыв │       │                        │
│  └───────────────────────────────────┘       │  FpsMeter              │
└──────────────────────────────────────────────┴────────────────────────┘
```

### Выделение разрыва

- При режиме "без fix": числа, отличающиеся от первого — подсвечиваются красным.
- При режиме "с fix": все числа зелёные.
- Счётчик разрывов: "Разрывов за сессию: N".

### Технические детали

- `noopSubscribe = () => () => {}` — пустая подписка, нас интересует только `getSnapshot`.
- `ExpensiveItem` — **не** в `memo` намеренно (чтобы ре-рендерился при каждом переходе).
- Задержка 80мс — достаточно большая, чтобы `count` успел измениться между рендерами.

---

## Структура файлов (обновлённая)

```
src/
├── sections/
│   ├── SlowChat.tsx
│   ├── FastChat.tsx
│   ├── SchedulerVisualizer.tsx
│   ├── DeferredSearch.tsx        # новый
│   ├── TearingDemo.tsx           # новый
│   └── EventLoop.tsx
│
├── components/
│   ├── Nav.tsx                   # +2 вкладки
│   ├── ...
│   └── FpsMeter.tsx
│
└── styles/
    └── global.css                # +стили для новых секций
```

## Порядок работы (обновлённый)

**Реализовано:**
1. ✅ SlowChat
2. ✅ FastChat
3. ✅ SchedulerVisualizer
4. ✅ EventLoop

**Предстоит:**
5. DeferredSearch — `useDeferredValue` с большим списком и тогглом
6. TearingDemo — разрыв + `useSyncExternalStore`, тоггл, счётчик разрывов
7. Обновить Nav (+2 вкладки), App.tsx, добавить CSS
