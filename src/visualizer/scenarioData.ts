// Each step describes the state of all visual elements at that point in time.

export interface VizState {
  callStack: string[];
  rootSchedule: string[];
  microtaskQueue: string[];
  macrotaskQueue: string[];
  flagSync: boolean;
  laneSyncFill: number;       // 0..100
  laneTransitionFill: number; // 0..100
  timelineProgress: number;   // 0..100
  highlightLines: number[];   // line indices in code panel (0-based), supports ranges
  activeSection: "ensure" | "process" | "schedule" | null;
  comment: string;
  paintReady: boolean;        // browser can paint
}

export interface Scenario {
  id: string;
  title: string;
  steps: VizState[];
  codeLines: string[];
}

// ═══════════════════════════════════════════════════════════════
// REAL React 19 source code (from facebook/react main branch)
// packages/react-reconciler/src/ReactFiberRootScheduler.js
// SHA: 1b45e2439289fd8e094c44161c89e06c5488671e
// ═══════════════════════════════════════════════════════════════

const REAL_CODE = [
  // ── ensureRootIsScheduled ──
  `// ═══ ensureRootIsScheduled ═══════════════════════════════════`,   // 0
  `export function ensureRootIsScheduled(root: FiberRoot): void {`,    // 1
  `  // Эта функция вызывается каждый раз, когда root получает обновление.`,  // 2
  `  // Она делает ровно две вещи:`,                                   // 3
  `  // 1) гарантирует, что root находится в расписании (linked list),`, // 4
  `  // 2) гарантирует, что существует микрозадача для обработки расписания.`, // 5
  ``,                                                                   // 6
  `  // Добавляем root в расписание`,                                   // 7
  `  if (root === lastScheduledRoot || root.next !== null) {`,          // 8
  `    // Быстрый путь: этот root уже запланирован, ничего не делаем.`, // 9
  `  } else {`,                                                         // 10
  `    if (lastScheduledRoot === null) {`,                              // 11
  `      firstScheduledRoot = lastScheduledRoot = root;`,               // 12
  `    } else {`,                                                       // 13
  `      lastScheduledRoot.next = root;`,                               // 14
  `      lastScheduledRoot = root;`,                                    // 15
  `    }`,                                                              // 16
  `  }`,                                                                // 17
  ``,                                                                   // 18
  `  // При каждом обновлении root ставим true, пока не обработаем.`,   // 19
  `  // Если false — можно быстро выйти из flushSync без проверки.`,   // 20
  `  mightHavePendingSyncWork = true;`,                                 // 21
  ``,                                                                   // 22
  `  // Планируем микрозадачу (если ещё не запланирована)`,             // 23
  `  ensureScheduleIsScheduled();`,                                     // 24
  `  // ^ внутри делает:`,                                             // 25
  `  // if (!didScheduleMicrotask) {`,                                  // 26
  `  //   didScheduleMicrotask = true;`,                                // 27
  `  //   scheduleImmediateTask(processRootScheduleInMicrotask);`,      // 28
  `  // }`,                                                             // 29
  ``,                                                                   // 30
  `  // DEV-only: пометка устаревших (legacy) обновлений для act()`,   // 31
  `  if (__DEV__ && !disableLegacyMode`,                                // 32
  `      && ReactSharedInternals.isBatchingLegacy`,                     // 33
  `      && root.tag === LegacyRoot) {`,                                // 34
  `    ReactSharedInternals.didScheduleLegacyUpdate = true;`,           // 35
  `  }`,                                                                // 36
  `}`,                                                                  // 37
  ``,                                                                   // 38
  // ── processRootScheduleInMicrotask ──
  `// ═══ processRootScheduleInMicrotask ════════════════════════`,     // 39
  `function processRootScheduleInMicrotask() {`,                       // 40
  `  // Всегда вызывается внутри микрозадачи, НИКОГДА синхронно.`,     // 41
  `  didScheduleMicrotask = false;`,                                   // 42
  `  mightHavePendingSyncWork = false; // Пересчитаем ниже`,           // 43
  ``,                                                                   // 44
  `  // Проверяем: есть ли "нетерпеливые" (eager) transition?`,        // 45
  `  let syncTransitionLanes = NoLanes;`,                               // 46
  `  if (currentEventTransitionLane !== NoLane) {`,                     // 47
  `    if (shouldAttemptEagerTransition()) {`,                          // 48
  `      syncTransitionLanes = currentEventTransitionLane;`,            // 49
  `    }`,                                                              // 50
  `  }`,                                                                // 51
  ``,                                                                   // 52
  `  const currentTime = now();`,                                       // 53
  `  let prev = null;`,                                                 // 54
  `  let root = firstScheduledRoot; // Начало linked list`,             // 55
  `  while (root !== null) {`,                                          // 56
  `    const next = root.next;`,                                        // 57
  `    // ↓↓↓ Здесь принимается решение о планировании ↓↓↓`,          // 58
  `    const nextLanes = scheduleTaskForRootDuringMicrotask(`,          // 59
  `      root, currentTime`,                                           // 60
  `    );`,                                                             // 61
  `    if (nextLanes === NoLane) {`,                                    // 62
  `      // Работы больше нет — удаляем root из расписания`,            // 63
  `      root.next = null;`,                                            // 64
  `      if (prev === null) firstScheduledRoot = next;`,                // 65
  `      else prev.next = next;`,                                       // 66
  `      if (next === null) lastScheduledRoot = prev;`,                 // 67
  `    } else {`,                                                       // 68
  `      prev = root;`,                                                 // 69
  `      if (includesSyncLane(nextLanes) ||`,                           // 70
  `          syncTransitionLanes !== NoLanes) {`,                       // 71
  `        mightHavePendingSyncWork = true; // Есть sync работа!`,      // 72
  `      }`,                                                            // 73
  `    }`,                                                              // 74
  `    root = next; // Следующий root в linked list`,                   // 75
  `  }`,                                                                // 76
  ``,                                                                   // 77
  `  // Выполняем всю накопившуюся синхронную работу`,                  // 78
  `  flushSyncWorkAcrossRoots_impl(syncTransitionLanes, false);`,       // 79
  `}`,                                                                  // 80
  ``,                                                                   // 81
  // ── scheduleTaskForRootDuringMicrotask ──
  `// ═══ scheduleTaskForRootDuringMicrotask ════════════════════`,     // 82
  `function scheduleTaskForRootDuringMicrotask(`,                      // 83
  `  root: FiberRoot, currentTime: number`,                            // 84
  `): Lane {`,                                                         // 85
  `  // Проверяем: не голодают ли какие-то lanes? Помечаем как expired`, // 86
  `  markStarvedLanesAsExpired(root, currentTime);`,                    // 87
  ``,                                                                   // 88
  `  // Определяем следующие lanes для обработки`,                      // 89
  `  const nextLanes = getNextLanes(root, ...);`,                       // 90
  `  const existingCallbackNode = root.callbackNode;`,                  // 91
  ``,                                                                   // 92
  `  if (nextLanes === NoLanes) {`,                                     // 93
  `    // Работы нет — отменяем существующий callback`,                 // 94
  `    if (existingCallbackNode !== null) cancelCallback(it);`,         // 95
  `    root.callbackNode = null;`,                                      // 96
  `    root.callbackPriority = NoLane;`,                                // 97
  `    return NoLane;`,                                                 // 98
  `  }`,                                                                // 99
  ``,                                                                   // 100
  `  // ★ КЛЮЧЕВАЯ ТОЧКА ПРИНЯТИЯ РЕШЕНИЯ ★`,                         // 101
  `  if (includesSyncLane(nextLanes)) {`,                               // 102
  `    // SYNC → выполнится в конце микрозадачи, доп. задача не нужна`, // 103
  `    root.callbackPriority = SyncLane;`,                              // 104
  `    root.callbackNode = null;`,                                      // 105
  `    return SyncLane;  // → flushSyncWork() выше сделает рендер`,     // 106
  `  }`,                                                                // 107
  ``,                                                                   // 108
  `  // НЕ SYNC → планируем через Scheduler (MessageChannel = макрозадача)`, // 109
  `  let schedulerPriorityLevel;`,                                      // 110
  `  switch (lanesToEventPriority(nextLanes)) {`,                       // 111
  `    case DiscreteEventPriority:    // Клик, ввод`,                   // 112
  `    case ContinuousEventPriority:  // Скролл, drag`,                // 113
  `      schedulerPriorityLevel = UserBlockingPriority; break;`,        // 114
  `    case DefaultEventPriority:     // Transition, обычное обновление`, // 115
  `      schedulerPriorityLevel = NormalPriority; break;`,              // 116
  `    case IdleEventPriority:        // Фоновая работа`,              // 117
  `      schedulerPriorityLevel = IdlePriority; break;`,                // 118
  `    default:`,                                                       // 119
  `      schedulerPriorityLevel = NormalPriority; break;`,              // 120
  `  }`,                                                                // 121
  ``,                                                                   // 122
  `  // ★ Задача уходит в MACROTASK очередь через MessageChannel ★`,   // 123
  `  const newCallbackNode = scheduleCallback(`,                        // 124
  `    schedulerPriorityLevel,`,                                        // 125
  `    performWorkOnRootViaSchedulerTask.bind(null, root),`,            // 126
  `  );`,                                                               // 127
  `  root.callbackPriority = newCallbackPriority;`,                     // 128
  `  root.callbackNode = newCallbackNode;`,                             // 129
  `  return newCallbackPriority;`,                                      // 130
  `}`,                                                                  // 131
];

const BASE: VizState = {
  callStack: [],
  rootSchedule: [],
  microtaskQueue: [],
  macrotaskQueue: [],
  flagSync: false,
  laneSyncFill: 0,
  laneTransitionFill: 0,
  timelineProgress: 0,
  highlightLines: [],
  activeSection: null,
  comment: "",
  paintReady: false,
};

function s(overrides: Partial<VizState>): VizState {
  return { ...BASE, ...overrides };
}

// ─── Scenario A: Synchronous setState ───────────────────────

const syncSteps: VizState[] = [
  s({
    comment: "Пользователь нажимает кнопку. Событие onClick попадает в Call Stack.",
    callStack: ["onClick()"],
    timelineProgress: 5,
  }),
  s({
    comment: "Внутри обработчика вызывается setState(). React начинает планирование обновления.",
    callStack: ["onClick()", "setState()"],
    timelineProgress: 8,
  }),
  s({
    highlightLines: [1, 2, 3, 4, 5],
    activeSection: "ensure",
    comment: "setState() вызывает ensureRootIsScheduled(root). Эта функция делает ровно 2 вещи: добавляет root в расписание и гарантирует микрозадачу.",
    callStack: ["onClick()", "setState()", "ensureRootIsScheduled()"],
    timelineProgress: 10,
  }),
  s({
    highlightLines: [8, 9, 10, 11, 12],
    activeSection: "ensure",
    comment: "Проверка: root уже в расписании? Нет. lastScheduledRoot === null → root становится первым и последним в linked list.",
    callStack: ["onClick()", "setState()", "ensureRootIsScheduled()"],
    rootSchedule: ["Root #1"],
    timelineProgress: 14,
  }),
  s({
    highlightLines: [19, 20, 21],
    activeSection: "ensure",
    comment: "mightHavePendingSyncWork = true — флаг для flushSync. Говорит: «возможно, есть синхронная работа, не пропускай проверку».",
    callStack: ["onClick()", "setState()", "ensureRootIsScheduled()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    timelineProgress: 18,
  }),
  s({
    highlightLines: [23, 24, 25, 26, 27, 28, 29],
    activeSection: "ensure",
    comment: "ensureScheduleIsScheduled() — если ещё не запланирована микрозадача, планирует: scheduleImmediateTask(processRootScheduleInMicrotask). Задача летит в Microtask Queue.",
    callStack: ["onClick()", "setState()", "ensureRootIsScheduled()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    microtaskQueue: ["processRootScheduleInMicrotask"],
    timelineProgress: 22,
  }),
  s({
    highlightLines: [37],
    activeSection: "ensure",
    comment: "ensureRootIsScheduled() завершена. Это было БЫСТРО — никакого рендеринга тут нет, только бронирование места. Возвращаемся в onClick.",
    callStack: ["onClick()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    microtaskQueue: ["processRootScheduleInMicrotask"],
    timelineProgress: 26,
  }),
  s({
    comment: "Call Stack пуст. Движок JS проверяет Microtask Queue — видит задачу! Микрозадачи выполняются ДО следующего рендера браузера.",
    callStack: [],
    rootSchedule: ["Root #1"],
    flagSync: true,
    microtaskQueue: ["processRootScheduleInMicrotask"],
    timelineProgress: 30,
  }),
  s({
    highlightLines: [40, 41, 42, 43],
    activeSection: "process",
    comment: "Запускается processRootScheduleInMicrotask(). Сбрасывает флаги. Начинает обход linked list всех запланированных roots.",
    callStack: ["processRootScheduleInMicrotask()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    timelineProgress: 35,
  }),
  s({
    highlightLines: [55, 56, 57, 58, 59, 60, 61],
    activeSection: "process",
    comment: "Для каждого root вызывается scheduleTaskForRootDuringMicrotask(root, currentTime). Именно ТАМ решается, куда пойдёт работа.",
    callStack: ["processRootScheduleInMicrotask()", "scheduleTaskForRoot...()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    timelineProgress: 40,
  }),
  s({
    highlightLines: [86, 87, 89, 90],
    activeSection: "schedule",
    comment: "scheduleTaskForRootDuringMicrotask: сначала markStarvedLanesAsExpired (защита от голодания), потом getNextLanes — определяет какие lanes нужно обработать.",
    callStack: ["processRootScheduleInMicrotask()", "scheduleTaskForRoot...()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    laneSyncFill: 20,
    timelineProgress: 45,
  }),
  s({
    highlightLines: [101, 102, 103, 104, 105, 106, 107],
    activeSection: "schedule",
    comment: "★ КЛЮЧЕВОЙ МОМЕНТ: includesSyncLane(nextLanes) === TRUE! Обычный setState → lane = SyncLane. Возвращаем SyncLane — дополнительная задача НЕ нужна, всё выполнится в конце этой же микрозадачи.",
    callStack: ["processRootScheduleInMicrotask()", "scheduleTaskForRoot...()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    laneSyncFill: 50,
    timelineProgress: 52,
  }),
  s({
    highlightLines: [70, 71, 72, 73],
    activeSection: "process",
    comment: "Назад в processRootScheduleInMicrotask: nextLanes включает SyncLane → mightHavePendingSyncWork = true. Синхронная работа подтверждена.",
    callStack: ["processRootScheduleInMicrotask()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    laneSyncFill: 65,
    timelineProgress: 58,
  }),
  s({
    highlightLines: [78, 79],
    activeSection: "process",
    comment: "flushSyncWorkAcrossRoots_impl() — ВОТ ГДЕ РЕНДЕРИНГ. React рендерит компонент ПРЯМО СЕЙЧАС, синхронно, в микрозадаче. Main thread ЗАБЛОКИРОВАН.",
    callStack: ["processRootScheduleInMicrotask()", "flushSyncWork()", "renderRoot()", "commitRoot()"],
    rootSchedule: [],
    flagSync: true,
    laneSyncFill: 100,
    timelineProgress: 78,
  }),
  s({
    comment: "Рендеринг завершён. DOM обновлён. Только ТЕПЕРЬ браузер может нарисовать кадр. Весь пользовательский ввод ждал — UI заморожен.",
    callStack: [],
    rootSchedule: [],
    flagSync: false,
    laneSyncFill: 100,
    timelineProgress: 100,
    paintReady: true,
  }),
];

// ─── Scenario B: startTransition + setState ─────────────────

const transitionSteps: VizState[] = [
  s({
    comment: "Входящее сообщение через WebSocket. Обработчик onMessage попадает в Call Stack.",
    callStack: ["onMessage()"],
    timelineProgress: 5,
  }),
  s({
    comment: "startTransition(() => setState(...)). React помечает обновление специальной lane = TransitionLane (не SyncLane!).",
    callStack: ["onMessage()", "startTransition()", "setState()"],
    timelineProgress: 8,
  }),
  s({
    highlightLines: [1, 2, 3, 4, 5],
    activeSection: "ensure",
    comment: "Вызывается ensureRootIsScheduled(root) — тот же самый вход. Функция не знает про transition, она просто бронирует root.",
    callStack: ["onMessage()", "startTransition()", "setState()", "ensureRootIsScheduled()"],
    timelineProgress: 10,
  }),
  s({
    highlightLines: [8, 10, 11, 12],
    activeSection: "ensure",
    comment: "Root добавляется в linked list расписания. Пока — всё абсолютно одинаково с синхронным сценарием.",
    callStack: ["onMessage()", "startTransition()", "setState()", "ensureRootIsScheduled()"],
    rootSchedule: ["Root #1"],
    timelineProgress: 14,
  }),
  s({
    highlightLines: [21],
    activeSection: "ensure",
    comment: "mightHavePendingSyncWork = true. Флаг ставится ВСЕГДА — функция не проверяет какой lane у обновления.",
    callStack: ["onMessage()", "startTransition()", "setState()", "ensureRootIsScheduled()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    timelineProgress: 18,
  }),
  s({
    highlightLines: [23, 24, 25, 26, 27, 28, 29],
    activeSection: "ensure",
    comment: "Микрозадача запланирована. Пока — полная копия Sync пути. Разница наступит внутри processRootScheduleInMicrotask.",
    callStack: ["onMessage()", "startTransition()", "setState()", "ensureRootIsScheduled()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    microtaskQueue: ["processRootScheduleInMicrotask"],
    timelineProgress: 22,
  }),
  s({
    highlightLines: [37],
    activeSection: "ensure",
    comment: "ensureRootIsScheduled() завершена. Call Stack разматывается → onMessage заканчивается.",
    callStack: ["onMessage()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    microtaskQueue: ["processRootScheduleInMicrotask"],
    timelineProgress: 26,
  }),
  s({
    comment: "Call Stack пуст. Движок JS запускает микрозадачу из Microtask Queue.",
    callStack: [],
    rootSchedule: ["Root #1"],
    flagSync: true,
    microtaskQueue: ["processRootScheduleInMicrotask"],
    timelineProgress: 30,
  }),
  s({
    highlightLines: [40, 41, 42, 43],
    activeSection: "process",
    comment: "processRootScheduleInMicrotask() запускается. Сброс флагов, начало обхода roots.",
    callStack: ["processRootScheduleInMicrotask()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    timelineProgress: 35,
  }),
  s({
    highlightLines: [59, 60, 61],
    activeSection: "process",
    comment: "Вызываем scheduleTaskForRootDuringMicrotask(root). Именно тут всё разойдётся с Sync.",
    callStack: ["processRootScheduleInMicrotask()", "scheduleTaskForRoot...()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    timelineProgress: 40,
  }),
  s({
    highlightLines: [86, 87, 89, 90],
    activeSection: "schedule",
    comment: "markStarvedLanesAsExpired + getNextLanes. Определяем lanes: lane = TransitionLane (startTransition пометил!).",
    callStack: ["processRootScheduleInMicrotask()", "scheduleTaskForRoot...()"],
    rootSchedule: ["Root #1"],
    flagSync: true,
    laneTransitionFill: 20,
    timelineProgress: 45,
  }),
  s({
    highlightLines: [101, 102],
    activeSection: "schedule",
    comment: "★ КЛЮЧЕВОЙ МОМЕНТ: includesSyncLane(nextLanes) === FALSE! TransitionLane — это НЕ Sync. Пропускаем блок, идём дальше ↓",
    callStack: ["processRootScheduleInMicrotask()", "scheduleTaskForRoot...()"],
    rootSchedule: ["Root #1"],
    flagSync: false,
    laneTransitionFill: 35,
    timelineProgress: 50,
  }),
  s({
    highlightLines: [109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121],
    activeSection: "schedule",
    comment: "Маппинг lane → приоритет Scheduler. TransitionLane → DefaultEventPriority → NormalSchedulerPriority.",
    callStack: ["processRootScheduleInMicrotask()", "scheduleTaskForRoot...()"],
    rootSchedule: ["Root #1"],
    flagSync: false,
    laneTransitionFill: 50,
    timelineProgress: 55,
  }),
  s({
    highlightLines: [123, 124, 125, 126, 127, 128, 129, 130],
    activeSection: "schedule",
    comment: "★ scheduleCallback(NormalPriority, performWork) — задача уходит в MACROTASK QUEUE через MessageChannel! Не в микрозадачу!",
    callStack: ["processRootScheduleInMicrotask()", "scheduleTaskForRoot...()"],
    rootSchedule: ["Root #1"],
    flagSync: false,
    laneTransitionFill: 60,
    macrotaskQueue: ["Scheduler: performWork"],
    timelineProgress: 60,
  }),
  s({
    highlightLines: [68, 69, 74, 75],
    activeSection: "process",
    comment: "Назад в processRootScheduleInMicrotask: nextLanes != Sync → mightHavePendingSyncWork остаётся false. Sync работы нет.",
    callStack: ["processRootScheduleInMicrotask()"],
    rootSchedule: ["Root #1"],
    flagSync: false,
    laneTransitionFill: 60,
    macrotaskQueue: ["Scheduler: performWork"],
    timelineProgress: 63,
  }),
  s({
    highlightLines: [78, 79],
    activeSection: "process",
    comment: "flushSyncWorkAcrossRoots_impl — но sync работы нет! Ничего не рендерится. Микрозадача завершена. Main thread СВОБОДЕН.",
    callStack: [],
    rootSchedule: ["Root #1"],
    flagSync: false,
    laneTransitionFill: 60,
    macrotaskQueue: ["Scheduler: performWork"],
    timelineProgress: 68,
    paintReady: true,
  }),
  s({
    comment: "Браузер рисует кадр! UI отзывчив — пользователь может печатать. А transition-рендеринг ещё ждёт в Macrotask Queue.",
    callStack: [],
    rootSchedule: ["Root #1"],
    flagSync: false,
    laneTransitionFill: 65,
    macrotaskQueue: ["Scheduler: performWork"],
    timelineProgress: 75,
    paintReady: true,
  }),
  s({
    comment: "В СЛЕДУЮЩЕМ цикле event loop: из Macrotask Queue берётся performWork. React начинает рендерить transition-обновление.",
    callStack: ["performWorkOnRoot()", "renderRootConcurrent()"],
    rootSchedule: [],
    flagSync: false,
    laneTransitionFill: 85,
    timelineProgress: 88,
  }),
  s({
    comment: "React рендерит. Если работа > 5мс — прерывается (time slicing), отдаёт управление браузеру, продолжает в следующем кадре.",
    callStack: ["performWorkOnRoot()", "renderRootConcurrent()", "workLoopConcurrent()"],
    rootSchedule: [],
    flagSync: false,
    laneTransitionFill: 95,
    timelineProgress: 94,
  }),
  s({
    comment: "Готово. Итог: пользователь НЕ ждал, UI был отзывчив всё время. Обновление произошло в фоне, порциями, без блокировки.",
    callStack: [],
    rootSchedule: [],
    flagSync: false,
    laneTransitionFill: 100,
    timelineProgress: 100,
    paintReady: true,
  }),
];

export const SCENARIOS: Scenario[] = [
  {
    id: "sync",
    title: "setState (Sync)",
    steps: syncSteps,
    codeLines: REAL_CODE,
  },
  {
    id: "transition",
    title: "startTransition",
    steps: transitionSteps,
    codeLines: REAL_CODE,
  },
];
