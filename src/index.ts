/**
 * err403 UI Library - Main Entry Point
 * D365 CE UI Utilities Library
 */

import { Toast } from './components/Toast/Toast';
import { Modal } from './components/Modal/Modal';
import { ModalButton } from './components/Modal/Modal.types';
import * as ModalHelpers from './components/Modal/ModalHelpers';
import { Lookup } from './components/Lookup/Lookup';
import { Logger, BUG, WAR, ERR } from './components/Logger/Logger';
import { theme } from './styles/theme';
import {
    Input,
    MultiLine,
    OptionSet,
    DateRange,
    Lookup as LookupField,
    Custom,
    Group
} from './components/Modal/ModalFields';

/**
 * D365 Form OnLoad Handler
 * This function is called by D365 when the form loads
 * @param executionContext - The execution context from D365
 */
export function init(executionContext?: any): void {
    console.log('err403 UI Library initialized', { executionContext });
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
    Group
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
        // Alias Button for ModalButton
        Button: ModalButton
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
