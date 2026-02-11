/**
 * Fluent UI Helper Utilities
 */

import { React, createRoot, flushSync, type Root } from './React';
import { FluentProvider, defaultTheme, type Theme } from './Provider';
import { createDOMRenderer, RendererProvider } from '@fluentui/react-components';
import { getTargetDocument } from '../../utils/dom';

/**
 * Cache for DOM renderers by document
 * This ensures all FluentProviders targeting the same document share the same style renderer
 */
const rendererCache = new WeakMap<Document, ReturnType<typeof createDOMRenderer>>();

/**
 * Get or create a shared Griffel renderer for a specific document
 * This is critical for D365 where Modal renders to window.top.document
 * but multiple FluentProviders are created for individual components
 */
function getSharedRenderer(targetDocument: Document): ReturnType<typeof createDOMRenderer> {
  let renderer = rendererCache.get(targetDocument);
  if (!renderer) {
    renderer = createDOMRenderer(targetDocument);
    rendererCache.set(targetDocument, renderer);
  }
  return renderer;
}

/**
 * Helper function to create a FluentProvider wrapper
 * Uses targetDocument and a shared RendererProvider to ensure styles are injected
 * into the correct document (critical for D365 iframe scenarios where Modal
 * renders to window.top.document but components are mounted separately)
 */
export function createFluentProvider(
  children: React.ReactElement,
  theme: Theme = defaultTheme,
  targetDocument?: Document
): React.ReactElement {
  const doc = targetDocument || getTargetDocument();
  const renderer = getSharedRenderer(doc);

  // Wrap with RendererProvider first, then FluentProvider
  // Both need targetDocument - RendererProvider for style injection, FluentProvider for portals
  // See: https://griffel.js.org/react/api/create-dom-renderer/
  const fluentProviderElement = React.createElement(FluentProvider, {
    theme,
    targetDocument: doc
  }, children);

  return React.createElement(
    RendererProvider,
    { renderer, targetDocument: doc, children: fluentProviderElement }
  );
}

/**
 * Helper function to mount a React component with FluentProvider
 * Automatically targets the correct document for D365 compatibility
 */
export function mountFluentComponent(
  container: HTMLElement,
  component: React.ReactElement,
  theme: Theme = defaultTheme
): Root {
  const root = createRoot(container);
  // Get the owner document of the container to ensure styles go to the same document
  const targetDoc = container.ownerDocument || getTargetDocument();
  
  // Ensure Griffel renderer is ready before rendering
  // This prevents race conditions where components render before CSS is injected
  getSharedRenderer(targetDoc);
  
  // Use flushSync to force synchronous DOM updates - critical for cross-document rendering
  flushSync(() => {
    root.render(createFluentProvider(component, theme, targetDoc));
  });
  
  // Force a reflow to ensure styles are applied before returning
  // This is critical for preventing unstyled button flashes
  if (container.offsetHeight !== undefined) {
    // Reading offsetHeight triggers layout/reflow
  }
  
  return root;
}

/**
 * Helper to unmount a React component
 */
export function unmountFluentComponent(root: Root): void {
  root.unmount();
}
