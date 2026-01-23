/**
 * Modal component type definitions
 */

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen' | 'custom' | { width?: number | string; height?: number | string };
export type ModalIcon = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'QUESTION';
export type ButtonAlignment = 'left' | 'center' | 'right' | 'space-between';

export interface ModalOptions {
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

export interface ProgressConfig {
    enabled: boolean;
    type?: 'bar' | 'steps-left' | 'steps-right' | 'step';
    currentStep?: number;
    totalSteps?: number;
    steps?: StepConfig[];
    allowStepNavigation?: boolean;
}

export interface StepConfig {
    id?: string;
    label?: string;
    name?: string;
    description?: string;
    completed?: boolean;
    fields?: FieldConfig[];
    validate?: () => boolean;
}

export interface SideCartConfig {
    enabled: boolean;
    attached?: boolean;
    position?: 'left' | 'right';
    width?: number;
    content?: string;
    imageUrl?: string;
    backgroundColor?: string;
}

export interface TableColumn {
    id: string;
    header: string;
    visible?: boolean;
    sortable?: boolean;
    width?: string;
}

export interface FieldConfig {
    id: string;
    label?: string;
    labelPosition?: 'left' | 'top';
    orientation?: 'horizontal' | 'vertical'; // Field orientation for Fluent UI Field component
    type?: string;
    value?: any;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    readOnly?: boolean;
    rows?: number;
    options?: Array<string | { label: string; value: string }>;
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
    tooltip?: string;
    validation?: ValidationConfig;
    visibleWhen?: VisibilityCondition;
    // Table-specific properties
    columns?: TableColumn[];
    data?: any[];
    selectionMode?: 'none' | 'single' | 'multiple';
    onRowSelect?: (selectedRows: any[]) => void;
}

export interface ValidationConfig {
    rules?: ValidationRule[];
    showErrors?: boolean;
}

export interface ValidationRule {
    type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
    value?: any;
    message: string;
    validate?: (value: any) => boolean;
}

export interface VisibilityCondition {
    field: string;
    operator?: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'truthy' | 'falsy';
    value?: any;
}

export class ModalButton {
    label: string;
    callback: () => void | false | Promise<void | false>;
    setFocus: boolean;
    preventClose: boolean;
    isDestructive: boolean;

    constructor(
        label: string,
        callback: () => void | false | Promise<void | false>,
        setFocus: boolean = false,
        preventClose: boolean = false,
        isDestructive: boolean = false
    ) {
        this.label = label;
        this.callback = callback;
        this.setFocus = setFocus;
        this.preventClose = preventClose;
        this.isDestructive = isDestructive;
    }
}

export interface ModalResponse {
    button: ModalButton;
    data: Record<string, any>;
}

export interface ModalInstance {
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
    updateSideCart(content: string | { imageUrl: string }): void;
    clearAutoSave(): void;
    getElement(selector?: string): HTMLElement | HTMLElement[] | null;
    title(title: string): this;
    message(message: string): this;
    content(content: string): this;
    width(width: number): this;
    height(height: number): this;
    showWebResource(webResourcePath: string): void;
}
