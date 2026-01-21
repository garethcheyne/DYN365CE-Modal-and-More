/**
 * Demo Page Entry Point
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import Demo from './Demo';
import '../shared/styles.css';

// Wait for err403 library to be available
const waitForLibrary = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof (window as any).err403 !== 'undefined') {
      resolve();
      return;
    }

    const check = setInterval(() => {
      if (typeof (window as any).err403 !== 'undefined') {
        clearInterval(check);
        resolve();
      }
    }, 50);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(check);
      resolve();
    }, 5000);
  });
};

// Initialize app
const init = async () => {
  await waitForLibrary();

  // Initialize err403 library
  if (typeof (window as any).err403?.init === 'function') {
    (window as any).err403.init();
  }

  const root = document.getElementById('root');
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <FluentProvider theme={webLightTheme}>
          <Demo />
        </FluentProvider>
      </React.StrictMode>
    );
  }
};

init();
