/**
 * Toast Notification System
 * Provides toast notifications with different types and sound support
 */

import { theme } from '../../styles/theme';
import { injectAnimations } from '../../styles/animations';
import type { ToastOptions, ToastInstance, ToastType } from './Toast.types';

/**
 * Create toast container if it doesn't exist
 */
const getToastContainer = (() => {
  let container: HTMLElement | null = null;
  
  return (): HTMLElement => {
    if (container) return container;
    
    const existing = document.getElementById('err403-toast-container');
    if (existing) {
      container = existing;
      return container;
    }
    
    container = document.createElement('div');
    container.id = 'err403-toast-container';
    container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: ${theme.zIndex.toast};
    pointer-events: none;
  `;
    
    // Inject animations
    injectAnimations();
    
    // Support D365 iframes
    const targetDocument = (window.parent?.document || document);
    targetDocument.body.appendChild(container);
    
    return container;
  };
})();

/**
 * Get icon SVG for toast type
 */
function getToastIcon(type: ToastType): string {
  const icons = {
    success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z" fill="currentColor"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z" fill="currentColor"/></svg>',
    warn: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M1 17h18L10 1 1 17zm10-2H9v-2h2v2zm0-4H9V7h2v4z" fill="currentColor"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9V9h2v6zm0-8H9V5h2v2z" fill="currentColor"/></svg>',
    default: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="10" cy="10" r="3" fill="currentColor"/></svg>'
  };
  
  return icons[type];
}

/**
 * Play notification sound
 */
function playNotificationSound(type: ToastType): void {
  // Only play sound for success and error
  if (type !== 'success' && type !== 'error') return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for success vs error
    oscillator.frequency.value = type === 'success' ? 800 : 400;
    oscillator.type = 'sine';
    
    // Quick beep
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // Audio not supported or blocked
  }
}

/**
 * Create a toast notification
 */
function createToast(options: ToastOptions, type: ToastType): ToastInstance {
  const { title, message = '', duration = 6000, sound = false } = options;
  const colors = theme.colors.toast[type];
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'err403-toast';
  toast.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 300px;
    max-width: 500px;
    padding: 16px;
    margin-bottom: 12px;
    background: ${colors.bg};
    border-left: 4px solid ${colors.border};
    border-radius: ${theme.borderRadius.medium};
    box-shadow: ${theme.shadows.toast};
    color: ${colors.text};
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize.body};
    pointer-events: all;
    cursor: pointer;
    animation: slideInRight 0.3s ease-out;
    backdrop-filter: blur(10px);
    transition: transform 0.2s ease, opacity 0.2s ease;
  `;
  
  // Icon
  const iconDiv = document.createElement('div');
  iconDiv.style.cssText = `
    flex-shrink: 0;
    margin-top: 2px;
  `;
  iconDiv.innerHTML = getToastIcon(type);
  
  // Content
  const content = document.createElement('div');
  content.style.cssText = `
    flex: 1;
    overflow: hidden;
  `;
  
  // Title
  const titleDiv = document.createElement('div');
  titleDiv.textContent = title;
  titleDiv.style.cssText = `
    font-weight: ${theme.typography.fontWeight.semibold};
    margin-bottom: ${message ? '4px' : '0'};
  `;
  content.appendChild(titleDiv);
  
  // Message
  if (message) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      font-size: ${theme.typography.fontSize.caption};
      opacity: 0.95;
      word-wrap: break-word;
    `;
    content.appendChild(messageDiv);
  }
  
  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    flex-shrink: 0;
    background: none;
    border: none;
    color: ${colors.text};
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    opacity: 0.7;
    transition: opacity 0.2s;
  `;
  closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
  closeBtn.onmouseout = () => closeBtn.style.opacity = '0.7';
  
  // Append elements
  toast.appendChild(iconDiv);
  toast.appendChild(content);
  toast.appendChild(closeBtn);
  
  // Hover effect
  toast.onmouseover = () => {
    toast.style.transform = 'translateX(-4px)';
  };
  toast.onmouseout = () => {
    toast.style.transform = 'translateX(0)';
  };
  
  // Toast instance
  const instance: ToastInstance = {
    element: toast,
    show() {
      const container = getToastContainer();
      container.appendChild(toast);
      
      // Play sound if requested
      if (sound) {
        playNotificationSound(type);
      }
      
      // Auto-dismiss
      if (duration > 0) {
        setTimeout(() => {
          this.close();
        }, duration);
      }
    },
    close() {
      toast.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }
  };
  
  // Click to dismiss (except close button)
  toast.onclick = (e) => {
    if (e.target !== closeBtn) {
      instance.close();
    }
  };
  
  // Close button handler
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    instance.close();
  };
  
  return instance;
}

/**
 * Toast API
 */
export const Toast = {
  success(
    titleOrOptions: string | ToastOptions,
    message?: string,
    duration?: number,
    sound?: boolean
  ): ToastInstance {
    const options: ToastOptions = typeof titleOrOptions === 'string'
      ? { title: titleOrOptions, message, duration, sound }
      : { ...titleOrOptions };
    
    const toast = createToast(options, 'success');
    toast.show();
    return toast;
  },
  
  error(
    titleOrOptions: string | ToastOptions,
    message?: string,
    duration?: number,
    sound?: boolean
  ): ToastInstance {
    const options: ToastOptions = typeof titleOrOptions === 'string'
      ? { title: titleOrOptions, message, duration, sound }
      : { ...titleOrOptions };
    
    const toast = createToast(options, 'error');
    toast.show();
    return toast;
  },
  
  warn(
    titleOrOptions: string | ToastOptions,
    message?: string,
    duration?: number,
    sound?: boolean
  ): ToastInstance {
    const options: ToastOptions = typeof titleOrOptions === 'string'
      ? { title: titleOrOptions, message, duration, sound }
      : { ...titleOrOptions };
    
    const toast = createToast(options, 'warn');
    toast.show();
    return toast;
  },
  
  info(
    titleOrOptions: string | ToastOptions,
    message?: string,
    duration?: number,
    sound?: boolean
  ): ToastInstance {
    const options: ToastOptions = typeof titleOrOptions === 'string'
      ? { title: titleOrOptions, message, duration, sound }
      : { ...titleOrOptions };
    
    const toast = createToast(options, 'info');
    toast.show();
    return toast;
  },
  
  default(
    titleOrOptions: string | ToastOptions,
    message?: string,
    duration?: number,
    sound?: boolean
  ): ToastInstance {
    const options: ToastOptions = typeof titleOrOptions === 'string'
      ? { title: titleOrOptions, message, duration, sound }
      : { ...titleOrOptions };
    
    const toast = createToast(options, 'default');
    toast.show();
    return toast;
  }
};
