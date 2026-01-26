/**
 * Custom Toast Notification System with slide-out animations
 * Full control over appearance and animations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Warning24Regular,
  Info24Regular,
} from '@fluentui/react-icons';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import type { ToastOptions, ToastType } from './Toast.types';
import { UILIB } from '../Logger/Logger';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  isExiting: boolean;
  timeoutId?: NodeJS.Timeout;
}

let toastIdCounter = 0;
let addToastCallback: ((toast: ToastItem) => void) | null = null;
let removeToastCallback: ((id: string) => void) | null = null;

// Queue for toasts added before container is ready
let pendingToasts: ToastItem[] = [];

/**
 * Toast Container Component
 */
const ToastContainerComponent: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [timeoutIds, setTimeoutIds] = useState<Map<string, NodeJS.Timeout>>(new Map());

  const addToast = useCallback((toast: ToastItem) => {
    setToasts(prev => [...prev, toast]);

    if (toast.duration > 0) {
      const timeoutId = setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);

      setTimeoutIds(prev => new Map(prev).set(toast.id, timeoutId));
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    // Clear timeout if exists
    const timeoutId = timeoutIds.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutIds(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
    }

    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, isExiting: true } : t))
    );

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300); // Match animation duration
  }, [timeoutIds]);

  const pauseToast = useCallback((id: string) => {
    const timeoutId = timeoutIds.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }, [timeoutIds]);

  const resumeToast = useCallback((id: string) => {
    const toast = toasts.find(t => t.id === id);
    if (toast && toast.duration > 0 && !toast.isExiting) {
      const timeoutId = setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);

      setTimeoutIds(prev => new Map(prev).set(id, timeoutId));
    }
  }, [toasts, removeToast]);

  useEffect(() => {
    addToastCallback = addToast;
    removeToastCallback = removeToast;
    
    // Process any pending toasts that were queued before initialization
    if (pendingToasts.length > 0) {
      pendingToasts.forEach(toast => addToast(toast));
      pendingToasts = [];
    }
    
    return () => {
      addToastCallback = null;
      removeToastCallback = null;
    };
  }, [addToast, removeToast]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => (
        <ToastComponent
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
          onMouseEnter={() => pauseToast(toast.id)}
          onMouseLeave={() => resumeToast(toast.id)}
        />
      ))}
    </div>
  );
};

/**
 * Individual Toast Component
 */
const ToastComponent: React.FC<ToastItem & { onClose: () => void; onMouseEnter: () => void; onMouseLeave: () => void }> = ({
  type,
  title,
  message,
  isExiting,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => {
  const iconComponents = {
    success: CheckmarkCircle24Regular,
    error: ErrorCircle24Regular,
    warn: Warning24Regular,
    info: Info24Regular,
    default: Info24Regular,
  };

  const colors = {
    success: { bg: '#0F7B0F', border: '#0B5A0B', text: '#FFFFFF' },
    error: { bg: '#C50F1F', border: '#A20C1A', text: '#FFFFFF' },
    warn: { bg: '#F7630C', border: '#D9570B', text: '#FFFFFF' },
    info: { bg: '#0078D4', border: '#005A9E', text: '#FFFFFF' },
    default: { bg: '#0078D4', border: '#005A9E', text: '#FFFFFF' },
  };

  const IconComponent = iconComponents[type];
  const colorScheme = colors[type];

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        backgroundColor: colorScheme.bg,
        borderLeft: `4px solid ${colorScheme.border}`,
        color: colorScheme.text,
        minWidth: '400px',
        padding: '16px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'auto',
        transform: isExiting ? 'translateX(500px)' : 'translateX(0)',
        opacity: isExiting ? 0 : 1,
        transition: 'transform 0.3s ease-in, opacity 0.3s ease-in',
      }}
    >
      {/* Backdrop Icon */}
      <div
        style={{
          position: 'absolute',
          bottom: '-30px',
          right: '-30px',
          width: '120px',
          height: '120px',
          opacity: 0.08,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <IconComponent
          style={{
            width: '120px',
            height: '120px',
            color: '#FFFFFF',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '12px' }}>
        {/* Header Icon */}
        <div style={{ flexShrink: 0 }}>
          <IconComponent
            style={{
              width: '20px',
              height: '20px',
              color: '#FFFFFF',
            }}
          />
        </div>

        {/* Text Content */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: message ? '4px' : 0 }}>
            {title}
          </div>
          {message && <div style={{ fontSize: '14px' }}>{message}</div>}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: colorScheme.text,
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: '20px',
            padding: 0,
            width: '20px',
            height: '20px',
            flexShrink: 0,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

/**
 * Get the target document (parent window if in iframe, current if not)
 */
function getTargetDocument(): Document {
  try {
    // Check if we're in an iframe
    if (window.parent !== window && window.parent.document) {
      // Try to access parent document
      return window.parent.document;
    }
  } catch (e) {
    // Cross-origin iframe - can't access parent
    console.debug(...UILIB, 'Toast: Cannot access parent document (cross-origin), using current window');
  }
  return document;
}

/**
 * Initialize toast container
 */
let containerRoot: Root | null = null;

function initToastContainer() {
  if (containerRoot) return;

  const targetDoc = getTargetDocument();

  // Check if container already exists in target document
  let container = targetDoc.getElementById('custom-toast-container');
  if (!container) {
    container = targetDoc.createElement('div');
    container.id = 'custom-toast-container';
    targetDoc.body.appendChild(container);
  }

  containerRoot = createRoot(container);
  containerRoot.render(
    <FluentProvider theme={webLightTheme}>
      <ToastContainerComponent />
    </FluentProvider>
  );
}

/**
 * Show a toast notification
 */
function showToast(options: ToastOptions, type: ToastType): { close: () => void } {
  initToastContainer();

  const id = `toast-${++toastIdCounter}`;
  const { title, message = '', duration = 6000 } = options;

  const toast: ToastItem = {
    id,
    type,
    title,
    message,
    duration,
    isExiting: false,
  };

  if (addToastCallback) {
    // Container is ready, add toast immediately
    addToastCallback(toast);
  } else {
    // Container not ready yet, queue the toast
    pendingToasts.push(toast);
  }

  return {
    close: () => {
      if (removeToastCallback) {
        removeToastCallback(id);
      } else {
        // Remove from pending queue if not yet shown
        const index = pendingToasts.findIndex(t => t.id === id);
        if (index >= 0) {
          pendingToasts.splice(index, 1);
        }
      }
    },
  };
}

/**
 * Toast API
 */
export const Toast = {
  success(
    titleOrOptions: string | ToastOptions,
    message?: string,
    duration?: number
  ): { show: () => void; close: () => void } {
    const options: ToastOptions =
      typeof titleOrOptions === 'string'
        ? { title: titleOrOptions, message, duration }
        : { ...titleOrOptions };

    const instance = showToast(options, 'success');
    return { show: () => { }, ...instance };
  },

  error(
    titleOrOptions: string | ToastOptions,
    message?: string,
    duration?: number
  ): { show: () => void; close: () => void } {
    const options: ToastOptions =
      typeof titleOrOptions === 'string'
        ? { title: titleOrOptions, message, duration }
        : { ...titleOrOptions };

    const instance = showToast(options, 'error');
    return { show: () => { }, ...instance };
  },

  warn(
    titleOrOptions: string | ToastOptions,
    message?: string,
    duration?: number
  ): { show: () => void; close: () => void } {
    const options: ToastOptions =
      typeof titleOrOptions === 'string'
        ? { title: titleOrOptions, message, duration }
        : { ...titleOrOptions };

    const instance = showToast(options, 'warn');
    return { show: () => { }, ...instance };
  },

  info(
    titleOrOptions: string | ToastOptions,
    message?: string,
    duration?: number
  ): { show: () => void; close: () => void } {
    const options: ToastOptions =
      typeof titleOrOptions === 'string'
        ? { title: titleOrOptions, message, duration }
        : { ...titleOrOptions };

    const instance = showToast(options, 'info');
    return { show: () => { }, ...instance };
  },

  default(
    titleOrOptions: string | ToastOptions,
    message?: string,
    duration?: number
  ): { show: () => void; close: () => void } {
    const options: ToastOptions =
      typeof titleOrOptions === 'string'
        ? { title: titleOrOptions, message, duration }
        : { ...titleOrOptions };

    const instance = showToast(options, 'default');
    return { show: () => { }, ...instance };
  },
};

// Set body overflow to prevent scrollbars on target document
if (typeof document !== 'undefined') {
  try {
    const targetDoc = getTargetDocument();
    targetDoc.body.style.overflowX = 'hidden';
  } catch (e) {
    // Fallback to current document
    document.body.style.overflowX = 'hidden';
  }
}

// Make toast globally available in parent window
if (typeof window !== 'undefined') {
  try {
    const targetWindow = window.parent !== window ? window.parent : window;
    if (targetWindow && !targetWindow.Toast) {
      targetWindow.Toast = Toast;
    }
  } catch (e) {
    // Cross-origin - can't set on parent window
    console.debug(...UILIB, 'Toast: Cannot set global Toast on parent window (cross-origin)');
  }
}
