/**
 * About Page Entry Point
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import About from './About';
import '../shared/styles.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <FluentProvider theme={webLightTheme}>
        <About />
      </FluentProvider>
    </React.StrictMode>
  );
}
