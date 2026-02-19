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
    debug?: boolean; // Enable debug console logging
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
    size?: { width?: number | string; height?: number | string }; // Step-specific modal size (object format)
    width?: number | string; // Step-specific modal width (direct property)
    height?: number | string; // Step-specific modal height (direct property)
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
    width?: string;              // Fixed width (e.g., '120px', '120', or '20%')
    minWidth?: string;           // Minimum width, allows stretching (e.g., '100px', '100')
    align?: 'left' | 'center' | 'right';
    format?: 'currency' | 'number' | 'percent' | 'date';  // Auto-format cell values
}

export interface FieldConfig {
    id: string;
    label?: string;
    labelPosition?: 'left' | 'top';
    orientation?: 'horizontal' | 'vertical'; // Field orientation for Fluent UI Field component
    type?: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'switch' | 'lookup' | 'file' | 'addressLookup' | 'table' | 'range' | 'custom' | 'group' | string;
    // Group-specific properties
    border?: boolean;           // Show border with rounded corners (for type: 'group')
    content?: string;           // Description/content text below the title (for type: 'group')
    collapsible?: boolean;      // Make group collapsible (for type: 'group')
    defaultCollapsed?: boolean; // Start collapsed if collapsible (for type: 'group')
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
    isRowSelectable?: (row: any) => boolean;  // Function to determine if a row can be selected
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
    validateAllSteps?: boolean;    // For wizards: defaults to true (validates ALL steps). Set to false to only validate current step.
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

export type QueryBuilderDataType = 'string' | 'number' | 'datetime' | 'boolean' | 'optionset' | 'lookup';

export interface QueryBuilderOption {
    label: string;
    value: string | number;
}

/** Target entity for lookup fields */
export interface QueryBuilderLookupTarget {
    /** Logical name of the target entity (e.g., "contact") */
    entityLogicalName: string;
    /** Entity set name for OData queries (e.g., "contacts") */
    entitySetName?: string;
    /** Display name of the entity (e.g., "Contact") */
    displayName?: string;
    /** Primary name attribute for searching (e.g., "fullname") */
    primaryNameAttribute?: string;
}

export interface QueryBuilderField {
    id: string;
    label: string;
    dataType: QueryBuilderDataType;
    options?: QueryBuilderOption[];
    /** Schema name (PascalCase attribute name, e.g., "CreatedOn") */
    schemaName?: string;
    /** Target entities for lookup fields (which entities can be referenced) */
    targets?: QueryBuilderLookupTarget[];
}

/**
 * FetchXML condition operators.
 * Common operators are explicitly listed for IDE autocomplete.
 * Additional FetchXML operators are supported via the string type.
 */
export type QueryBuilderOperator =
    | 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le'
    | 'null' | 'not-null' | 'notnull'
    | 'contains' | 'not-contain' | 'begins-with' | 'not-begin-with' | 'ends-with' | 'not-end-with'
    | 'like' | 'not-like' | 'notcontains' | 'startswith' | 'endswith' | 'containsdata'
    | 'in' | 'not-in' | 'between' | 'not-between' | 'contain-values' | 'not-contain-values'
    | 'on' | 'on-or-before' | 'on-or-after' | 'not-on'
    | 'today' | 'yesterday' | 'tomorrow'
    | 'this-week' | 'last-week' | 'next-week'
    | 'this-month' | 'last-month' | 'next-month'
    | 'this-year' | 'last-year' | 'next-year'
    | 'last-seven-days' | 'next-seven-days'
    | 'last-x-hours' | 'next-x-hours' | 'last-x-days' | 'next-x-days'
    | 'last-x-weeks' | 'next-x-weeks' | 'last-x-months' | 'next-x-months'
    | 'last-x-years' | 'next-x-years'
    | 'olderthan-x-minutes' | 'olderthan-x-hours' | 'olderthan-x-days'
    | 'olderthan-x-weeks' | 'olderthan-x-months' | 'olderthan-x-years'
    | 'this-fiscal-year' | 'this-fiscal-period' | 'last-fiscal-year' | 'last-fiscal-period'
    | 'next-fiscal-year' | 'next-fiscal-period'
    | 'last-x-fiscal-years' | 'last-x-fiscal-periods' | 'next-x-fiscal-years' | 'next-x-fiscal-periods'
    | 'in-fiscal-year' | 'in-fiscal-period' | 'in-fiscal-period-and-year'
    | 'in-or-before-fiscal-period-and-year' | 'in-or-after-fiscal-period-and-year'
    | 'eq-userid' | 'ne-userid' | 'eq-userteams' | 'eq-useroruserteams'
    | 'eq-useroruserhierarchy' | 'eq-useroruserhierarchyandteams'
    | 'eq-businessid' | 'ne-businessid' | 'eq-userlanguage'
    | 'above' | 'eq-or-above' | 'under' | 'eq-or-under' | 'not-under'
    | (string & {});

export interface QueryBuilderCondition {
    id: string;
    kind?: 'field' | 'relatedEntity';
    fieldId: string;
    operator: QueryBuilderOperator;
    /** Single value or array of values (for in/not-in operators) */
    value?: string | number | boolean | (string | number)[];
    value2?: string | number | boolean;
    /** Display name for lookup values (the GUID is stored in value) */
    valueDisplayName?: string;
    /** Entity alias when condition references a link-entity */
    entityAlias?: string;
    /** The lookup field ID that creates this relationship */
    relatedEntityName?: string;
    /** The target entity logical name */
    relatedEntityTarget?: string;
    /** Alias for the link-entity */
    relatedEntityAlias?: string;
    /** Nested conditions for related entity (link-entity filter) */
    nestedConditions?: QueryBuilderCondition[];
    /** Logic operator for nested conditions */
    nestedLogic?: 'and' | 'or';
    /** Fields available for the related entity (loaded dynamically) */
    nestedFields?: QueryBuilderField[];
}

export interface QueryBuilderGroup {
    id: string;
    logic: 'and' | 'or';
    conditions: QueryBuilderCondition[];
}

export interface QueryBuilderState {
    groups: QueryBuilderGroup[];
}

export interface QueryBuilderApplyResult {
    state: QueryBuilderState;
    fetchXmlFilter: string;
    fetchXml: string;
    odataFilter: string;
    /** Full OData query URL (e.g., "accounts?$filter=...") - requires entitySetName */
    odataQuery?: string;
}

export interface QueryBuilderRelatedEntity {
    /** Unique identifier - typically the lookup field name (e.g., "primarycontactid") */
    id: string;
    /** Display label for the relationship (e.g., "Primary Contact (Contact)") */
    label: string;
    /** The lookup field that creates this relationship */
    lookupField?: string;
    /** The target entity logical name (e.g., "contact") */
    targetEntity?: string;
    /** The target entity set name for OData (e.g., "contacts") */
    targetEntitySetName?: string;
}

export interface QueryBuilderLookupOption {
    /** Unique identifier (typically a GUID) */
    key: string;
    /** Display text */
    text: string;
    /** Optional secondary text */
    secondaryText?: string;
}

export interface QueryBuilderOpenOptions {
    title?: string;
    entityName: string;
    /** Entity set name for OData queries (e.g., "accounts"). If not provided, will be fetched from Xrm metadata. */
    entitySetName?: string;
    entityDisplayName?: string;
    fields?: QueryBuilderField[];
    /** Related entities for filtering. If not provided, will be auto-detected from lookup fields. */
    relatedEntities?: QueryBuilderRelatedEntity[];
    /** Initial query state object */
    initialState?: QueryBuilderState;
    /** Initial FetchXML string - will be parsed to populate the query builder */
    initialFetchXml?: string;
    defaultState?: QueryBuilderState;
    allowGroups?: boolean;
    allowRelatedEntity?: boolean;
    showODataPreview?: boolean;
    showFetchXmlPreview?: boolean;
    showResetToDefaultButton?: boolean;
    showDownloadFetchXmlButton?: boolean;
    showUploadFetchXmlButton?: boolean;
    showDeleteAllFiltersButton?: boolean;
    showValidateButton?: boolean;
    showDataSourceToggle?: boolean;
    liveDataLabel?: string;
    retainedDataLabel?: string;
    changeToRetainedDataLabel?: string;
    changeToLiveDataLabel?: string;
    initialDataSource?: 'live' | 'retained';
    width?: number;
    height?: number;
    applyButtonText?: string;
    cancelButtonText?: string;
    onApply?: (result: QueryBuilderApplyResult) => void | Promise<void>;
    onCancel?: () => void;
    onResetToDefault?: (state: QueryBuilderState) => void;
    onDeleteAllFilters?: () => void;
    onDataSourceChange?: (source: 'live' | 'retained') => void;
    onStateChange?: (state: QueryBuilderState) => void;
    /** Callback for lookup field search - returns options for the lookup dropdown */
    onLookupSearch?: (fieldId: string, searchText: string) => Promise<QueryBuilderLookupOption[]> | QueryBuilderLookupOption[];
}

export interface QueryBuilderOpenResult {
    opened: boolean;
    reason: 'applied' | 'cancelled' | 'closed' | 'error';
    elapsedMs: number;
    result?: QueryBuilderApplyResult;
    error?: string;
}

export interface ModalInstance {
    show(): Promise<void>;
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
