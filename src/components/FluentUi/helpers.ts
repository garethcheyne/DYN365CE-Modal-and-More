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
 * Marker ID used to detect if our Griffel style injection is still in the DOM.
 * D365 UCI SPA navigation can tear down/rebuild the <head>, removing Griffel's
 * injected <style> elements while keeping the cached renderer object alive.
 * This sentinel lets us detect that scenario and create a fresh renderer.
 */
const GRIFFEL_SENTINEL_ID = 'uilib-griffel-sentinel';

/**
 * Get or create a shared Griffel renderer for a specific document.
 * Includes staleness detection: if our sentinel marker is missing from the
 * document head, the previously cached renderer's styles were removed
 * (e.g., by D365 SPA navigation) and we need a fresh one.
 */
function getSharedRenderer(targetDocument: Document): ReturnType<typeof createDOMRenderer> {
  let renderer = rendererCache.get(targetDocument);

  // Check if cached renderer's styles are still in the DOM
  if (renderer) {
    const sentinel = targetDocument.getElementById(GRIFFEL_SENTINEL_ID);
    if (!sentinel) {
      // Sentinel was removed — D365 navigation likely cleared the head.
      // Discard cached renderer so a fresh one re-injects all styles.
      rendererCache.delete(targetDocument);
      renderer = undefined;
    }
  }

  if (!renderer) {
    renderer = createDOMRenderer(targetDocument);
    rendererCache.set(targetDocument, renderer);

    // Plant a sentinel element so we can detect if D365 removes our styles later
    if (!targetDocument.getElementById(GRIFFEL_SENTINEL_ID)) {
      const sentinel = targetDocument.createElement('meta');
      sentinel.id = GRIFFEL_SENTINEL_ID;
      sentinel.setAttribute('name', 'uilib-griffel');
      sentinel.setAttribute('content', 'active');
      targetDocument.head.appendChild(sentinel);
    }
  }

  return renderer;
}

/**
 * Reset the Griffel renderer cache for a document.
 * Called by init() on each D365 form load to ensure CSS-in-JS state is valid.
 * If the sentinel is missing (indicating D365 navigation cleared our styles),
 * this forces re-creation on the next mountFluentComponent call.
 */
export function resetRendererIfStale(targetDocument?: Document): void {
  const doc = targetDocument || getTargetDocument();
  const sentinel = doc.getElementById(GRIFFEL_SENTINEL_ID);
  if (!sentinel && rendererCache.has(doc)) {
    rendererCache.delete(doc);
  }
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
  targetDocument?: Document,
  providerStyle?: React.CSSProperties
): React.ReactElement {
  const doc = targetDocument || getTargetDocument();
  const renderer = getSharedRenderer(doc);

  // Wrap with RendererProvider first, then FluentProvider
  // Both need targetDocument - RendererProvider for style injection, FluentProvider for portals
  // See: https://griffel.js.org/react/api/create-dom-renderer/
  // providerStyle is forwarded to FluentProvider's root div, which lets callers
  // make the provider participate in a parent flex layout (e.g. table fields
  // that need the provider div to be flex:1 / min-height:0 so the inner DataGrid
  // can compute a bounded height and scroll instead of overflowing).
  const fluentProviderElement = React.createElement(FluentProvider, {
    theme,
    targetDocument: doc,
    style: providerStyle
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
  theme: Theme = defaultTheme,
  providerStyle?: React.CSSProperties
): Root {
  const root = createRoot(container);
  // Get the owner document of the container to ensure styles go to the same document
  const targetDoc = container.ownerDocument || getTargetDocument();

  // Ensure Griffel renderer is ready before rendering
  // This prevents race conditions where components render before CSS is injected
  getSharedRenderer(targetDoc);

  // Use flushSync to force synchronous DOM updates - critical for cross-document rendering
  flushSync(() => {
    root.render(createFluentProvider(component, theme, targetDoc, providerStyle));
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
