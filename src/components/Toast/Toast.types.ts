/**
 * Toast component type definitions
 */

export type ToastType = 'success' | 'error' | 'warn' | 'info' | 'default';

export interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
  sound?: boolean;
}

export interface ToastInstance {
  element: HTMLElement;
  show(): void;
  close(): void;
}
