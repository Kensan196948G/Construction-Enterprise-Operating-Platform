import '@testing-library/jest-dom';

// Radix UI が内部で使用する browser API の polyfill
globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as unknown as typeof ResizeObserver;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Radix UI はポインタイベントをタッチ/マウスより優先して使用する
if (!window.PointerEvent) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).PointerEvent = window.MouseEvent;
}
