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
    message?: string;        // Step-specific message (appears below step indicator)
    content?: string;        // Step-specific HTML content (appears below step indicator)
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
    align?: 'left' | 'center' | 'right';
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
    displayMode?: 'dropdown' | 'badges';  // Display mode for select/optionset fields
    // D365 OptionSet auto-fetch configuration
    optionSet?: {
        entityName: string;      // e.g., 'account'
        attributeName: string;   // e.g., 'industrycode'
        includeNull?: boolean;   // Include blank/null option
        sortByLabel?: boolean;   // Sort alphabetically by label (default: by value)
    };
    // Address Lookup configuration
    addressLookup?: {
        provider: 'google' | 'azure';  // Maps provider
        apiKey?: string;               // API key (optional, can use global config)
        onSelect?: (address: AddressResult) => void;  // Callback when address selected
        placeholder?: string;          // Search placeholder text
        componentRestrictions?: {      // Restrict search to specific countries
            country: string | string[]; // ISO country codes (e.g., 'nz', 'au', or ['nz', 'au'])
        };
        fields?: {                     // Auto-populate related fields
            street?: string;           // Field ID for street address
            city?: string;             // Field ID for city
            state?: string;            // Field ID for state/province
            postalCode?: string;       // Field ID for postal/zip code
            country?: string;          // Field ID for country
            latitude?: string;         // Field ID for latitude
            longitude?: string;        // Field ID for longitude
        };
    };
    // File Upload configuration
    fileUpload?: {
        accept?: string;               // File type filter (e.g., '.pdf,.doc,.docx', 'image/*', 'application/pdf')
        maxFiles?: number;             // Maximum number of files (default: unlimited)
        maxSize?: number;              // Maximum file size in bytes (e.g., 5242880 for 5MB)
        multiple?: boolean;            // Allow multiple file selection (default: true)
        showFileList?: boolean;        // Show list of selected files (default: true)
        onFilesSelected?: (files: File[]) => void; // Callback when files are selected
        dragDropText?: string;         // Custom text for drag-drop zone
        browseText?: string;           // Custom text for browse button
    };
    // Inline Lookup configuration (D365-style dropdown)
    entityName?: string;               // Entity logical name (e.g., 'account', 'contact')
    lookupColumns?: Array<string | {   // Columns to display with configuration
        attribute: string;              // Attribute name
        label?: string;                 // Display label
        visible?: boolean;              // true = always visible, false = show on expand
    }>;
    filters?: string;                  // OData filter string or FetchXML fragment
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
    // Table-specific properties
    tableColumns?: TableColumn[];
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

export type RequiredCondition = VisibilityCondition;

export interface AddressResult {
    formattedAddress: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
}

export interface ModalButtonConfig {
    label: string;
    callback: () => void | false | Promise<void | false>;
    setFocus?: boolean;
    preventClose?: boolean;
    isDestructive?: boolean;
    id?: string;
    requiresValidation?: boolean;  // If true, button is disabled until all required fields are valid
    validateAllSteps?: boolean;    // If true (in wizards), validates ALL steps instead of just current step
}

export class ModalButton {
    id: string;
    label: string;
    callback: () => void | false | Promise<void | false>;
    setFocus: boolean;
    preventClose: boolean;
    isDestructive: boolean;
    requiresValidation: boolean;
    validateAllSteps: boolean;

    constructor(
        labelOrConfig: string | ModalButtonConfig,
        callback?: () => void | false | Promise<void | false>,
        setFocus: boolean = false,
        preventClose: boolean = false,
        isDestructive: boolean = false,
        id?: string,
        requiresValidation: boolean = false,
        validateAllSteps: boolean = false
    ) {
        if (this.isButtonConfig(labelOrConfig)) {
            // Object-style API (modern, self-documenting)
            this.validateLabel(labelOrConfig.label);
            this.validateCallback(labelOrConfig.callback);
            
            this.label = labelOrConfig.label;
            this.callback = labelOrConfig.callback;
            this.setFocus = labelOrConfig.setFocus ?? false;
            this.preventClose = labelOrConfig.preventClose ?? false;
            this.isDestructive = labelOrConfig.isDestructive ?? false;
            this.requiresValidation = labelOrConfig.requiresValidation ?? false;
            this.validateAllSteps = labelOrConfig.validateAllSteps ?? false;
            this.id = labelOrConfig.id ?? labelOrConfig.label.toLowerCase().replace(/\s+/g, '');
        } else {
            // Positional parameters API (traditional, backward compatible)
            this.validateLabel(labelOrConfig);
            this.validateCallback(callback);
            
            this.label = labelOrConfig;
            this.callback = callback!;
            this.setFocus = setFocus;
            this.preventClose = preventClose;
            this.isDestructive = isDestructive;
            this.requiresValidation = requiresValidation;
            this.validateAllSteps = validateAllSteps;
            this.id = id ?? labelOrConfig.toLowerCase().replace(/\s+/g, '');
        }
    }

    private isButtonConfig(value: unknown): value is ModalButtonConfig {
        return typeof value === 'object' && value != null && 'label' in value;
    }

    private validateLabel(label: unknown): asserts label is string {
        if (typeof label !== 'string') {
            throw new TypeError(
                `Button label must be a string, got ${typeof label}. ` +
                `Value: ${JSON.stringify(label)}`
            );
        }
    }

    private validateCallback(callback: unknown): asserts callback is () => void | false | Promise<void | false> {
        if (!callback || typeof callback !== 'function') {
            throw new TypeError(
                `Button callback must be a function, got ${typeof callback}`
            );
        }
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
