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
function loadCSS(): void {
    const cssId = 'err403-ui-lib-styles';
    
    // Check if CSS is already loaded
    if (document.getElementById(cssId)) {
        console.debug(...TRACE, 'UI-lib CSS already loaded');
        return;
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
        } else {
            console.warn('err403: Could not determine script location for CSS auto-loading');
        }
    } catch (error) {
        console.error('err403: Error loading CSS:', error);
    }
}

/**
 * D365 Form OnLoad Handler
 * This function is called by D365 when the form loads
 * @param executionContext - The execution context from D365
 */
export function init(executionContext?: any): void {
    console.debug(...TRACE, 'UI-lib init() - Starting initialization', {
        version: PACKAGE_VERSION,
        executionContext,
        timestamp: new Date().toISOString()
    });
    
    // Load CSS automatically
    loadCSS();
    
    // Initialize Fluent UI provider for consistent theming
    initializeFluentProvider();
    
    // Initialize Toast container (custom implementation handles this automatically)
    // No manual container mounting needed
    
    console.debug(...TRACE, 'UI-lib init() - Initialization complete. Library available in DOM as window.err403', {
        version: PACKAGE_VERSION,
        availableComponents: ['Toast', 'Modal', 'Lookup', 'Table', 'TRACE', 'WAR', 'ERR']
    });
}

/**
 * D365 Form OnLoad Handler (alias)
 */
export function onLoad(executionContext?: any): void {
    init(executionContext);
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

// D365 iframe support - expose library to parent window
if (typeof window !== 'undefined') {
    // Create the library object
    const err403Library = {
        init,
        onLoad,
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

    // Expose to current window (iframe)
    (window as any).err403 = err403Library;

    // Expose to parent window if in iframe
    try {
        if (window.parent && window.parent !== window) {
            (window.parent as any).err403 = err403Library;
        }

        // Also expose to top window for D365
        if (window.top && window.top !== window) {
            (window.top as any).err403 = err403Library;
        }
    } catch (e) {
        // Cross-origin iframe - can't access parent
        console.warn('err403: Running in cross-origin iframe, library only available in current frame');
    }
}
