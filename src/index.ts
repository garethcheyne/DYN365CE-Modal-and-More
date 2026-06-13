/**
 * UI Library for Dynamics 365
 * Main Entry Point
 * Available as: window.uiLib (primary) or window.err403 (backward compatibility)
 */

import { Toast } from './components/Toast/Toast';
import { Modal } from './components/Modal/Modal';
import { ModalButton } from './components/Modal/Modal.types';
import * as ModalHelpers from './components/Modal/ModalHelpers';
import { Lookup } from './components/Lookup/Lookup';
import { Logger, TRACE, BUG, WAR, ERR, UILIB } from './components/Logger/Logger';
import { QueryBuilder, serializeQueryBuilderState } from 'fluentui-extended';
import { theme } from './styles/theme';
import { initializeFluentProvider, d365Theme, FluentProvider } from './providers/FluentProvider';
import { getTargetDocument } from './utils/dom';
import { resetRendererIfStale } from './components/FluentUi/helpers';
import { injectAnimations } from './styles/animations';



/**
 * Health state of the UI library
 */
export interface HealthState {
    loaded: boolean;
    inWindow: boolean;
    version: string;
    timestamp: string;
    instance?: any; // Reference to library instance
}

/**
 * D365 Form OnLoad Handler
 * This function is called by D365 when the form loads
 * @param executionContext - The execution context from D365
 * @returns Health state of the library
 */
export function init(executionContext?: any): HealthState {
    console.debug(...UILIB, `ui-Lib v${PACKAGE_VERSION} - Starting initialization`, {
        version: PACKAGE_VERSION,
        executionContext,
        timestamp: new Date().toISOString()
    });

    // D365 SPA navigation resilience:
    // When D365 UCI navigates between records, it can tear down/rebuild the <head>,
    // removing Griffel's injected <style> elements. The renderer cache becomes stale
    // (thinks styles are injected, but they've been removed from DOM).
    // Reset stale renderer so next mountFluentComponent creates a fresh one.
    const targetDoc = getTargetDocument();
    resetRendererIfStale(targetDoc);

    // Force re-inject animations into target document.
    // D365 navigation may have removed the style tag.
    injectAnimations(targetDoc);
    
    // Initialize Fluent UI provider for consistent theming
    initializeFluentProvider();
    
    // Initialize Toast container (custom implementation handles this automatically)
    // No manual container mounting needed
    
    // Check if library is in window (check both names; uiLib is primary, err403 is backward compat)
    const inWindow = typeof window !== 'undefined' &&
        (typeof (window as any).uiLib !== 'undefined' || typeof (window as any).err403 !== 'undefined');

    // Get reference to library instance (prefer new name)
    const libraryInstance = typeof window !== 'undefined'
        ? ((window as any).uiLib ?? (window as any).err403)
        : undefined;
    
    const health: HealthState = {
        loaded: true,
        inWindow,
        version: PACKAGE_VERSION,
        timestamp: new Date().toISOString(),
        instance: libraryInstance
    };
    
    console.debug(...UILIB, `✓ ui-Lib v${PACKAGE_VERSION} loaded successfully`, {
        availableComponents: ['Toast', 'Modal', 'Lookup', 'Table', 'Logger'],
        availableAs: ['window.uiLib', 'window.err403'],
        health
    });
    
    return health;
}

/**
 * D365 Form OnLoad Handler (alias)
 * @returns Health state of the library
 */
export function onLoad(executionContext?: any): HealthState {
    return init(executionContext);
}

/**
 * Find library instance in current or parent windows (iframe support)
 * Checks both uiLib (new) and err403 (backward compatibility)
 * @returns Library instance or null if not found
 */
export function findInstance(): any {
    // Check current window first (prefer new name)
    if (typeof window !== 'undefined') {
        if (typeof (window as any).uiLib !== 'undefined' && (window as any).uiLib) {
            return (window as any).uiLib;
        }
        if (typeof (window as any).err403 !== 'undefined' && (window as any).err403) {
            return (window as any).err403;
        }
    }
    
    // Check top window
    try {
        if (typeof window !== 'undefined' && window.top && window.top !== window) {
            if (typeof (window.top as any).uiLib !== 'undefined' && (window.top as any).uiLib) {
                return (window.top as any).uiLib;
            }
            if (typeof (window.top as any).err403 !== 'undefined' && (window.top as any).err403) {
                return (window.top as any).err403;
            }
        }
    } catch (e) {
        // Cross-origin, skip
    }
    
    // Check parent window
    try {
        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
            if (typeof (window.parent as any).uiLib !== 'undefined' && (window.parent as any).uiLib) {
                return (window.parent as any).uiLib;
            }
            if (typeof (window.parent as any).err403 !== 'undefined' && (window.parent as any).err403) {
                return (window.parent as any).err403;
            }
        }
    } catch (e) {
        // Cross-origin, skip
    }
    
    return null;
}

/**
 * Diagnostic debug output for troubleshooting modal visibility issues.
 * Call `uiLib.debug()` in the browser console to get a full snapshot.
 * Returns the diagnostic object for programmatic use.
 */
export function debug(): Record<string, any> {
    const style = 'background:#5c2d91;color:#fff;padding:2px 8px;border-radius:3px;font-weight:bold;';
    const log = (msg: string, ...args: any[]) => console.log(`%c[uiLib.debug]%c ${msg}`, style, '', ...args);
    const warn = (msg: string, ...args: any[]) => console.warn(`%c[uiLib.debug]%c ${msg}`, style, '', ...args);

    log(`ui-Lib v${PACKAGE_VERSION} — Diagnostic Snapshot`);
    log(`Timestamp: ${new Date().toISOString()}`);

    const report: Record<string, any> = {
        version: PACKAGE_VERSION,
        timestamp: new Date().toISOString(),
        environment: {},
        documents: {},
        animations: {},
        modals: [],
        overlays: [],
        toasts: {},
        issues: [] as string[]
    };

    // --- Environment ---
    const env: Record<string, any> = {
        currentUrl: window.location.href,
        isIframe: window.self !== window.top,
        userAgent: navigator.userAgent
    };

    try {
        if (window.top && window.top !== window) {
            env.topUrl = window.top.location.href;
            env.topAccessible = true;
        }
    } catch {
        env.topAccessible = false;
    }

    try {
        if (window.parent && window.parent !== window) {
            env.parentUrl = window.parent.location.href;
            env.parentAccessible = true;
        }
    } catch {
        env.parentAccessible = false;
    }

    report.environment = env;
    log('Environment:', env);

    // --- Target Document ---
    const targetDoc = getTargetDocument();
    const docInfo: Record<string, any> = {
        targetDocument: targetDoc === document ? 'current' : targetDoc === window.top?.document ? 'top' : 'parent',
        targetDocUrl: targetDoc.location?.href?.substring(0, 100) || 'unknown'
    };
    report.documents = docInfo;
    log('Target document:', docInfo);

    // --- Animations ---
    const animStyleId = 'err403-animations';
    const docsToCheck: Array<{ name: string; doc: Document }> = [{ name: 'current', doc: document }];
    try { if (window.top?.document && window.top.document !== document) docsToCheck.push({ name: 'top', doc: window.top.document }); } catch { /* cross-origin */ }
    try { if (window.parent?.document && window.parent.document !== document && window.parent.document !== window.top?.document) docsToCheck.push({ name: 'parent', doc: window.parent.document }); } catch { /* cross-origin */ }

    const animInfo: Record<string, boolean> = {};
    for (const { name, doc } of docsToCheck) {
        const found = !!doc.getElementById(animStyleId);
        animInfo[`${name}_has_animations`] = found;
        if (!found && doc === targetDoc) {
            report.issues.push(`CRITICAL: Animation stylesheet missing in target document (${name}). Modals may be invisible.`);
            warn(`⚠️ Animation stylesheet NOT found in target document (${name})!`);
        }
    }
    report.animations = animInfo;
    log('Animations injected:', animInfo);

    // --- Scan for modal elements ---
    for (const { name, doc } of docsToCheck) {
        try {
            const allElements = doc.querySelectorAll('[style*="z-index"]');
            const modalElements: any[] = [];

            allElements.forEach((el: Element) => {
                const htmlEl = el as HTMLElement;
                const computedStyle = doc.defaultView?.getComputedStyle(htmlEl);
                const zIndex = parseInt(computedStyle?.zIndex || '0');
                if (zIndex >= 1000000 && computedStyle?.position === 'fixed') {
                    const rect = htmlEl.getBoundingClientRect();
                    const info: Record<string, any> = {
                        document: name,
                        tag: htmlEl.tagName,
                        id: htmlEl.id || undefined,
                        className: htmlEl.className?.substring?.(0, 60) || undefined,
                        zIndex,
                        display: computedStyle?.display,
                        visibility: computedStyle?.visibility,
                        opacity: computedStyle?.opacity,
                        pointerEvents: computedStyle?.pointerEvents,
                        dimensions: `${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`,
                        position: `(${rect.left.toFixed(0)},${rect.top.toFixed(0)})`,
                        childCount: htmlEl.childElementCount,
                        hasContent: htmlEl.innerHTML.length > 0
                    };

                    // Check for problems
                    if (rect.width === 0 || rect.height === 0) {
                        info.issue = 'ZERO_DIMENSIONS';
                        report.issues.push(`Modal element has zero dimensions in ${name} document`);
                    }
                    if (computedStyle?.display === 'none') {
                        info.issue = 'DISPLAY_NONE';
                        report.issues.push(`Modal element has display:none in ${name} document`);
                    }
                    if (computedStyle?.opacity === '0') {
                        info.issue = 'OPACITY_ZERO';
                        report.issues.push(`Modal element has opacity:0 in ${name} document (animation may have failed)`);
                    }
                    if (computedStyle?.visibility === 'hidden') {
                        info.issue = 'VISIBILITY_HIDDEN';
                        report.issues.push(`Modal element has visibility:hidden in ${name} document`);
                    }

                    // Detect if it's an overlay vs modal container
                    if (htmlEl.style.cssText.includes('background: rgba') || htmlEl.style.cssText.includes('backdrop-filter')) {
                        report.overlays.push(info);
                    } else {
                        modalElements.push(info);
                    }
                }
            });

            if (modalElements.length > 0) {
                report.modals.push(...modalElements);
            }
        } catch {
            // Cross-origin document
        }
    }

    log(`Found ${report.modals.length} modal(s), ${report.overlays.length} overlay(s)`);
    if (report.modals.length > 0) log('Modals:', report.modals);
    if (report.overlays.length > 0) log('Overlays:', report.overlays);

    // --- Toast container ---
    for (const { name, doc } of docsToCheck) {
        try {
            const toastContainer = doc.getElementById('custom-toast-container');
            if (toastContainer) {
                report.toasts = {
                    document: name,
                    exists: true,
                    childCount: toastContainer.childElementCount,
                    visible: doc.defaultView?.getComputedStyle(toastContainer).display !== 'none'
                };
            }
        } catch { /* cross-origin */ }
    }
    if (!report.toasts.exists) {
        report.toasts = { exists: false };
    }
    log('Toast container:', report.toasts);

    // --- Window chain ---
    const windowChain: string[] = [];
    try {
        let w: Window = window;
        windowChain.push(`current (uiLib: ${!!(w as any).uiLib})`);
        while (w.parent && w.parent !== w) {
            void w.parent.document; // throws on cross-origin
            w = w.parent;
            windowChain.push(`${w === window.top ? 'top' : 'parent'} (uiLib: ${!!(w as any).uiLib})`);
        }
    } catch {
        windowChain.push('(cross-origin boundary)');
    }
    report.windowChain = windowChain;
    log('Window chain:', windowChain);

    // --- Summary ---
    if (report.issues.length > 0) {
        warn(`⚠️ ${report.issues.length} issue(s) detected:`);
        report.issues.forEach((issue: string) => warn(`  • ${issue}`));
    } else {
        log('✅ No issues detected');
    }

    console.log('%c[uiLib.debug]%c Full report object (copy this for support):', style, '', report);
    return report;
}

// Export all components (named exports)
export {
    Toast,
    Modal,
    ModalButton,
    ModalButton as Button, // Alias for convenience
    ModalHelpers,
    Lookup,
    Logger,
    TRACE,
    BUG,
    WAR,
    ERR,
    UILIB,
    QueryBuilder,
    serializeQueryBuilderState,
    theme,
    // Fluent UI integration
    FluentProvider,
    d365Theme
};

// D365 iframe support - auto-detect and expose library
if (typeof window !== 'undefined') {
    // Create the library object
    const libraryObject = {
        init,
        onLoad,
        findInstance,
        debug,
        Toast,
        Modal,
        ModalButton,
        ModalHelpers,
        Lookup,
        Logger,
        TRACE,
        BUG,
        WAR,
        ERR,
        UILIB,
        QueryBuilder,
        serializeQueryBuilderState,
        theme,
        // Alias Button for ModalButton
        Button: ModalButton,
        // Fluent UI integration
        FluentProvider,
        d365Theme
    };

    // Auto-detect if library is already loaded in parent windows (iframe scenario)
    (function() {
        /**
         * Walk up the window chain and return every same-origin ancestor
         * (including the current window) from highest accessible down to current.
         * Stops at the first cross-origin SecurityError.
         */
        function getAccessibleWindowChain(): Window[] {
            const chain: Window[] = [window];
            try {
                let w: Window = window;
                // Walk up until we hit window.top or a cross-origin boundary
                while (w.parent && w.parent !== w) {
                    // Touching w.parent.location throws on cross-origin — use it as the gate
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    void w.parent.document;
                    w = w.parent;
                    chain.unshift(w); // highest-first
                    if (w === w.parent) break;
                }
            } catch {
                // Hit a cross-origin ancestor — stop walking, keep what we have
            }
            return chain;
        }

        function readInstance(w: Window): any {
            try {
                const anyW = w as any;
                if (typeof anyW.uiLib !== 'undefined' && anyW.uiLib) return anyW.uiLib;
                if (typeof anyW.err403 !== 'undefined' && anyW.err403) return anyW.err403;
            } catch {
                // Cross-origin
            }
            return null;
        }

        function writeInstance(w: Window, instance: any): boolean {
            try {
                (w as any).uiLib = instance;
                (w as any).err403 = instance; // Backward compatibility
                return true;
            } catch {
                return false;
            }
        }

        const chain = getAccessibleWindowChain(); // [highestAccessible, ..., window]
        const highest = chain[0];

        // 1. Look for an existing instance anywhere in the accessible chain
        let existingInstance: any = null;
        for (const w of chain) {
            const found = readInstance(w);
            if (found) { existingInstance = found; break; }
        }

        if (existingInstance && existingInstance !== libraryObject) {
            // An existing instance was found in an ancestor window.
            // ALWAYS overwrite with the fresh libraryObject. In D365 UCI SPA navigation,
            // the form iframe is destroyed and recreated. The old instance's Modal/Toast/etc.
            // classes have closures referencing the DESTROYED previous document/window.
            // The fresh libraryObject (just created above) has correct closures for the
            // CURRENT execution context. Writing it to all windows ensures any code
            // referencing window.uiLib gets the live, working instance.
            for (const w of chain) {
                writeInstance(w, libraryObject);
            }
            console.log(
                ...UILIB,
                `ui-Lib v${PACKAGE_VERSION} replaced stale ancestor instance, mounted fresh to ${chain.length} accessible window(s)`
            );
        } else {
            // First load on this page — mount on the highest accessible window
            // so it becomes the single source of truth, then mirror down.
            const mountedAtTop = writeInstance(highest, libraryObject);
            for (const w of chain) {
                if (w !== highest) writeInstance(w, libraryObject);
            }
            console.log(
                ...UILIB,
                `ui-Lib v${PACKAGE_VERSION} loaded; mounted at ${mountedAtTop ? 'highest accessible window' : 'current window'} (${chain.length} window(s) in chain)`
            );
        }
    })();
}
