# React Scheduler Demo

Интерактивный учебный проект, демонстрирующий как React 19 планирует и откладывает обновления.
Основан на материале главы 7 книги **"Конкурентный React"** (стр. 225-259).

## Разделы

| # | Раздел | Что демонстрирует |
|---|--------|-------------------|
| 1 | **SlowChat** | Проблема: синхронные обновления блокируют UI |
| 2 | **FastChat** | Решение: `useTransition` + A/B переключатель |
| 3 | **SchedulerVisualizer** | Визуализация механизма: `ensureRootIsScheduled`, event loop, lanes |
| 4 | **DeferredSearch** | `useDeferredValue` — поиск по списку из 20 000 элементов |
| 5 | **TearingDemo** | Tearing при конкурентном рендере и `useSyncExternalStore` |
| 6 | **EventLoop** | Интерактивная диаграмма браузерного event loop |

## Запуск

```bash
npm install
npm run dev
```

Откроется на `http://localhost:5173`.

## Стек

- **React 19** + TypeScript + Vite
- **React Compiler** (`babel-plugin-react-compiler`)
- **Framer Motion** — анимации
- CSS — темная тема, без UI-библиотек
