/**
 * DOM utility functions for D365 compatibility
 */

/**
 * Get the target document for rendering
 * Supports D365 iframes by checking parent window
 */
export function getTargetDocument(): Document {
  try {
    // Check if we're in an iframe and can access parent
    if (window.self !== window.top && window.top) {
      return window.top.document;
    }
  } catch (e) {
    // Cross-origin iframe, can't access parent
  }
  
  return document;
}

/**
 * Get the target window for rendering
 */
export function getTargetWindow(): Window {
  return (window.parent || window) as Window;
}
