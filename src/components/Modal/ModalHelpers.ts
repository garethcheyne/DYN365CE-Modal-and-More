/**
 * Modal helper functions for common dialog patterns
 */

import { Modal } from './Modal';
import { ModalButton } from './Modal.types';
import type { ModalOptions } from './Modal.types';

/**
 * Show a simple alert dialog
 */
export function alert(
  title: string,
  message: string,
  type?: 'success' | 'info' | 'warning' | 'error',
  options?: Partial<ModalOptions>
): Promise<void> {
  // Map type to icon
  let icon: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR' = 'INFO';
  if (type === 'success') icon = 'SUCCESS';
  else if (type === 'warning') icon = 'WARNING';
  else if (type === 'error') icon = 'ERROR';
  else if (type === 'info') icon = 'INFO';

  return new Promise((resolve) => {
    new Modal({
      title,
      content: message, // Use content instead of message to allow HTML
      icon: options?.icon || icon,
      size: 'medium',
      ...options,
      buttons: [
        new ModalButton('OK', () => resolve(), true)
      ]
    }).show();
  });
}

/**
 * Show a confirmation dialog
 */
export function confirm(
  title: string,
  message: string,
  type?: 'success' | 'info' | 'warning' | 'error',
  options?: Partial<ModalOptions>
): Promise<boolean> {
  // Map type to icon
  let icon: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR' | 'QUESTION' = 'QUESTION';
  if (type === 'success') icon = 'SUCCESS';
  else if (type === 'warning') icon = 'WARNING';
  else if (type === 'error') icon = 'ERROR';
  else if (type === 'info') icon = 'INFO';

  return new Promise((resolve) => {
    new Modal({
      title,
      message,
      icon: options?.icon || icon,
      size: 'small',
      ...options,
      buttons: [
        new ModalButton('Cancel', () => resolve(false)),
        new ModalButton('OK', () => resolve(true), true)
      ]
    }).show();
  });
}

/**
 * Show a prompt dialog
 */
export function prompt(
  title: string,
  message: string,
  defaultValue?: string,
  options?: Partial<ModalOptions>
): Promise<string | null> {
  return new Promise((resolve) => {
    const modal = new Modal({
      title,
      message,
      icon: options?.icon || 'QUESTION',
      size: 'small',
      ...options,
      fields: [
        {
          id: 'promptValue',
          type: 'text',
          value: defaultValue || '',
          placeholder: 'Enter value...'
        }
      ],
      buttons: [
        new ModalButton('Cancel', () => resolve(null)),
        new ModalButton('OK', () => {
          const value = modal.getFieldValue('promptValue');
          resolve(value || '');
        }, true)
      ]
    });
    
    modal.show();
  });
}
