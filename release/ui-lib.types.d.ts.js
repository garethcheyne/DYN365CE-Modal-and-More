import { Theme } from '@fluentui/react-components';
export { FluentProvider } from '@fluentui/react-components';

interface ToastOptions {
    title: string;
    message?: string;
    duration?: number;
    sound?: boolean;
}

/**
 * Custom Toast Notification System with slide-out animations
 * Full control over appearance and animations
 */

/**
 * Toast API
 */
declare const Toast: {
    success(titleOrOptions: string | ToastOptions, message?: string, duration?: number): {
        show: () => void;
        close: () => void;
    };
    error(titleOrOptions: string | ToastOptions, message?: string, duration?: number): {
        show: () => void;
        close: () => void;
    };
    warn(titleOrOptions: string | ToastOptions, message?: string, duration?: number): {
        show: () => void;
        close: () => void;
    };
    info(titleOrOptions: string | ToastOptions, message?: string, duration?: number): {
        show: () => void;
        close: () => void;
    };
    default(titleOrOptions: string | ToastOptions, message?: string, duration?: number): {
        show: () => void;
        close: () => void;
    };
};

/**
 * Modal component type definitions
 */
type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen' | 'custom' | {
    width?: number | string;
    height?: number | string;
};
type ModalIcon = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'QUESTION';
type ButtonAlignment = 'left' | 'center' | 'right' | 'space-between';
interface ModalOptions {
    id?: string;
    title: string;
    message?: string;
    content?: string;
    customContent?: HTMLElement;
    icon?: ModalIcon;
    size?: ModalSize;
    width?: number | string;
    height?: number | string;
    padding?: number;
    preventClose?: boolean;
    allowDismiss?: boolean;
    allowEscapeClose?: boolean;
    draggable?: boolean;
    buttonAlignment?: ButtonAlignment;
    autoSave?: boolean;
    autoSaveKey?: string;
    progress?: ProgressConfig;
    sideCart?: SideCartConfig;
    fields?: FieldConfig[];
    buttons?: ModalButton[];
}
interface ProgressConfig {
    enabled: boolean;
    type?: 'bar' | 'steps-left' | 'steps-right' | 'step';
    currentStep?: number;
    totalSteps?: number;
    steps?: StepConfig[];
    allowStepNavigation?: boolean;
}
interface StepConfig {
    id?: string;
    label?: string;
    name?: string;
    description?: string;
    message?: string;
    content?: string;
    completed?: boolean;
    fields?: FieldConfig[];
    validate?: () => boolean;
}
interface SideCartConfig {
    enabled: boolean;
    attached?: boolean;
    position?: 'left' | 'right';
    width?: number;
    content?: string;
    imageUrl?: string;
    backgroundColor?: string;
}
interface TableColumn {
    id: string;
    header: string;
    visible?: boolean;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
}
interface FieldConfig {
    id: string;
    label?: string;
    labelPosition?: 'left' | 'top';
    orientation?: 'horizontal' | 'vertical';
    type?: string;
    value?: any;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    readOnly?: boolean;
    rows?: number;
    options?: Array<string | {
        label: string;
        value: string;
    }>;
    multiSelect?: boolean;
    displayMode?: 'dropdown' | 'badges';
    optionSet?: {
        entityName: string;
        attributeName: string;
        includeNull?: boolean;
        sortByLabel?: boolean;
    };
    addressLookup?: {
        provider: 'google' | 'azure';
        apiKey?: string;
        onSelect?: (address: AddressResult) => void;
        placeholder?: string;
        componentRestrictions?: {
            country: string | string[];
        };
        fields?: {
            street?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
            latitude?: string;
            longitude?: string;
        };
    };
    fileUpload?: {
        accept?: string;
        maxFiles?: number;
        maxSize?: number;
        multiple?: boolean;
        showFileList?: boolean;
        onFilesSelected?: (files: File[]) => void;
        dragDropText?: string;
        browseText?: string;
    };
    entityName?: string;
    lookupColumns?: Array<string | {
        attribute: string;
        label?: string;
        visible?: boolean;
    }>;
    filters?: string;
    startDate?: Date;
    endDate?: Date;
    entityTypes?: string[];
    allowMultiSelect?: boolean;
    callback?: (selected: any[]) => void;
    render?: () => HTMLElement;
    html?: string;
    fields?: FieldConfig[];
    asTabs?: boolean;
    divider?: boolean;
    extraAttributes?: Record<string, string | number>;
    showValue?: boolean;
    tooltip?: string;
    validation?: ValidationConfig;
    visibleWhen?: VisibilityCondition;
    requiredWhen?: RequiredCondition;
    onChange?: (value: any) => void;
    tableColumns?: TableColumn[];
    data?: any[];
    selectionMode?: 'none' | 'single' | 'multiple';
    onRowSelect?: (selectedRows: any[]) => void;
}
interface ValidationConfig {
    rules?: ValidationRule[];
    showErrors?: boolean;
}
interface ValidationRule {
    type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
    value?: any;
    message: string;
    validate?: (value: any) => boolean;
}
interface VisibilityCondition {
    field: string;
    operator?: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'truthy' | 'falsy';
    value?: any;
}
type RequiredCondition = VisibilityCondition;
interface AddressResult {
    formattedAddress: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
}
interface ModalButtonConfig {
    label: string;
    callback: () => void | false | Promise<void | false>;
    setFocus?: boolean;
    preventClose?: boolean;
    isDestructive?: boolean;
    id?: string;
    requiresValidation?: boolean;
    validateAllSteps?: boolean;
}
declare class ModalButton {
    id: string;
    label: string;
    callback: () => void | false | Promise<void | false>;
    setFocus: boolean;
    preventClose: boolean;
    isDestructive: boolean;
    requiresValidation: boolean;
    validateAllSteps: boolean;
    constructor(labelOrConfig: string | ModalButtonConfig, callback?: () => void | false | Promise<void | false>, setFocus?: boolean, preventClose?: boolean, isDestructive?: boolean, id?: string, requiresValidation?: boolean, validateAllSteps?: boolean);
    private isButtonConfig;
    private validateLabel;
    private validateCallback;
}
interface ModalResponse {
    button: ModalButton;
    data: Record<string, any>;
}
interface ModalInstance {
    show(): void;
    showAsync(): Promise<ModalResponse>;
    close(): void;
    setLoading(loading: boolean, message?: string): void;
    updateProgress(step: number, skipValidation?: boolean): void;
    nextStep(): void;
    previousStep(): void;
    goToStep(stepId: string): void;
    getFieldValue(fieldId: string): any;
    getFieldValues(): Record<string, any>;
    setFieldValue(fieldId: string, value: any): void;
    validateCurrentStep(): boolean;
    validateAllFields(): boolean;
    updateSideCart(content: string | {
        imageUrl: string;
    }): void;
    clearAutoSave(): void;
    getElement(selector?: string): HTMLElement | HTMLElement[] | null;
    title(title: string): this;
    message(message: string): this;
    content(content: string): this;
    width(width: number): this;
    height(height: number): this;
    showWebResource(webResourcePath: string): void;
}

/**
 * Modal Component
 * Advanced dialog system for D365 CE
 */

/**
 * Modal class
 */
declare class Modal implements ModalInstance {
    private overlay;
    private container;
    private modal;
    private header;
    private body;
    private footer;
    private loadingOverlay;
    private resolvePromise;
    private fieldValues;
    private fieldVisibilityMap;
    private fieldRequiredMap;
    private fieldValidationErrors;
    private currentStep;
    private totalSteps;
    private stepPanels;
    private stepIndicator;
    private buttonElements;
    private options;
    private isDragging;
    private dragStartX;
    private dragStartY;
    private modalStartX;
    private modalStartY;
    private isFullscreen;
    private fieldSetters;
    constructor(options: ModalOptions);
    /**
     * Initialize modal asynchronously (for D365 option set fetching)
     */
    private initModal;
    /**
     * Fetch option set values from D365 metadata
     */
    private fetchD365OptionSet;
    /**
     * Create address lookup field with Google Maps or Azure Maps
     */
    private createAddressLookupField;
    private createModal;
    private getModalDimensions;
    private createIconElement;
    private createHeader;
    private createBody;
    private createStepIndicator;
    private updateStepIndicator;
    private createSideCart;
    private createTabs;
    private createField;
    private evaluateVisibilityCondition;
    private updateFieldVisibility;
    private getAllFields;
    private createFooter;
    /**
     * Update button states based on validation requirements
     * Disables buttons with requiresValidation=true when required fields are invalid
     */
    private updateButtonStates;
    /**
     * Validate all fields in the modal (non-wizard)
     */
    validateAllFields(): boolean;
    private createButton;
    private startDrag;
    private handleDrag;
    private stopDrag;
    private handleEscapeKey;
    private toggleFullscreen;
    show(): void;
    showAsync(): Promise<ModalResponse>;
    close(): void;
    setLoading(loading: boolean, message?: string): void;
    updateProgress(step: number, _skipValidation?: boolean): void;
    nextStep(): void;
    previousStep(): void;
    goToStep(stepId: string): void;
    /**
     * Validate if a step has all required fields filled
     */
    private validateStep;
    getFieldValue(fieldId: string): any;
    getFieldValues(): Record<string, any>;
    setFieldValue(fieldId: string, value: any): void;
    validateCurrentStep(): boolean;
    updateSideCart(_content: string | {
        imageUrl: string;
    }): void;
    clearAutoSave(): void;
    getElement(selector?: string): HTMLElement | HTMLElement[] | null;
    /**
     * Get button by id, label, or index with chainable methods
     * @param idLabelOrIndex - Button id (string), label (string), or index (number, 0-based)
     * @returns Chainable button controller or null if not found
     */
    getButton(idLabelOrIndex: string | number): ButtonController | null;
    title(title: string): this;
    message(message: string): this;
    content(content: string): this;
    width(width: number): this;
    height(height: number): this;
    static open(options: ModalOptions): Modal;
    static alert(title: string, message: string, options?: Partial<ModalOptions>): Promise<void>;
    static confirm(title: string, message: string, options?: Partial<ModalOptions>): Promise<boolean>;
    /**
     * Show a D365 web resource in the modal
     * @param webResourcePath - Path to the web resource (e.g., 'abdg_/html/datagrid.htm?data=ProductQuotedHistory&id=123')
     * @param options - Options for webresource display (optional)
     */
    showWebResource(webResourcePath: string, options?: {
        autoResize?: boolean;
        width?: number | string;
        height?: number | string;
        size?: 'small' | 'medium' | 'large' | 'fullscreen';
    }): void;
}
/**
 * Chainable button controller for manipulating modal buttons
 */
declare class ButtonController {
    private button;
    private buttonElements;
    constructor(button: ModalButton, buttonElements: Map<ModalButton, HTMLElement>);
    /**
     * Set button label text
     * @param label - New label text
     * @returns This ButtonController for chaining
     */
    setLabel(label: string): this;
    /**
     * Enable or disable the button
     * @param disabled - True to disable, false to enable
     * @returns This ButtonController for chaining
     */
    setDisabled(disabled: boolean): this;
    /**
     * Show or hide the button
     * @param visible - True to show, false to hide
     * @returns This ButtonController for chaining
     */
    setVisible(visible: boolean): this;
    /**
     * Enable the button (convenience method)
     * @returns This ButtonController for chaining
     */
    enable(): this;
    /**
     * Disable the button (convenience method)
     * @returns This ButtonController for chaining
     */
    disable(): this;
    /**
     * Show the button (convenience method)
     * @returns This ButtonController for chaining
     */
    show(): this;
    /**
     * Hide the button (convenience method)
     * @returns This ButtonController for chaining
     */
    hide(): this;
}

/**
 * Modal helper functions for common dialog patterns
 */

/**
 * Show a simple alert dialog
 */
declare function alert(title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error', options?: Partial<ModalOptions>): Promise<void>;
/**
 * Show a confirmation dialog
 */
declare function confirm(title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error', options?: Partial<ModalOptions>): Promise<boolean>;
/**
 * Show a prompt dialog
 */
declare function prompt(title: string, message: string, defaultValue?: string, options?: Partial<ModalOptions>): Promise<string | null>;

declare const ModalHelpers_d_alert: typeof alert;
declare const ModalHelpers_d_confirm: typeof confirm;
declare const ModalHelpers_d_prompt: typeof prompt;
declare namespace ModalHelpers_d {
  export {
    ModalHelpers_d_alert as alert,
    ModalHelpers_d_confirm as confirm,
    ModalHelpers_d_prompt as prompt,
  };
}

/**
 * Lookup Component Type Definitions
 */
interface LookupResult {
    id: string;
    name: string;
    entityType: string;
    attributes: Record<string, any>;
}
interface OrderByOption {
    attribute: string;
    descending?: boolean;
}
interface LookupOptions {
    entity: string;
    columns: string[];
    columnLabels?: Record<string, string>;
    filters?: string;
    orderBy?: OrderByOption[];
    multiSelect?: boolean;
    searchFields?: string[];
    additionalSearchFields?: string[];
    defaultSearchTerm?: string;
    title?: string;
    width?: number;
    height?: number;
    pageSize?: number;
    showPagination?: boolean;
    allowClear?: boolean;
    onSelect: (records: LookupResult[]) => void;
    onCancel?: () => void;
}

/**
 * Lookup Component
 * Advanced entity record lookup with table display, search, pagination
 * Uses Modal component with Fluent UI SearchBox and Table
 */

declare class Lookup {
    private static activeModal;
    private options;
    private records;
    private filteredRecords;
    private selectedRecords;
    private searchTerm;
    private constructor();
    private loadRecords;
    private filterRecords;
    private createModal;
    private select;
    private cancel;
    private clear;
    static open(options: LookupOptions): void;
}

/**
 * Logger utility for debugging
 * Provides colored console output for different log levels
 */
declare const TRACE: string[];
declare const BUG: string[];
declare const WAR: string[];
declare const ERR: string[];
declare const UILIB: string[];
declare const Logger: {
    TRACE: string[];
    BUG: string[];
    WAR: string[];
    ERR: string[];
    UILIB: string[];
};

/**
 * Fluent UI-inspired design tokens
 * Custom theme for D365 CE UI Library
 */
declare const theme: {
    colors: {
        primary: string;
        primaryHover: string;
        primaryPressed: string;
        success: string;
        error: string;
        warning: string;
        info: string;
        neutralPrimary: string;
        neutralSecondary: string;
        neutralTertiary: string;
        neutralLight: string;
        neutralLighter: string;
        neutralLighterAlt: string;
        white: string;
        toast: {
            success: {
                bg: string;
                border: string;
                text: string;
            };
            error: {
                bg: string;
                border: string;
                text: string;
            };
            warn: {
                bg: string;
                border: string;
                text: string;
            };
            info: {
                bg: string;
                border: string;
                text: string;
            };
            default: {
                bg: string;
                border: string;
                text: string;
            };
        };
        modal: {
            background: string;
            text: string;
            textSecondary: string;
            border: string;
            overlay: string;
            headerBackground: string;
            footerBackground: string;
            divider: string;
            primary: string;
            primaryHover: string;
            primaryPressed: string;
            primaryText: string;
            secondary: string;
            secondaryBorder: string;
            secondaryText: string;
            secondaryHover: string;
            secondaryPressed: string;
            danger: string;
            dangerHover: string;
            dangerPressed: string;
            dangerText: string;
            inputBackground: string;
            inputBorder: string;
            inputBorderBottom: string;
            inputBorderHover: string;
            inputBorderFocus: string;
            inputText: string;
            inputPlaceholder: string;
            inputDisabled: string;
            tabBorder: string;
            tabActive: string;
            tabActiveBorder: string;
            tabInactive: string;
            tabInactiveBorder: string;
            tabHover: string;
            tabBackground: string;
            tabSelectedBackground: string;
            progress: {
                bar: string;
                barBackground: string;
                stepActive: string;
                stepCompleted: string;
                stepPending: string;
                stepText: string;
                stepBorder: string;
            };
            sideCart: {
                background: string;
                border: string;
                text: string;
            };
        };
    };
    shadows: {
        toast: string;
        modal: string;
        dropdown: string;
        card: string;
        depth8: string;
        depth16: string;
        depth64: string;
    };
    borderRadius: {
        none: string;
        small: string;
        medium: string;
        large: string;
        circular: string;
    };
    typography: {
        fontFamily: string;
        fontSize: {
            caption: string;
            body: string;
            subtitle: string;
            title: string;
            large: string;
            xLarge: string;
        };
        fontWeight: {
            regular: number;
            semibold: number;
            bold: number;
        };
        lineHeight: {
            caption: string;
            body: string;
            subtitle: string;
            title: string;
        };
    };
    spacing: {
        none: string;
        xxs: string;
        xs: string;
        sNudge: string;
        s: string;
        mNudge: string;
        m: string;
        l: string;
        xl: string;
        xxl: string;
        xxxl: string;
    };
    zIndex: {
        toast: number;
        modal: number;
        modalOverlay: number;
        dropdown: number;
    };
};

/**
 * FluentProvider wrapper for D365 CE UI Library
 * Provides Fluent UI v9 theming and context for all components
 */

/**
 * Custom theme based on D365 design tokens
 * Extends Fluent UI webLightTheme with D365-specific colors
 */
declare const d365Theme: Theme;

/**
 * UI Library for Dynamics 365
 * Main Entry Point
 * Available as: window.uiLib (primary) or window.err403 (backward compatibility)
 */

/**
 * Health state of the UI library
 */
interface HealthState {
    loaded: boolean;
    cssLoaded: boolean;
    inWindow: boolean;
    version: string;
    timestamp: string;
    instance?: any;
}
/**
 * D365 Form OnLoad Handler
 * This function is called by D365 when the form loads
 * @param executionContext - The execution context from D365
 * @returns Health state of the library
 */
declare function init(executionContext?: any): HealthState;
/**
 * D365 Form OnLoad Handler (alias)
 * @returns Health state of the library
 */
declare function onLoad(executionContext?: any): HealthState;
/**
 * Find library instance in current or parent windows (iframe support)
 * Checks both uiLib (new) and err403 (backward compatibility)
 * @returns Library instance or null if not found
 */
declare function findInstance(): any;

export { BUG, ModalButton as Button, ERR, Logger, Lookup, Modal, ModalButton, ModalHelpers_d as ModalHelpers, TRACE, Toast, UILIB, WAR, d365Theme, findInstance, init, onLoad, theme };
export type { HealthState };

/**
 * Global err403 namespace declarations
 */
export as namespace err403;

declare global {
    interface Window {
        err403: typeof import('./ui-lib.types');
    }
    
    const err403: Window['err403'];
}
