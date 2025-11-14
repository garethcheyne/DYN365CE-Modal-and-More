interface ToastOptions {
    title: string;
    message?: string;
    duration?: number;
    sound?: boolean;
}
interface ToastInstance {
    element: HTMLElement;
    show(): void;
    close(): void;
}

/**
 * Toast Notification System
 * Provides toast notifications with different types and sound support
 */

/**
 * Toast API
 */
declare const Toast: {
    success(titleOrOptions: string | ToastOptions, message?: string, duration?: number, sound?: boolean): ToastInstance;
    error(titleOrOptions: string | ToastOptions, message?: string, duration?: number, sound?: boolean): ToastInstance;
    warn(titleOrOptions: string | ToastOptions, message?: string, duration?: number, sound?: boolean): ToastInstance;
    info(titleOrOptions: string | ToastOptions, message?: string, duration?: number, sound?: boolean): ToastInstance;
    default(titleOrOptions: string | ToastOptions, message?: string, duration?: number, sound?: boolean): ToastInstance;
};

/**
 * Modal component type definitions
 */
type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen' | 'custom';
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
    width?: number;
    height?: number;
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
interface FieldConfig {
    id: string;
    label?: string;
    labelPosition?: 'left' | 'top';
    type?: string;
    value?: any;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    rows?: number;
    options?: Array<string | {
        label: string;
        value: string;
    }>;
    multiSelect?: boolean;
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
    validation?: ValidationConfig;
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
declare class ModalButton {
    label: string;
    callback: () => void | false | Promise<void | false>;
    setFocus: boolean;
    preventClose: boolean;
    isDestructive: boolean;
    constructor(label: string, callback: () => void | false | Promise<void | false>, setFocus?: boolean, preventClose?: boolean, isDestructive?: boolean);
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
    private currentStep;
    private options;
    private isDragging;
    private dragStartX;
    private dragStartY;
    private modalStartX;
    private modalStartY;
    constructor(options: ModalOptions);
    private createModal;
    private getModalDimensions;
    private createHeader;
    private createBody;
    private createSideCart;
    private createTabs;
    private createField;
    private createFooter;
    private createButton;
    private startDrag;
    private handleDrag;
    private stopDrag;
    private handleEscapeKey;
    show(): void;
    showAsync(): Promise<ModalResponse>;
    close(): void;
    setLoading(loading: boolean, message?: string): void;
    updateProgress(step: number, _skipValidation?: boolean): void;
    nextStep(): void;
    previousStep(): void;
    goToStep(_stepId: string): void;
    getFieldValue(fieldId: string): any;
    getFieldValues(): Record<string, any>;
    validateCurrentStep(): boolean;
    validateAllFields(): boolean;
    updateSideCart(_content: string | {
        imageUrl: string;
    }): void;
    clearAutoSave(): void;
    getElement(selector?: string): HTMLElement | HTMLElement[] | null;
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
     */
    showWebResource(webResourcePath: string): void;
}

/**
 * Modal helper functions for common dialog patterns
 * TEMPORARY STUBS - Full implementation pending Modal.ts recreation
 */

/**
 * Show a simple alert dialog
 */
declare function alert(title: string, message: string, options?: Partial<ModalOptions>): Promise<void>;
/**
 * Show a confirmation dialog
 */
declare function confirm(title: string, message: string, options?: Partial<ModalOptions>): Promise<boolean>;
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
 */

declare class Lookup$1 {
    private static activeInstance;
    private options;
    private container;
    private overlay;
    private modal;
    private tableContainer;
    private tableBody;
    private searchInput;
    private paginationInfo;
    private currentPage;
    private totalRecords;
    private records;
    private allLoadedRecords;
    private selectedRecords;
    private searchDebounceTimer;
    private columnLabels;
    private sortColumn;
    private sortDescending;
    private isLoadingMore;
    private hasMoreRecords;
    private constructor();
    private render;
    private createHeader;
    private createSearchBar;
    private createTableContainer;
    private createPagination;
    private createFooter;
    private loadColumnLabels;
    private handleScroll;
    private loadMoreRecords;
    private loadData;
    private renderTableRows;
    private toggleSelection;
    private clearSelection;
    private handleSearch;
    private handleSort;
    private updatePagination;
    private select;
    private cancel;
    private close;
    private show;
    static open(options: LookupOptions): void;
}

/**
 * Logger utility for debugging
 * Provides colored console output for different log levels
 */
declare const BUG: string[];
declare const WAR: string[];
declare const ERR: string[];
declare const Logger: {
    BUG: string[];
    WAR: string[];
    ERR: string[];
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
 * Modal Field Helper Classes
 * Provides convenient constructors for modal fields
 */

/**
 * Input field helper
 */
declare class Input implements FieldConfig {
    id: string;
    label?: string;
    type?: string;
    value?: any;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    divider?: boolean;
    extraAttributes?: Record<string, string | number>;
    showValue?: boolean;
    validation?: any;
    constructor(config: FieldConfig);
}
/**
 * MultiLine (textarea) field helper
 */
declare class MultiLine implements FieldConfig {
    id: string;
    label?: string;
    type: string;
    value?: any;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    rows?: number;
    divider?: boolean;
    constructor(config: FieldConfig);
}
/**
 * OptionSet (dropdown/select) field helper
 */
declare class OptionSet implements FieldConfig {
    id: string;
    label?: string;
    type: string;
    value?: any;
    disabled?: boolean;
    required?: boolean;
    options?: Array<string | {
        label: string;
        value: string;
    }>;
    multiSelect?: boolean;
    divider?: boolean;
    constructor(config: FieldConfig);
}
/**
 * DateRange field helper
 */
declare class DateRange implements FieldConfig {
    id: string;
    label?: string;
    type: string;
    startDate?: Date;
    endDate?: Date;
    required?: boolean;
    disabled?: boolean;
    divider?: boolean;
    constructor(config: FieldConfig);
}
/**
 * Lookup field helper
 */
declare class Lookup implements FieldConfig {
    id: string;
    label?: string;
    type: string;
    entityTypes?: string[];
    allowMultiSelect?: boolean;
    callback?: (selected: any[]) => void;
    required?: boolean;
    disabled?: boolean;
    divider?: boolean;
    constructor(config: FieldConfig);
}
/**
 * Custom field helper
 */
declare class Custom implements FieldConfig {
    id: string;
    label?: string;
    type: string;
    render?: () => HTMLElement;
    html?: string;
    divider?: boolean;
    constructor(config: FieldConfig);
}
/**
 * Group field helper (for organizing fields, optionally as tabs)
 */
declare class Group implements FieldConfig {
    id: string;
    label?: string;
    type: string;
    fields?: FieldConfig[];
    asTabs?: boolean;
    divider?: boolean;
    constructor(config: FieldConfig);
}

/**
 * err403 UI Library - Main Entry Point
 * D365 CE UI Utilities Library
 */

/**
 * D365 Form OnLoad Handler
 * This function is called by D365 when the form loads
 * @param executionContext - The execution context from D365
 */
declare function init(executionContext?: any): void;
/**
 * D365 Form OnLoad Handler (alias)
 */
declare function onLoad(executionContext?: any): void;

export { BUG, ModalButton as Button, Custom, DateRange, ERR, Group, Input, Logger, Lookup$1 as Lookup, Lookup as LookupField, Modal, ModalButton, ModalHelpers_d as ModalHelpers, MultiLine, OptionSet, Toast, WAR, init, onLoad, theme };

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
