# Directive: D365 CE UI Utilities Library

## Project Overview
Create a TypeScript-based UI utility library for Dynamics 365 CE that bundles into a single JavaScript file for easy deployment. The library provides Toast notifications, Modal dialogs with tabs, and other common UI components with a native D365 CE look and feel.

**Global Namespace**: `err403` (e.g., `err403.Toast`, `err403.Modal`, `err403.Lookup`)

## Technical Stack
- **Language**: TypeScript
- **Build Tool**: Vite (preferred by Microsoft projects)
- **Output**: Single minified JavaScript file for production
- **Global Name**: `err403` (configurable for future changes)
- **Style**: Vanilla JavaScript (no React/framework dependencies)
- **Design System**: Custom implementation inspired by Fluent UI v9 design tokens
- **Browser Support**: Modern browsers (ES6+) + D365 CE compatibility

## Project Structure
```
/src
  /components
    /Toast
      Toast.ts          # Toast notification system
      Toast.types.ts    # TypeScript interfaces
    /Modal
      Modal.ts          # Modal (Dialog) system
      Modal.types.ts    # TypeScript interfaces
    /Logger
      Logger.ts         # err403 logging utility
  /styles
    theme.ts            # Fluent-inspired design tokens
    animations.ts       # Reusable animations
  index.ts              # Main entry point
/demo
  index.html            # Demo page for testing
  demo.ts               # Demo implementations
/dist                   # Build output
vite.config.ts
tsconfig.json
package.json
```

## Component Specifications

### 1. Toast Notification System
**Based on existing vanilla implementation** - Convert to TypeScript

**API Design**:
```typescript
// Object-based API (primary)
err403.Toast.success({
    title: "Account Price Applied",
    message: `Price: $${accountPriceListBest.price} from ${accountPriceListBest.priceListName}`,
    duration: 5000,  // optional, default 6000ms
    sound: true      // optional, play notification sound (default: false)
});

// String-based API (convenience)
err403.Toast.error("Error Title", "Error message", 4000, true);  // with sound

// Types: default, success, warn, error, info
// Features:
// - Auto-dismiss with configurable duration
// - Manual dismiss via click or close button
// - Stacking (newest at bottom)
// - Parent window support (works in D365 iframes)
// - SVG icons matching type
// - Backdrop blur effect
// - Smooth slide-in/out animations
// - Optional notification sound for success/error types
```

**Configuration**:
- Position: top-right (fixed)
- Duration: 6000ms default
- Colors: Match existing implementation (semi-transparent backgrounds)
- Icons: Inline SVG (success=checkmark, error=X, warn=!, info=i)
- Sound: Optional notification sound for success/error toasts (subtle, non-intrusive)

### 2. Modal System
**New component** - Build from scratch, inspired by Magnetism Solutions Dialog Builder API

**API Design** (based on Dialog Builder pattern):
```typescript
// Simple alert
err403.Modal.alert({
    title: "Attention",
    message: "This action cannot be undone."
});

// Confirm dialog
err403.Modal.confirm({
    title: "Delete Record?",
    message: "Are you sure you want to delete this record?",
    onConfirm: () => { /* delete logic */ },
    onCancel: () => { /* cancel logic */ }
});

// Custom modal with fields and tabs
const options = {
    id: 'bestPricing',
    title: 'Best Pricing Options',
    message: 'Select the best pricing option',  // Sub-heading text
    content: tableHtml,        // Supports HTML content (main content area)
    icon: 'INFO',              // Optional: INFO, WARNING, ERROR, SUCCESS, QUESTION
    width: 900,                // Optional, default 500 (can also use 'size' preset)
    height: 500,               // Optional, default 250 (can also use 'size' preset)
    size: 'large',             // NEW: Optional size preset ('small' | 'medium' | 'large' | 'fullscreen')
    padding: 25,               // Optional, default 20
    preventClose: false,       // Optional: hide X button
    allowDismiss: false,       // Optional: allow click outside to close
    allowEscapeClose: true,    // NEW: Allow ESC key to close (default: true)
    draggable: true,           // NEW: Enable drag by header (default: false)
    buttonAlignment: 'right',  // NEW: Footer button alignment ('left' | 'center' | 'right' | 'space-between')
    autoSave: true,            // NEW: Auto-save to localStorage (default: false)
    autoSaveKey: 'bestPricing-form',  // NEW: localStorage key for auto-save (defaults to modal id)
    
    // NEW: Progress Indicator for multi-step/page modals
    progress: {
        enabled: true,
        type: 'bar',           // 'bar' | 'steps-left' | 'steps-right' | 'step'
        position: 'top',       // For 'bar': 'top' | 'bottom'. For steps: 'left' | 'right'
        currentStep: 2,        // Current step (1-based)
        totalSteps: 4,         // Total number of steps
        steps: [               // Optional: step labels for column display
            { label: 'Basic Info', completed: true },
            { label: 'Pricing', completed: false, active: true },
            { label: 'Details', completed: false },
            { label: 'Review', completed: false }
        ]
    },
    
    // NEW: Side Cart/Panel for creative content
    sideCart: {
        enabled: true,
        position: 'left',      // 'left' | 'right'
        width: 300,            // Width in pixels (default: 300)
        content: '<div class="custom-content">...</div>',  // HTML content
        // OR
        imageUrl: 'https://example.com/image.jpg',  // Cover image
        backgroundColor: '#f5f5f5',  // Optional background color
        className: 'custom-side-cart'  // Optional custom CSS class
    },
    
    fields: [
        // Enhanced Group with Tab support
        new err403.Modal.Group({
            id: 'mainGroup',
            label: 'Options',
            asTabs: true,  // NEW: Render as tab interface
            fields: [
                new err403.Modal.Group({
                    id: 'tab1',
                    label: 'Pricing Details',  // Tab label
                    fields: [
                        new err403.Modal.Input({ id: 'price', label: 'Price', type: 'number' }),
                        new err403.Modal.Input({ id: 'discount', label: 'Discount %', type: 'number' })
                    ]
                }),
                new err403.Modal.Group({
                    id: 'tab2',
                    label: 'Additional Info',  // Tab label
                    fields: [
                        new err403.Modal.MultiLine({ id: 'notes', label: 'Notes' })
                    ]
                })
            ]
        })
    ],
    buttons: [
        new err403.Modal.Button('Cancel', () => { /* handler */ }),
        new err403.Modal.Button('Select Best Price', () => { /* handler */ }, true),  // isPrimary (setFocus)
        new err403.Modal.Button('Apply Selected', () => { /* handler */ }, false, true)  // preventClose = true
    ]
};

new err403.Modal(options).show();

// Async pattern
const response = await new err403.Modal(options).showAsync();
if (response.button.label === "Apply Selected") {
    const data = response.data;  // Field values
    console.log(data.price, data.discount, data.notes);
}
```

**Features**:
- Overlay with backdrop blur
- Keyboard support (ESC to close, Enter for primary action)
- Focus trap (accessibility)
- Prevent body scroll when open
- Multiple button support with primary/secondary styling
- Custom HTML content support (separate `message` for sub-heading, `content` for main HTML)
- Optional icon header (INFO, WARNING, ERROR, SUCCESS, QUESTION)
- **Progress Indicators for Multi-Step Modals** (NEW ENHANCEMENT):
  - **Progress Bar Mode**: Percentage-based bar at top or bottom
  - **Step Column Mode**: Vertical step indicator in left or right sidebar
  - **Step Type Mode**: Advanced wizard with validation and required field checking
  - Step labels with completed/active/pending states
  - Visual indicators (checkmarks, numbers, etc.)
  - Programmatic updates via `.updateProgress()` method
- **Side Cart/Panel** (NEW ENHANCEMENT):
  - Visual panel on left or right side of modal
  - HTML content or cover image support
  - Customizable width and styling
  - Perfect for branding, instructions, or visual appeal
- **Field Groups with Tab Support** (NEW ENHANCEMENT):
  - `Modal.Group` with `asTabs: true` option
  - Renders nested groups as tabbed interface
  - Tab navigation with keyboard support
  - Visual tab styling matching D365 CE
- Configurable dimensions (width, height, padding)
- Center positioning with draggable support (optional)
- Smooth fade-in/scale animation
- Parent window support (works in D365 iframes)
- `preventClose` option to hide X button
- `allowDismiss` option to close on outside click
- Chainable API pattern (method chaining)
- **Async/await support** with `showAsync()` method

**Modal Button Class**:
```typescript
class ModalButton {
    constructor(
        label: string,
        callback: () => void | false,  // Return false to prevent modal close
        setFocus: boolean = false,     // Primary button (blue) with focus
        preventClose: boolean = false, // Keep modal open after button click
        isDestructive: boolean = false // NEW: Auto-add confirmation (type name to confirm)
    )
}

// Example: Destructive action with confirmation
new err403.Modal.Button("Delete Account", async () => {
    // This will auto-show "Type 'Account Name' to confirm" input
    // Only executes if user types the correct name
    await Xrm.WebApi.deleteRecord("account", accountId);
    modal.close();
}, false, false, true)  // isDestructive = true
```

**Helper Methods**:
- `.show()` - Display the modal
- `.close()` - Close and remove modal from DOM
- `.setLoading(isLoading: boolean, message?: string)` - **NEW**: Show/hide spinner overlay with optional message
- `.updateProgress(currentStep, completed?)` - Update progress indicator state
- `.nextStep()` - Move to next step (validates current step if using 'step' type)
- `.previousStep()` - Move to previous step
- `.goToStep(stepId)` - Navigate to specific step by ID
- `.getFieldValue(fieldId)` - Get current value of a field
- `.getFieldValues()` - Get all field values as object
- `.validateCurrentStep()` - Manually validate current step and return boolean
- `.validateAllFields()` - **NEW**: Validate all fields and return boolean
- `.updateSideCart(content | imageUrl)` - Dynamically update side cart content
- `.clearAutoSave()` - **NEW**: Clear localStorage auto-save data
- `.getElement(querySelector?)` - Get modal HTML element(s) for custom manipulation
- Chainable property setters: `.title()`, `.message()`, `.content()`, `.width()`, `.height()`, etc.

### 3. Logger Utility
**Based on existing implementation** - Convert to TypeScript

```typescript
// Preserve existing BUG, WAR, ERR pattern
console.debug(...BUG, "your message", data);
console.warn(...WAR, "warning message");
console.error(...ERR, "error message", errorObj);

// Export as named constants for library consumers
export const BUG, WAR, ERR;
```

## Design System (Fluent-inspired)

### Color Tokens
```typescript
const theme = {
    colors: {
        toast: {
            success: { bg: 'rgba(76, 175, 80, 0.85)', border: 'rgba(76, 175, 80, 1)' },
            error: { bg: 'rgba(211, 47, 47, 0.85)', border: 'rgba(211, 47, 47, 1)' },
            warn: { bg: 'rgba(255, 152, 0, 0.85)', border: 'rgba(255, 152, 0, 1)' },
            info: { bg: 'rgba(9, 108, 200, 0.85)', border: 'rgba(9, 108, 200, 1)' },
            default: { bg: 'rgba(79, 195, 247, 0.85)', border: 'rgba(79, 195, 247, 1)' }
        },
        modal: {
            overlay: 'rgba(0, 0, 0, 0.5)',
            background: '#ffffff',
            text: '#323130',
            border: '#e1dfdd',
            primary: '#0078d4',      // D365 blue
            primaryHover: '#106ebe',
            secondary: '#f3f2f1',
            secondaryHover: '#e1dfdd',
            tab: {
                active: '#0078d4',
                inactive: '#605e5c',
                hover: '#323130',
                border: '#edebe9'
            },
            progress: {
                bar: '#0078d4',
                barBackground: '#e1dfdd',
                stepActive: '#0078d4',
                stepCompleted: '#107c10',   // Green
                stepPending: '#8a8886',
                stepText: '#323130'
            }
        }
    },
    shadows: {
        toast: '0 4px 16px rgba(0, 0, 0, 0.2)',
        modal: '0 6.4px 14.4px rgba(0, 0, 0, 0.132), 0 1.2px 3.6px rgba(0, 0, 0, 0.108)'
    },
    borderRadius: {
        small: '4px',
        medium: '8px',
        large: '12px'
    },
    typography: {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: {
            small: '13px',
            medium: '14px',
            large: '16px'
        }
    }
};
```

## Build Configuration

### Vite Config Requirements
- **Output**: Single IIFE bundle (for global namespace)
- **Minification**: Terser for production
- **Source maps**: Generate for debugging
- **Library mode**: UMD format
- **Global name**: `err403` (configurable)
- **External dependencies**: None (fully self-contained)

### TypeScript Config Requirements
- **Target**: ES2015 (ES6)
- **Module**: ESNext
- **Strict mode**: Enabled
- **Declaration files**: Generate .d.ts for IntelliSense
- **Source maps**: Generate

## Development Requirements

### Demo Page
Create `demo/index.html` with:
- All Toast variants (success, error, warn, info, default)
- All Modal types (alert, confirm, custom)
- Modal with tabs demonstration
- Modal with progress indicators (all four types: bar, steps-left, steps-right, step)
- Modal with side cart (both HTML content and image examples)
- Multi-step wizard example with progress tracking
- Advanced step-type wizard with validation
- Branded modal with side cart image
- Modal with various field types
- Interactive buttons to trigger each component
- Code examples showing usage
- D365-like styling for demo page itself

### IntelliSense Support
- Export all public interfaces and types
- Generate declaration files (.d.ts)
- Include JSDoc comments for all public APIs
- Example:
```typescript
/**
 * Show a success toast notification
 * @param options - Toast configuration options
 * @param options.title - Toast title
 * @param options.message - Toast message
 * @param options.duration - Duration in milliseconds (default: 6000)
 */
success(options: ToastOptions): void;
```

## Usage Examples

### In D365 CE Web Resource
```typescript
// Load the library as a web resource
// Then use globally available components:

err403.Toast.success({
    title: "Account Saved",
    message: "The account has been updated successfully."
});

err403.Modal.confirm({
    title: "Confirm Deletion",
    message: "Delete this opportunity?",
    onConfirm: () => {
        Xrm.WebApi.deleteRecord("opportunity", opportunityId);
    }
});

// Using tabs in a modal
const modal = new err403.Modal({
    title: "Configure Settings",
    fields: [
        new err403.Modal.Group({
            id: 'settings',
            asTabs: true,  // Render as tabs
            fields: [
                new err403.Modal.Group({ id: 'general', label: 'General', fields: [...] }),
                new err403.Modal.Group({ id: 'advanced', label: 'Advanced', fields: [...] })
            ]
        })
    ],
    buttons: [new err403.Modal.Button("Save", async () => {
        const response = await modal.getPromptResponses();
        // Process response
    })]
});

modal.show();

// Multi-step modal with progress indicator
const wizardModal = new err403.Modal({
    title: "New Account Wizard",
    width: 700,
    height: 500,
    progress: {
        enabled: true,
        type: 'steps-left',     // Vertical steps on left side
        position: 'left',
        currentStep: 1,
        totalSteps: 3,
        steps: [
            { label: 'Basic Information', completed: false, active: true },
            { label: 'Contact Details', completed: false },
            { label: 'Review & Submit', completed: false }
        ]
    },
    fields: [/* step 1 fields */],
    buttons: [
        new err403.Modal.Button("Next", () => {
            wizardModal.updateProgress(2);  // Move to step 2
            // Update fields for step 2
        }, true)
    ]
});

wizardModal.show();

// Advanced wizard with step type and validation
const advancedWizard = new err403.Modal({
    title: "Account Creation Wizard",
    width: 800,
    height: 600,
    progress: {
        enabled: true,
        type: 'step',
        currentStep: 1,
        steps: [
            {
                id: 'account-info',
                name: 'Account Information',
                description: 'Enter the account name and type',
                order: 1,
                required: true,
                fields: [
                    new err403.Modal.Input({ id: 'accountName', label: 'Account Name', required: true }),
                    new err403.Modal.OptionSet({ id: 'accountType', label: 'Account Type', required: true, options: [...] })
                ]
            },
            {
                id: 'contact-info',
                name: 'Primary Contact',
                description: 'Assign a primary contact',
                order: 2,
                required: false,
                fields: [
                    new err403.Modal.Lookup({ id: 'primaryContact', label: 'Primary Contact', entityTypes: ['contact'] })
                ]
            },
            {
                id: 'review',
                name: 'Review',
                description: 'Review and confirm',
                order: 3,
                required: true,
                fields: []
            }
        ]
    },
    buttons: [
        new err403.Modal.Button("Previous", () => advancedWizard.previousStep()),
        new err403.Modal.Button("Next", () => {
            if (advancedWizard.validateCurrentStep()) {
                advancedWizard.nextStep();
            }
        }, true)
    ]
});

advancedWizard.show();

// Modal with side cart (creative visual panel)
const brandedModal = new err403.Modal({
    title: "Create New Product",
    width: 900,
    height: 600,
    sideCart: {
        enabled: true,
        position: 'right',
        width: 350,
        imageUrl: 'https://example.com/products/hero-image.jpg'
    },
    fields: [
        new err403.Modal.Input({ id: 'productName', label: 'Product Name', required: true }),
        new err403.Modal.Input({ id: 'sku', label: 'SKU', required: true }),
        new err403.Modal.OptionSet({ 
            id: 'category', 
            label: 'Category', 
            options: ['Electronics', 'Clothing', 'Home'] 
        })
    ],
    buttons: [
        new err403.Modal.Button("Cancel", () => brandedModal.close()),
        new err403.Modal.Button("Create", async () => {
            const data = await brandedModal.getFieldValues();
            // Create product
            brandedModal.close();
        }, true)
    ]
});

brandedModal.show();

// Side cart with HTML instructions
const helpModal = new err403.Modal({
    title: "Import Data Wizard",
    width: 800,
    height: 500,
    sideCart: {
        enabled: true,
        position: 'left',
        width: 280,
        content: `
            <div style="padding: 24px; color: #323130;">
                <h3 style="margin-top: 0; color: #0078d4;">Need Help?</h3>
                <p>Follow these steps:</p>
                <ol style="padding-left: 20px;">
                    <li>Upload your CSV file</li>
                    <li>Map the columns</li>
                    <li>Review and import</li>
                </ol>
                <a href="#" style="color: #0078d4;">View Documentation</a>
            </div>
        `,
        backgroundColor: '#faf9f8'
    },
    fields: [/* import fields */],
    buttons: [/* import buttons */]
});

helpModal.show();
```

## Additional Features (Inspired by Dialog Builder)

### Modal Advanced Features
- **Async Pattern**: `showAsync()` method returns Promise with button and field data
  ```typescript
  const { button, data } = await modal.showAsync();
  if (button.label === "OK") {
      console.log(data.fieldId);
  }
  ```
- **Element Access**: `.getElement(querySelector)` for DOM manipulation
- **Method Chaining**: All methods return the Modal instance for chaining
- **Dynamic Updates**: Update modal properties after showing (e.g., `.title("New Title")`)

### Tab Enhancement (NEW)
- **Modal.Group with `asTabs` option**:
  - When `asTabs: true`, renders nested groups as tab interface
  - Tab headers generated from nested group `label` properties
  - Active tab state management
  - Keyboard navigation (Arrow keys, Home, End)
  - Accessible (ARIA roles: tablist, tab, tabpanel)
  - Visual styling matching D365 CE tabs
  - Tab switching animation

### Side Cart/Panel Enhancement (NEW)
- **Creative Visual Panel**:
  - Position: `left` or `right` side of modal
  - Configurable width (default: 300px)
  - Two content modes:
    1. **HTML Content**: Supply custom HTML for branding, instructions, help text, etc.
    2. **Cover Image**: Supply image URL to fill the panel
  - Optional background color
  - Optional custom CSS class for advanced styling
  - Responsive: automatically adjusts modal layout
  - Use cases:
    - Brand imagery or promotional content
    - Step-by-step visual guides
    - Contextual help or documentation
    - Product images for forms
    - Creative visual flair to enhance UX

- **API Example**:
  ```typescript
  // Side cart with HTML content (left side)
  sideCart: {
      enabled: true,
      position: 'left',
      width: 280,
      content: `
          <div style="padding: 20px; color: #323130;">
              <h3>Welcome!</h3>
              <p>Complete this form to create a new account.</p>
              <ul>
                  <li>Enter required fields</li>
                  <li>Review your information</li>
                  <li>Click Create</li>
              </ul>
          </div>
      `,
      backgroundColor: '#f3f2f1'
  }
  
  // Side cart with cover image (right side)
  sideCart: {
      enabled: true,
      position: 'right',
      width: 350,
      imageUrl: 'https://example.com/brand-image.jpg',
      className: 'branded-side-cart'
  }
  ```

### Progress Indicator Enhancement (NEW)
- **Four Display Modes**:
  1. **Progress Bar** (`type: 'bar'`):
     - Horizontal percentage bar
     - Position: `top` or `bottom`
     - Smooth animated transitions
     - Shows percentage or step count
  
  2. **Step Column - Left** (`type: 'steps-left'`):
     - Vertical step list on left side
     - Step labels with icons
     - Visual states: completed (✓), active (current), pending
     - Connects steps with vertical line
  
  3. **Step Column - Right** (`type: 'steps-right'`):
     - Same as left, but positioned on right side
     - Useful for RTL layouts or design preference
  
  4. **Step Type** (`type: 'step'`) - **NEW ENHANCEMENT**:
     - Advanced step-based wizard with full metadata
     - Each step is a complete configuration object
     - Step validation with required field checking
     - Navigation control (can only proceed when step is valid)
     - Full step object structure:
       ```typescript
       {
           id: string,              // Unique step identifier
           name: string,            // Step display name
           description: string,     // Step description/help text
           order: number,           // Step order/sequence
           required: boolean,       // Is this step required?
           fields: Field[],         // Fields for this step
           canContinue?: boolean,   // Can user proceed? (computed from required fields)
           validate?: () => boolean // Custom validation function
       }
       ```

- **Progress Features**:
  - Step states: `completed`, `active`, `pending`
  - Step icons: checkmark for completed, number/dot for active/pending
  - Programmatic updates: `.updateProgress(stepNumber)`
  - Optional step labels and descriptions
  - Click-to-navigate (if `allowStepNavigation: true`)
  - **Required field validation** (for 'step' type)
  - **Automatic canContinue calculation** based on required fields
  - Accessible (ARIA labels for screen readers)

- **API Example**:
  ```typescript
  // Progress bar at top
  progress: {
      enabled: true,
      type: 'bar',
      position: 'top',
      currentStep: 2,
      totalSteps: 5
  }
  
  // Step column on left
  progress: {
      enabled: true,
      type: 'steps-left',
      position: 'left',
      currentStep: 1,
      totalSteps: 3,
      steps: [
          { label: 'Account Info', completed: false, active: true },
          { label: 'Contacts', completed: false },
          { label: 'Review', completed: false }
      ],
      allowStepNavigation: true  // Allow clicking steps to navigate
  }
  
  // Advanced Step Type with validation
  progress: {
      enabled: true,
      type: 'step',
      currentStep: 1,
      steps: [
          {
              id: 'basic-info',
              name: 'Basic Information',
              description: 'Enter the account basic details',
              order: 1,
              required: true,
              fields: [
                  new err403.Modal.Input({ id: 'name', label: 'Name', required: true }),
                  new err403.Modal.Input({ id: 'email', label: 'Email', required: true })
              ],
              validate: () => {
                  // Custom validation logic
                  const name = modal.getFieldValue('name');
                  const email = modal.getFieldValue('email');
                  return name && email && email.includes('@');
              }
          },
          {
              id: 'contact-details',
              name: 'Contact Details',
              description: 'Additional contact information',
              order: 2,
              required: false,
              fields: [
                  new err403.Modal.Input({ id: 'phone', label: 'Phone' }),
                  new err403.Modal.Input({ id: 'address', label: 'Address' })
              ]
          },
          {
              id: 'review',
              name: 'Review',
              description: 'Review your information before submitting',
              order: 3,
              required: true,
              fields: []
          }
      ]
  }
  
  // The modal automatically:
  // - Disables "Next" button if current step's required fields are empty
  // - Runs validate() function if provided
  // - Updates canContinue property for each step
  // - Shows validation messages for required fields
  ```

### Field Support 
- **Modal.Input**: Creates an `<input>` element for various input types
  - **Supported types**: text, number, date, datetime-local, checkbox, radio, file, range, **toggle** (NEW)
  - **Options object** (recommended):
    - `id`: string (recommended) - Unique identifier for the field, used when getting prompt responses
    - `label`: string (recommended) - Label text above or beside the field (checkbox, radio, and toggle have label to the right)
    - `inline`: boolean (optional) - Label aligned above (false) or beside (true) the field. Defaults to true
    - `divider`: boolean (optional) - Shows vertical line at bottom for field separation. Defaults to false
    - `value`: any (optional) - Default value (type depends on input type: Number for 'number', Date for 'date'/'datetime-local', String for 'text', Boolean for 'checkbox'/'radio'/'toggle')
    - `type`: string (optional) - HTML input type. Defaults to 'text' if not specified
      - `text` - Standard text input
      - `number` - Numeric input (use `extraAttributes` for min/max)
      - `date` - Date picker (no picker in IE)
      - `datetime-local` - DateTime picker (no picker in IE, Firefox/Safari web)
      - `radio` - Radio button (use `extraAttributes` for 'name')
      - `checkbox` - Checkbox
      - `file` - File upload (use `extraAttributes` for 'multiple')
      - `range` - Slider control
      - **`toggle`** (NEW) - D365-style toggle switch (like Fluent UI Switch component)
    - `required`: boolean (optional) - Mark field as required, shows validation
    - `disabled`: boolean (optional) - Disable the input
    - `placeholder`: string (optional) - Placeholder text for text inputs
    - `validation`: object (optional) - **NEW**: Custom validation rules
      - `rules`: ValidationRule[] - Array of validation rules
      - `validateOn`: 'blur' | 'change' | 'submit' - When to validate (default: 'blur')
      - `showErrors`: boolean - Show inline error messages (default: true)
    - `extraAttributes`: object (optional) - Additional HTML attributes (e.g., `{ min: 0, max: 100, step: 5 }` for number/range)
  
  - **Validation Rules** (NEW):
    ```typescript
    validation: {
        rules: [
            { type: 'required', message: 'This field is required' },
            { type: 'email', message: 'Invalid email format' },
            { type: 'minLength', value: 3, message: 'Minimum 3 characters' },
            { type: 'maxLength', value: 50, message: 'Maximum 50 characters' },
            { type: 'pattern', value: /^[A-Z0-9]+$/, message: 'Only uppercase letters and numbers' },
            { type: 'custom', validate: (value) => value > 0, message: 'Must be positive' }
        ],
        validateOn: 'blur',  // or 'change' or 'submit'
        showErrors: true
    }
    ```
  
  - **Examples**:
    ```typescript
    // Text input
    new err403.Modal.Input({
        id: 'accountName',
        label: 'Account Name',
        type: 'text',
        placeholder: 'Enter account name',
        required: true
    })
    
    // Number with min/max
    new err403.Modal.Input({
        id: 'age',
        label: 'Age',
        type: 'number',
        value: 25,
        extraAttributes: { min: 0, max: 120 }
    })
    
    // Date picker
    new err403.Modal.Input({
        id: 'startDate',
        label: 'Start Date',
        type: 'date',
        value: new Date()
    })
    
    // Checkbox
    new err403.Modal.Input({
        id: 'acceptTerms',
        label: 'I accept the terms and conditions',
        type: 'checkbox',
        value: false
    })
    
    // Toggle (NEW)
    new err403.Modal.Input({
        id: 'enableNotifications',
        label: 'Enable Notifications',
        type: 'toggle',
        value: true,
        inline: false  // Label above toggle
    })
    
    // Range slider
    new err403.Modal.Input({
        id: 'priority',
        label: 'Priority Level',
        type: 'range',
        value: 5,
        extraAttributes: { min: 1, max: 10, step: 1 },
        showValue: true  // NEW: Display current value next to slider
    })
    
    // With validation
    new err403.Modal.Input({
        id: 'email',
        label: 'Email Address',
        type: 'text',
        required: true,
        validation: {
            rules: [
                { type: 'required', message: 'Email is required' },
                { type: 'email', message: 'Invalid email format' }
            ],
            validateOn: 'blur'
        }
    })
    ```

- **Modal.DateRange**: Select start and end dates (NEW)
    ```typescript
    new err403.Modal.DateRange({
        id: 'reportPeriod',
        label: 'Report Period',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),  // 30 days from now
        required: true,
        minDate: new Date('2020-01-01'),  // Optional: minimum selectable date
        maxDate: new Date('2030-12-31')   // Optional: maximum selectable date
    })
    ```

- **Modal.MultiLine**: textarea for multi-line text
    ```typescript
    new err403.Modal.MultiLine({
        id: 'notes',
        label: 'Notes',
        rows: 5,
        placeholder: 'Enter notes here...',
        required: false
    })
    ```

- **Modal.OptionSet**: dropdown/multi-select with options
    ```typescript
    new err403.Modal.OptionSet({
        id: 'status',
        label: 'Status',
        options: ['Open', 'In Progress', 'Closed'],
        // OR with value/label pairs
        options: [
            { value: 1, label: 'Open' },
            { value: 2, label: 'In Progress' },
            { value: 3, label: 'Closed' }
        ],
        multiSelect: false,  // Single select (dropdown)
        required: true
    })
    ```

- **Modal.Lookup**: D365 entity lookup with two display modes:
  - **Dropdown mode** (default): Compact dropdown selector with search/filter
    - Uses `Xrm.WebApi.retrieveMultipleRecords()` to fetch entity records
    - Supports lazy loading (loads on dropdown open)
    - Custom FetchXML queries via `fetchXml` option
    - Pagination support (default: 50 records per page)
    - Search/filter as user types
    ```typescript
    new err403.Modal.Lookup({
        id: 'account',
        label: 'Account',
        entityTypes: ['account'],
        mode: 'dropdown',  // or omit, dropdown is default
        fetchXml: '<fetch>...</fetch>',  // Optional custom query
        pageSize: 50,  // Optional, default 50
        searchFields: ['name', 'accountnumber']  // Fields to search in
    })
    ```
  - **Side panel mode**: Opens D365-style side panel for lookup selection
    - Full D365 lookup experience
    - View selection, filtering, sorting
    ```typescript
    new err403.Modal.Lookup({
        id: 'account',
        label: 'Account',
        entityTypes: ['account'],
        mode: 'dropdown'  // or omit, dropdown is default
    })
    ```
  - **Side panel mode**: Opens D365-style side panel for lookup selection
    ```typescript
    new err403.Modal.Lookup({
        id: 'contact',
        label: 'Contact',
        entityTypes: ['contact'],
        mode: 'sidepanel',  // Opens side panel
        allowMultiSelect: true
    })
    ```
  - Both modes support:
    - Single or multi-select (`allowMultiSelect`)
    - Custom filters (`filters`)
    - View selection (`viewIds`)
    - Callback on selection (`callback`)
    - MRU (Most Recently Used) items (`disableMru`)
- **Modal.Custom**: custom HTML elements
- **Modal.Group**: field grouping, optionally as tabs

### 3. Lookup Component
**New standalone component** - Advanced entity record lookup using Modal

**Purpose**: Dedicated lookup tool for searching and selecting D365 entity records with table display

**API Design**:
```typescript
// Basic lookup with single entity
err403.Lookup.open({
    entity: 'account',
    columns: ['name', 'accountnumber', 'telephone1', 'address1_city'],
    onSelect: (records) => {
        console.log('Selected:', records);
    }
});

// Multi-entity lookup with custom filters
err403.Lookup.open({
    entities: ['account', 'contact'],  // Multiple entity types
    filters: `<filter type="and">
        <condition attribute="statecode" operator="eq" value="0" />
        <condition attribute="name" operator="like" value="%Active%" />
    </filter>`,
    columns: ['name', 'emailaddress1', 'telephone1'],
    columnLabels: {
        name: 'Full Name',           // Override default label
        emailaddress1: 'Email',
        telephone1: 'Phone'
    },
    multiSelect: true,                // Allow multiple selections
    pageSize: 25,                     // Records per page (default: 50)
    onSelect: (records) => {
        // records is an array of selected EntityReferences
        records.forEach(r => {
            console.log(`${r.name} (${r.id})`);
        });
    }
});

// Advanced configuration
err403.Lookup.open({
    entity: 'contact',
    columns: ['fullname', 'emailaddress1', 'parentcustomerid', 'createdon'],
    columnLabels: {
        parentcustomerid: 'Company'   // Override only specific labels
    },
    filters: `<filter type="and">
        <condition attribute="statecode" operator="eq" value="0" />
    </filter>`,
    orderBy: [
        { attribute: 'fullname', descending: false }
    ],
    multiSelect: false,
    searchFields: ['fullname', 'emailaddress1', 'telephone1'],
    defaultSearchTerm: '',            // Pre-populate search
    title: 'Select Contact',          // Custom modal title
    width: 900,                       // Custom modal width
    height: 600,                      // Custom modal height
    pageSize: 50,
    showPagination: true,
    allowClear: true,                 // Show "Clear Selection" button
    onSelect: (records) => { },
    onCancel: () => { }
});
```

**Features**:
- **Search Bar**: Real-time search across specified fields
  - Debounced search (300ms delay)
  - Search across multiple fields simultaneously
  - Clear search button
  - Search status indicator (e.g., "23 results found")

- **Table Display**: 
  - Sortable columns (click header to sort)
  - Column headers with proper labels:
    - Automatically fetched from D365 entity metadata (`EntityMetadata.Attributes[].DisplayName`)
    - User can override with `columnLabels` parameter
  - Responsive column widths
  - Row selection (single or multi-select)
  - Alternating row colors for readability
  - Hover effects on rows
  - Selected rows highlighted with primary color
  - Checkbox column for multi-select mode

- **Data Fetching**:
  - Uses `Xrm.WebApi.retrieveMultipleRecords()` for entity queries
  - FetchXML support for custom filters
  - Pagination controls (Previous/Next buttons)
  - Page number indicator (e.g., "Page 2 of 5")
  - Configurable page size (default: 50 records)
  - Loading spinner during data fetch
  - Error handling with user-friendly messages

- **Column Label Resolution**:
  - Automatically retrieves display names using `Xrm.Utility.getEntityMetadata()`
  - Caches metadata for performance
  - Falls back to attribute logical name if metadata unavailable
  - User-provided labels via `columnLabels` take priority

- **UI Components**:
  - Utilizes Modal component for dialog display
  - Search bar at top
  - Table in center (scrollable if needed)
  - Pagination controls at bottom
  - Action buttons: "Select", "Cancel", optionally "Clear"
  - Loading overlay during API calls

- **Return Value**:
  ```typescript
  interface LookupResult {
      id: string;           // GUID
      name: string;         // Primary name field value
      entityType: string;   // Logical name of entity
      attributes: Record<string, any>;  // All fetched attributes
  }
  ```

**Configuration Options**:
```typescript
interface LookupOptions {
    entity?: string;                  // Single entity (use entity OR entities)
    entities?: string[];              // Multiple entities (mutually exclusive with entity)
    columns: string[];                // Attribute logical names to display
    columnLabels?: Record<string, string>;  // Override auto-fetched labels
    filters?: string;                 // FetchXML filter conditions
    orderBy?: Array<{
        attribute: string;
        descending?: boolean;
    }>;
    multiSelect?: boolean;            // Allow multiple selections (default: false)
    searchFields?: string[];          // Fields to search (defaults to all columns)
    defaultSearchTerm?: string;       // Pre-populate search box
    title?: string;                   // Modal title (default: "Select {Entity}")
    width?: number;                   // Modal width in pixels
    height?: number;                  // Modal height in pixels
    pageSize?: number;                // Records per page (default: 50)
    showPagination?: boolean;         // Show pagination controls (default: true)
    allowClear?: boolean;             // Show "Clear Selection" button (default: false)
    onSelect: (records: LookupResult[]) => void;   // Callback with selected records
    onCancel?: () => void;            // Optional cancel callback
}
```

**Implementation Notes**:
- Built on top of Modal component
- Table rendering using native HTML `<table>` with custom styling
- Metadata caching to minimize API calls
- Handles lookup fields specially (displays name instead of GUID)
- DateTime formatting for date fields
- OptionSet/Picklist value label resolution
- Entity reference resolution for lookup columns

**Visual Design**:
- Search bar: Full-width input with search icon, clear button
- Table: Clean D365-style table with alternating row colors
- Headers: Bold, sortable (clickable with sort indicators ▲▼)
- Rows: Hover effect, selected rows highlighted
- Pagination: Centered controls with page info
- Loading: Semi-transparent overlay with spinner
- Empty state: Friendly message when no results

---

## Non-Functional Requirements
- **File Size**: Target < 50KB minified (vanilla JS, no dependencies)
- **Performance**: Smooth 60fps animations
- **Accessibility**: ARIA labels, keyboard navigation, focus management, tab support
- **Compatibility**: D365 CE Online (2016+), works in iframes
- **Parent Window Support**: Components render in top-most window when in iframes
- **Z-index Management**: Toast at 999999, Modal at 999998, Lookup at 999997
- **No Conflicts**: Avoid polluting global namespace beyond `err403` export

## Deliverables
1. TypeScript source code with full type safety
2. Vite build configuration
3. Minified production bundle (`ui-lib.min.js`)
4. Type declaration file (`ui-lib.d.ts`)
5. Demo page with all components (Toast, Modal with tabs, Lookup with table, all field types)
6. README with usage instructions and API documentation

---

## 📋 PROJECT STATUS & TODO CHECKLIST

### ✅ **COMPLETED**

#### Infrastructure & Build System
- [x] TypeScript project setup with proper tsconfig
- [x] Vite build configuration (IIFE bundle, UMD format)
- [x] Global namespace `err403` configured
- [x] Source map generation
- [x] Minified production build working (~833 KB)
- [x] Demo page infrastructure (`demo/index.html`)
- [x] Modular FluentUI component structure (22 separate files)
- [x] Clean re-export pattern via index.ts
- [x] TypeScript cache management (build clean process)

#### Modal Component (Partially Complete)
- [x] Basic Modal class structure with vanilla JS API
- [x] Modal with title, message, content support
- [x] Modal buttons with primary/secondary styling
- [x] Modal overlay with backdrop blur
- [x] Configurable width, height, padding
- [x] ESC key to close functionality
- [x] Focus management
- [x] Parent window support (D365 iframe compatibility)
- [x] **Tabs integration** - Using Fluent UI v9 TabList (actual React component)
  - [x] `Modal.Group` with `asTabs: true` option
  - [x] React TabList replaces vanilla implementation (~170 lines removed)
  - [x] Tab navigation with keyboard support
  - [x] Active tab state management via React useState
- [x] **Tooltips integration** - Using Fluent UI v9 Tooltip (actual React component)
  - [x] Tooltip support on all fields
  - [x] `withArrow` prop for arrow pointer
  - [x] React Tooltip replaces vanilla implementation (~70 lines removed)
- [x] **Hybrid Architecture Pattern**
  - [x] React for Fluent UI widgets (TabList, Tooltip)
  - [x] Vanilla DOM for form structure
  - [x] Helper functions: `mountFluentComponent`, `createFluentProvider`, `unmountFluentComponent`
  - [x] React state bridges to vanilla DOM mutations
  - [x] One-way data flow: React state → vanilla DOM updates

#### Toast Component
- [x] Basic Toast notification system (vanilla implementation exists)
- [x] Toast variants: success, error, warn, info, default
- [x] Auto-dismiss with configurable duration
- [x] Manual dismiss functionality
- [x] Stacking (newest at bottom)
- [x] SVG icons for each type
- [x] Backdrop blur effect
- [x] Smooth slide animations

#### Development Environment
- [x] Demo page with examples
- [x] TypeScript strict mode enabled
- [x] Declaration files (.d.ts) generation
- [x] Build scripts in package.json
- [x] 0 TypeScript compilation errors
- [x] Successful Vite bundling (832.70 kB, 246.89 kB gzipped)

---

### 🔄 **IN PROGRESS / NEEDS REVIEW**

#### Modal Component Enhancements
- [ ] **Verify tabs work in browser** (need to test the Fluent UI TabList integration)
- [ ] **Verify tooltips work in browser** (need to test the Fluent UI Tooltip integration)
- [ ] Review Modal.Group API for tab structure
- [ ] Test keyboard navigation in tabs
- [ ] Verify all field types render correctly with tooltips
- [ ] Test hybrid React/vanilla architecture in D365 CE environment

#### Toast Component
- [ ] **Convert to TypeScript** (currently vanilla JS)
- [ ] Add TypeScript interfaces (ToastOptions, etc.)
- [ ] Add optional notification sound feature
- [ ] Review object-based API vs string-based API
- [ ] Consider migrating to Fluent UI Toast/Toaster component

---

### ❌ **NOT STARTED / TODO**

#### Modal Component - Advanced Features
- [ ] **Progress Indicators** (4 modes):
  - [ ] Progress bar mode (top/bottom)
  - [ ] Steps-left column mode
  - [ ] Steps-right column mode
  - [ ] Step type (advanced wizard with validation)
- [ ] **Side Cart/Panel**:
  - [ ] HTML content mode
  - [ ] Cover image mode
  - [ ] Left/right positioning
  - [ ] Responsive layout adjustments
- [ ] **Async Pattern**: `.showAsync()` method returning Promise
- [ ] **Loading State**: `.setLoading(isLoading, message)` method
- [ ] **Auto-save to localStorage** feature
- [ ] **Draggable** modal support
- [ ] **Button alignment** options (left/center/right/space-between)
- [ ] **Destructive button** with type-to-confirm
- [ ] **Dynamic updates**: `.updateProgress()`, `.updateSideCart()`
- [ ] **Step navigation**: `.nextStep()`, `.previousStep()`, `.goToStep()`
- [ ] **Validation**: `.validateCurrentStep()`, `.validateAllFields()`
- [ ] **Field value getters**: `.getFieldValue()`, `.getFieldValues()`
- [ ] **Auto-save management**: `.clearAutoSave()`
- [ ] **Element access**: `.getElement()` method
- [ ] **Method chaining** for all setters

#### Modal Component - Field Types
- [ ] **Modal.Input enhancements**:
  - [ ] Toggle type (D365-style switch)
  - [ ] Validation rules system
  - [ ] Custom validation functions
  - [ ] Inline error messages
  - [ ] validateOn options (blur/change/submit)
  - [ ] showValue for range sliders
- [ ] **Modal.DateRange** (NEW field type)
- [ ] **Modal.MultiLine** improvements
- [ ] **Modal.OptionSet** improvements
- [ ] **Modal.Lookup enhancements**:
  - [ ] Dropdown mode (default) with lazy loading
  - [ ] Side panel mode (D365-style)
  - [ ] Custom FetchXML queries
  - [ ] Pagination support
  - [ ] Search/filter functionality
  - [ ] Multi-select support
- [ ] **Modal.Custom** for custom HTML elements

#### Lookup Component (Standalone)
- [ ] **New component** - Dedicated entity lookup with table display
- [ ] Search bar with real-time filtering
- [ ] Table display with sortable columns
- [ ] Column label auto-resolution from entity metadata
- [ ] Pagination controls
- [ ] Single/multi-select modes
- [ ] FetchXML filter support
- [ ] Loading states and error handling
- [ ] Integration with Modal component
- [ ] Return EntityReference format

#### Logger Utility
- [ ] **Convert to TypeScript** (currently vanilla JS)
- [ ] Export BUG, WAR, ERR constants
- [ ] TypeScript interfaces
- [ ] Maintain existing console pattern

#### Design System
- [ ] Finalize color tokens for all components
- [ ] Create shared animation utilities
- [ ] Document typography system
- [ ] Create reusable shadow definitions
- [ ] Border radius standards
- [ ] D365-specific theming

#### Testing & Quality
- [ ] Browser testing (Chrome, Edge, Firefox)
- [ ] D365 CE iframe testing
- [ ] Keyboard navigation testing
- [ ] Screen reader accessibility testing
- [ ] Bundle size optimization (target < 50KB mentioned in spec, currently 833KB)
  - [ ] Investigate tree-shaking for unused Fluent UI components
  - [ ] Consider code splitting for optional features
  - [ ] Analyze bundle composition
- [ ] Performance profiling (60fps animations)

#### Documentation
- [ ] Complete API documentation
- [ ] JSDoc comments for all public APIs
- [ ] Usage examples for all components
- [ ] Migration guide (vanilla → React internally)
- [ ] README with installation instructions
- [ ] Contributing guidelines
- [ ] Update demo page with all new features

#### Nice-to-Have Enhancements
- [ ] Migrate Switch to Fluent UI React Switch component
- [ ] Add more Fluent UI components as needed
- [ ] Internationalization (i18n) support
- [ ] Dark mode support
- [ ] Custom theme support
- [ ] Animation customization options

---

### 🎯 **RECOMMENDED NEXT STEPS**

1. **Test Current Implementation** (High Priority)
   - Build and run demo page (`npm run demo`)
   - Test TabList in browser
   - Test Tooltip in browser
   - Verify hybrid React/vanilla architecture works
   - Check console for errors
   - Test in D365 CE environment

2. **Complete Toast Migration** (Medium Priority)
   - Convert to TypeScript
   - Add to centralized FluentUI structure
   - Consider Fluent UI Toast/Toaster component
   - Maintain existing API for backward compatibility

3. **Modal Advanced Features** (Medium Priority)
   - Implement progress indicators (start with bar mode)
   - Implement side cart/panel (high visual impact)
   - Add validation system for fields
   - Implement async/await pattern with `.showAsync()`

4. **Standalone Lookup Component** (High Priority for D365)
   - Essential for D365 workflows
   - Table display with metadata resolution
   - Search and pagination
   - Integration with Modal

5. **Documentation & Examples** (Ongoing)
   - Update demo page as features are added
   - Create code snippets for common scenarios
   - Document API changes
   - Add inline JSDoc comments

6. **Bundle Size Optimization** (Medium Priority)
   - Current: 833 KB (247 KB gzipped)
   - Target: < 50 KB (as per spec)
   - Tree-shaking analysis
   - Consider lazy loading for Fluent UI components

---

### 📊 **METRICS**

**Current Build Stats:**
- Bundle Size: 832.70 kB (246.89 kB gzipped)
- TypeScript Errors: 0
- Build Time: ~5 seconds
- Components: 22 FluentUI components available (2 actively used: Tab, Tooltip)

**Code Reduction from React Migration:**
- TabList: ~170 lines of vanilla JS removed
- Tooltip: ~70 lines of vanilla JS removed
- Total: ~240 lines removed, replaced with ~50 lines of React integration code

**Architecture:**
- **Pattern**: Vanilla JS API → React components internally
- **Consumer Experience**: Zero React knowledge required
- **Developer Experience**: Modern React + TypeScript + Fluent UI
