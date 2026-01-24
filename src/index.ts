/**
 * err403 UI Library - Main Entry Point
 * D365 CE UI Utilities Library
 */

import { Toast } from './components/Toast/Toast';
import { Modal } from './components/Modal/Modal';
import { ModalButton } from './components/Modal/Modal.types';
import * as ModalHelpers from './components/Modal/ModalHelpers';
import { Lookup } from './components/Lookup/Lookup';
import { Logger, TRACE, BUG, WAR, ERR } from './components/Logger/Logger';
import { theme } from './styles/theme';
import {
    Input,
    MultiLine,
    OptionSet,
    DateRange,
    Lookup as LookupField,
    Custom,
    Group,
    Table
} from './components/Modal/ModalFields';
import { initializeFluentProvider, d365Theme, FluentProvider } from './providers/FluentProvider';

/**
 * Automatically load the CSS file based on the script's location
 */
function loadCSS(): boolean {
    const cssId = 'err403-ui-lib-styles';
    
    // Check if CSS is already loaded
    if (document.getElementById(cssId)) {
        console.debug(...TRACE, 'UI-lib CSS already loaded');
        return true;
    }
    
    try {
        // Find the current script tag to determine the base path
        const scripts = document.getElementsByTagName('script');
        let scriptSrc = '';
        
        // Look for ui-lib.min.js script
        for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src;
            if (src && src.includes('ui-lib.min.js')) {
                scriptSrc = src;
                break;
            }
        }
        
        if (scriptSrc) {
            // Replace .js with .css to get the CSS file path
            const cssPath = scriptSrc.replace('ui-lib.min.js', 'ui-lib.styles.css');
            
            // Create and append the link element
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = cssPath;
            
            document.head.appendChild(link);
            
            console.debug(...TRACE, 'UI-lib CSS loaded from:', cssPath);
            return true;
        } else {
            console.warn('err403: Could not determine script location for CSS auto-loading');
            return false;
        }
    } catch (error) {
        console.error('err403: Error loading CSS:', error);
        return false;
    }
}

/**
 * Health state of the UI library
 */
export interface HealthState {
    loaded: boolean;
    cssLoaded: boolean;
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
    console.debug(...TRACE, 'UI-lib init() - Starting initialization', {
        version: PACKAGE_VERSION,
        executionContext,
        timestamp: new Date().toISOString()
    });
    
    // Load CSS automatically
    const cssLoaded = loadCSS();
    
    // Initialize Fluent UI provider for consistent theming
    initializeFluentProvider();
    
    // Initialize Toast container (custom implementation handles this automatically)
    // No manual container mounting needed
    
    // Check if library is in window
    const inWindow = typeof window !== 'undefined' && typeof (window as any).err403 !== 'undefined';
    
    // Get reference to library instance
    const libraryInstance = typeof window !== 'undefined' ? (window as any).err403 : undefined;
    
    const health: HealthState = {
        loaded: true,
        cssLoaded,
        inWindow,
        version: PACKAGE_VERSION,
        timestamp: new Date().toISOString(),
        instance: libraryInstance
    };
    
    console.debug(...TRACE, 'UI-lib init() - Initialization complete. Library available in DOM as window.err403', {
        version: PACKAGE_VERSION,
        availableComponents: ['Toast', 'Modal', 'Lookup', 'Table', 'TRACE', 'WAR', 'ERR'],
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
 * @returns Library instance or null if not found
 */
export function findInstance(): any {
    // Check current window first
    if (typeof window !== 'undefined' && typeof (window as any).err403 !== 'undefined' && (window as any).err403) {
        return (window as any).err403;
    }
    
    // Check top window
    try {
        if (typeof window !== 'undefined' && window.top && window.top !== window) {
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
            if (typeof (window.parent as any).err403 !== 'undefined' && (window.parent as any).err403) {
                return (window.parent as any).err403;
            }
        }
    } catch (e) {
        // Cross-origin, skip
    }
    
    return null;
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
    theme,
    // Field helper classes
    Input,
    MultiLine,
    OptionSet,
    DateRange,
    LookupField,
    Custom,
    Group,
    Table,
    // Fluent UI integration
    FluentProvider,
    d365Theme
};

// D365 iframe support - auto-detect and expose library
if (typeof window !== 'undefined') {
    // Create the library object
    const err403Library = {
        init,
        onLoad,
        findInstance,
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
        theme,
        // Field helper classes
        Input,
        MultiLine,
        OptionSet,
        DateRange,
        LookupField,
        Custom,
        Group,
        Table,
        // Alias Button for ModalButton
        Button: ModalButton,
        // Fluent UI integration
        FluentProvider,
        d365Theme
    };

    // Auto-detect if library is already loaded in parent windows (iframe scenario)
    (function() {
        let existingInstance: any = null;
        
        // Check if already loaded in top window
        try {
            if (window.top && window.top !== window && typeof (window.top as any).err403 !== 'undefined') {
                existingInstance = (window.top as any).err403;
            }
        } catch (e) {
            // Cross-origin, skip
        }
        
        // Check parent window if not found in top
        if (!existingInstance) {
            try {
                if (window.parent && window.parent !== window && typeof (window.parent as any).err403 !== 'undefined') {
                    existingInstance = (window.parent as any).err403;
                }
            } catch (e) {
                // Cross-origin, skip
            }
        }
        
        // Check current window
        if (!existingInstance && typeof (window as any).err403 !== 'undefined') {
            existingInstance = (window as any).err403;
        }
        
        if (existingInstance && existingInstance !== err403Library) {
            // Already loaded in parent window, copy reference to current window
            (window as any).err403 = existingInstance;
            console.debug(...TRACE, 'UI Library found in parent window, assigned to current window');
        } else {
            // First time loading or already in correct scope
            (window as any).err403 = err403Library;
            
            // Expose to parent window if in iframe (for first load scenario)
            try {
                if (window.parent && window.parent !== window) {
                    (window.parent as any).err403 = err403Library;
                }
            } catch (e) {
                // Cross-origin iframe - can't access parent
            }
            
            // Also expose to top window for D365
            try {
                if (window.top && window.top !== window) {
                    (window.top as any).err403 = err403Library;
                }
            } catch (e) {
                // Cross-origin iframe - can't access parent
            }
        }
    })();
}
