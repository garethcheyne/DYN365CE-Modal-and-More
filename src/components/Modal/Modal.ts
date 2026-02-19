/**
 * Modal Component
 * Advanced dialog system for D365 CE
 */

import {
  Info24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  QuestionCircle24Regular,
  FullScreenMaximizeRegular,
  FullScreenMinimizeRegular,
} from '@fluentui/react-icons';
import { theme } from '../../styles/theme';
import { injectAnimations } from '../../styles/animations';
import type {
  ModalOptions,
  ModalInstance,
  ModalResponse,
  FieldConfig,
  QueryBuilderOpenOptions,
  QueryBuilderOpenResult
} from './Modal.types';
import { ModalButton } from './Modal.types';
import { getTargetDocument } from '../../utils/dom';
import { UILIB } from '../Logger/Logger';
import {
  React,
  TabList,
  Tab,
  Button,
  CheckboxFluentUi,
  SwitchFluentUi,
  DatePickerFluentUi,
  TableFluentUi,
  InputFluentUi,
  DropdownFluentUi,
  AddressLookupFluentUi,
  LookupFluentUi,
  FileUploadFluentUi,
  FieldGroupFluentUi,
  Slider,
  Field,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  mountFluentComponent,
  unmountFluentComponent,
  defaultTheme,
} from '../FluentUi';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { QueryBuilder } from 'fluentui-extended';
import type { QueryBuilderApplyResult } from 'fluentui-extended';

/**
 * Modal class
 */
export class Modal implements ModalInstance {
  private overlay: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private header: HTMLElement | null = null;
  private body: HTMLElement | null = null;
  private footer: HTMLElement | null = null;
  private loadingOverlay: HTMLElement | null = null;
  private resolvePromise: ((value: ModalResponse) => void) | null = null;
  private fieldValues: Map<string, any> = new Map();
  private fieldVisibilityMap: Map<string, boolean> = new Map();
  private fieldRequiredMap: Map<string, boolean> = new Map();
  private fieldValidationErrors: Map<string, string> = new Map(); // Track validation errors
  private buttonDisabledSetters: Map<ModalButton, (disabled: boolean) => void> = new Map(); // React state setters for button disabled state
  private currentStep: number = 1;
  private totalSteps: number = 1;
  private stepPanels: HTMLElement[] = [];
  private stepIndicator: HTMLElement | null = null;
  private buttonElements: Map<ModalButton, HTMLElement> = new Map();
  private options: ModalOptions;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private modalStartX: number = 0;
  private modalStartY: number = 0;
  private isFullscreen: boolean = false;
  private fieldSetters: Map<string, (value: any) => void> = new Map(); // React state setters
  private debug: boolean = false; // Debug mode flag
  private pendingReactMounts: Array<() => void> = []; // Queue for React mounts to execute after show()
  private initPromise: Promise<void>; // Promise that resolves when modal initialization is complete
  private updateButtonStatesTimer: number | null = null; // Debounce timer for button state updates

  constructor(options: ModalOptions) {
    this.options = {
      preventClose: false,
      allowDismiss: false,  // Changed default: require explicit button clicks to close
      allowEscapeClose: true,
      draggable: false,
      buttonAlignment: 'right',
      autoSave: false,
      size: 'medium',
      debug: false,
      ...options
    };

    this.debug = this.options.debug || false;

    if (this.debug) {
      console.debug(...UILIB, '[Modal Debug] Constructor called with options:', this.options);
    }

    // Extract width/height from size object if provided
    if (typeof this.options.size === 'object' && this.options.size !== null) {
      if (this.options.size.width !== undefined) {
        this.options.width = this.options.size.width;
      }
      if (this.options.size.height !== undefined) {
        this.options.height = this.options.size.height;
      }
    }

    this.initPromise = this.initModal();
  }

  /**
   * Debug logging helper
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.debug(...UILIB, '[Modal Debug]', ...args);
    }
  }

  /**
   * Initialize modal asynchronously (for D365 option set fetching)
   */
  private async initModal(): Promise<void> {
    await this.createModal();
  }

  /**
   * Fetch option set values from D365 metadata
   */
  private async fetchD365OptionSet(
    entityName: string,
    attributeName: string,
    includeNull: boolean = false,
    sortByLabel: boolean = false
  ): Promise<Array<{ label: string; value: string }>> {
    try {
      // Check if Xrm is available
      if (typeof (window as any).Xrm === 'undefined') {
        console.debug(...UILIB, 'Dynamics 365 Xrm object not available. Cannot fetch option set.');
        return [];
      }

      const Xrm = (window as any).Xrm;

      // Retrieve attribute metadata
      const attribute = await Xrm.Utility.getEntityMetadata(entityName, [attributeName]);
      const attributeMetadata = attribute.Attributes._collection[attributeName];

      if (!attributeMetadata || !attributeMetadata.OptionSet) {
        console.debug(...UILIB, `No option set found for ${entityName}.${attributeName}`);
        return [];
      }

      // Extract options
      let options: Array<{ label: string; value: string }> = [];
      
      const optionSet = attributeMetadata.OptionSet.Options;
      for (const option of optionSet) {
        options.push({
          label: option.Label,
          value: option.Value.toString()
        });
      }

      // Add null/blank option if requested
      if (includeNull) {
        options.unshift({ label: '', value: '' });
      }

      // Sort if requested
      if (sortByLabel) {
        options.sort((a, b) => a.label.localeCompare(b.label));
      }

      return options;

    } catch (error) {
      console.error(...UILIB, `Error fetching option set for ${entityName}.${attributeName}:`, error);
      return [];
    }
  }

  /**
   * Create address lookup field with Google Maps or Azure Maps
   */
  private async createAddressLookupField(field: FieldConfig): Promise<HTMLElement | null> {
    const doc = getTargetDocument();
    const container = doc.createElement('div');
    container.setAttribute('data-field-id', field.id);

    if (!field.addressLookup) {
      console.debug(...UILIB, 'Address lookup configuration missing');
      return null;
    }

    // Support dynamic values - if apiKey or provider are field IDs, read their values
    let { provider, apiKey, placeholder, fields: relatedFields, onSelect } = field.addressLookup;
    
    // If apiKey looks like a field ID (no spaces, alphanumeric), try to read it as a field value
    if (typeof apiKey === 'string' && apiKey.includes('{{') && apiKey.includes('}}')) {
      const fieldId = apiKey.replace(/\{\{|\}\}/g, '').trim();
      const fieldValue = this.fieldValues.get(fieldId) || this.getFieldValue(fieldId);
      if (fieldValue) {
        apiKey = fieldValue.toString();
      }
    }
    
    // Same for provider
    if (typeof provider === 'string' && provider.includes('{{') && provider.includes('}}')) {
      const fieldId = provider.replace(/\{\{|\}\}/g, '').trim();
      const fieldValue = this.fieldValues.get(fieldId) || this.getFieldValue(fieldId);
      if (fieldValue) {
        provider = fieldValue as 'google' | 'azure';
      }
    }

    if (!apiKey) {
      console.error(...UILIB, `${provider === 'google' ? 'Google Maps' : 'Azure Maps'} API key required`);
      return null;
    }

    // Mount the AddressLookupFluentUi React component
    const handleSelect = (address: any) => {
      // Store the complete address object
      this.fieldValues.set(field.id, address);
      field.value = address;

      // Auto-populate related fields
      if (relatedFields) {
        if (relatedFields.street && address.street) {
          this.setFieldValue(relatedFields.street, address.street);
        }
        if (relatedFields.city && address.city) {
          this.setFieldValue(relatedFields.city, address.city);
        }
        if (relatedFields.state && address.state) {
          this.setFieldValue(relatedFields.state, address.state);
        }
        if (relatedFields.postalCode && address.postalCode) {
          this.setFieldValue(relatedFields.postalCode, address.postalCode);
        }
        if (relatedFields.country && address.country) {
          this.setFieldValue(relatedFields.country, address.country);
        }
        if (relatedFields.latitude && address.latitude) {
          this.setFieldValue(relatedFields.latitude, address.latitude.toString());
        }
        if (relatedFields.longitude && address.longitude) {
          this.setFieldValue(relatedFields.longitude, address.longitude.toString());
        }
      }

      // Call custom callback
      if (onSelect) {
        onSelect(address);
      }

      // Update field visibility
      this.updateFieldVisibility(field.id);
    };

    mountFluentComponent(
      container,
      React.createElement(AddressLookupFluentUi, {
        id: field.id,
        label: field.label,
        provider: provider,
        apiKey: apiKey,
        placeholder: placeholder,
        disabled: field.disabled,
        required: field.required,
        orientation: field.orientation,
        componentRestrictions: field.addressLookup.componentRestrictions,
        onSelect: handleSelect,
      })
    );

    this.fieldValues.set(field.id, field.value || '');
    return container;
  }

  private async createModal(): Promise<void> {
    const doc = getTargetDocument();
    injectAnimations();

    this.overlay = doc.createElement('div');
    // Fluent UI v9 Dialog backdrop styling
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(0px);
      z-index: ${theme.zIndex.modalOverlay};
      animation: fadeIn 0.3s cubic-bezier(0.33, 0, 0.67, 1) forwards;
    `;

    if (this.options.allowDismiss) {
      this.overlay.onclick = () => this.close();
    }

    this.container = doc.createElement('div');
    // Fluent UI v9 Dialog surface container
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: ${theme.zIndex.modal};
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    this.container.onclick = (e) => e.stopPropagation();

    this.modal = doc.createElement('div');
    const { width, height } = this.getModalDimensions();

    // Helper function to format size value
    const formatSize = (value: number | string | null | undefined): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') {
        return value; // Already formatted (e.g., "80%", "800px", "80vh")
      }
      return `${value}px`; // Convert number to px
    };

    // Fluent UI v9 Dialog surface styling
    this.modal.style.cssText = `
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.14);
      border: 1px solid rgba(0, 0, 0, 0.1);
      animation: fadeInScale 0.3s cubic-bezier(0.33, 0, 0.67, 1) forwards;
      width: ${formatSize(width)};
      max-width: 95vw;
      ${height ? `height: ${formatSize(height)}; max-height: 90vh;` : 'max-height: 90vh;'}
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    `;

    this.createHeader();
    await this.createBody();
    this.modal.appendChild(this.body!);
    this.createFooter();

    // Update button states after React components mount
    // Use multiple timeouts to ensure all React useEffect hooks have run
    // First check at 50ms, second at 200ms to catch any delayed renders
    setTimeout(() => {
      this.log('Running initial updateButtonStates after React mount (50ms)');
      this.updateButtonStates();
    }, 50);
    
    setTimeout(() => {
      this.log('Running delayed updateButtonStates after React mount (200ms)');
      this.updateButtonStates();
    }, 200);

    // If sideCart is enabled, create a wrapper for modal + sideCart
    if (this.options.sideCart?.enabled) {
      const isAttached = this.options.sideCart.attached === true;
      const modalWrapper = doc.createElement('div');
      modalWrapper.style.cssText = `
        display: flex;
        ${this.options.sideCart.position === 'left' ? 'flex-direction: row-reverse;' : 'flex-direction: row;'}
        align-items: stretch;
        ${!isAttached ? 'gap: 18px;' : ''}
      `;

      const sideCart = this.createSideCart();

      modalWrapper.appendChild(this.modal);
      if (sideCart) {
        modalWrapper.appendChild(sideCart);
      }

      this.container.appendChild(modalWrapper);
    } else {
      this.container.appendChild(this.modal);
    }

    if (this.options.allowEscapeClose) {
      doc.addEventListener('keydown', this.handleEscapeKey);
    }
  }

  private getModalDimensions(): { width: number | string; height: number | string | null } {
    // Direct width/height properties take precedence
    if (this.options.width) {
      return { width: this.options.width, height: this.options.height || null };
    }

    // Handle size object
    if (typeof this.options.size === 'object') {
      const sizeObj = this.options.size;
      return {
        width: sizeObj.width || 600, // Default to medium width
        height: sizeObj.height || null
      };
    }

    // Check if first step has width defined (for wizard modals)
    if (this.options.progress?.steps?.[0]?.width) {
      return {
        width: this.options.progress.steps[0].width,
        height: this.options.progress.steps[0].height || null
      };
    }

    // Handle predefined size strings
    const sizeMap: Record<string, { width: number; height: number | null }> = {
      small: { width: 400, height: null },
      medium: { width: 600, height: null },
      large: { width: 900, height: null },
      fullscreen: { width: window.innerWidth * 0.95, height: window.innerHeight * 0.9 }
    };

    const sizeString = this.options.size as string;
    return sizeMap[sizeString || 'medium'] || sizeMap.medium;
  }

  private createIconElement(iconType: string): HTMLElement | null {
    const doc = getTargetDocument();

    // Map icon types to Fluent UI React Icons
    const iconMap: Record<string, { component: any; color: string }> = {
      INFO: { component: Info24Regular, color: '#0078d4' },
      SUCCESS: { component: CheckmarkCircle24Regular, color: '#107c10' },
      WARNING: { component: Warning24Regular, color: '#ff9800' },
      ERROR: { component: ErrorCircle24Regular, color: '#d13438' },
      QUESTION: { component: QuestionCircle24Regular, color: '#0078d4' }
    };

    const iconConfig = iconMap[iconType];
    if (!iconConfig) return null;

    // Create large backdrop icon (subtle, in corner)
    const backdropIcon = doc.createElement('div');
    backdropIcon.style.cssText = `
      position: absolute;
      bottom: -40px;
      left: -40px;
      font-size: 160px;
      opacity: 0.08;
      pointer-events: none;
      z-index: 0;
    `;

    // Create small header icon (full color, beside title)
    const headerIcon = doc.createElement('div');
    headerIcon.style.cssText = `
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Mount large backdrop icon with subtle opacity
    const BackdropIconElement = React.createElement(iconConfig.component, {
      style: {
        color: iconConfig.color,
        width: '160px',
        height: '160px'
      }
    });
    mountFluentComponent(backdropIcon, BackdropIconElement, defaultTheme);

    // Mount small header icon with full color
    const HeaderIconElement = React.createElement(iconConfig.component, {
      style: { color: iconConfig.color },
      primaryFill: iconConfig.color
    });
    mountFluentComponent(headerIcon, HeaderIconElement, defaultTheme);

    // Add backdrop to modal
    if (this.modal) {
      this.modal.style.position = 'relative';
      this.modal.style.overflow = 'hidden';
      this.modal.appendChild(backdropIcon);
    }

    return headerIcon;
  }

  private createHeader(): void {
    const doc = getTargetDocument();
    this.header = doc.createElement('div');
    // Fluent UI v9 Dialog header styling
    this.header.style.cssText = `
      padding: 20px 20px 12px 20px;
      border-bottom: none;
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-shrink: 0;
      gap: 8px;
      ${this.options.draggable ? 'cursor: move;' : ''}
    `;

    // Container for icon + title
    const titleContainer = doc.createElement('div');
    titleContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    `;

    // Add icon if specified
    if (this.options.icon) {
      const iconEl = this.createIconElement(this.options.icon);
      if (iconEl) {
        titleContainer.appendChild(iconEl);
      }
    }

    const titleEl = doc.createElement('h2');
    titleEl.textContent = this.options.title;
    // Fluent UI v9 DialogTitle styling
    titleEl.style.cssText = `
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      line-height: 28px;
      color: #242424;
    `;
    titleContainer.appendChild(titleEl);
    this.header.appendChild(titleContainer);

    // Create button container for header actions
    const buttonContainer = doc.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 4px;
    `;

    // Add fullscreen toggle button
    const fullscreenBtn = doc.createElement('button');
    fullscreenBtn.setAttribute('aria-label', 'Toggle Fullscreen');
    fullscreenBtn.style.cssText = `
      background: transparent;
      border: none;
      outline: none;
      font-size: 20px;
      line-height: 1;
      color: #424242;
      cursor: pointer;
      padding: 0;
      margin: 0;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    `;

    // Mount fullscreen icon
    const fullscreenIconContainer = doc.createElement('div');
    fullscreenIconContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; padding: 0; margin: 0; margin-top: 4px;';
    const FullscreenIcon = React.createElement(FullScreenMaximizeRegular);
    mountFluentComponent(fullscreenIconContainer, FullscreenIcon, defaultTheme);
    fullscreenBtn.appendChild(fullscreenIconContainer);

    fullscreenBtn.onclick = () => this.toggleFullscreen(fullscreenIconContainer);
    buttonContainer.appendChild(fullscreenBtn);

    if (!this.options.preventClose) {
      const closeBtn = doc.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Close');
      // Fluent UI v9 Dialog close button styling
      closeBtn.style.cssText = `
        background: transparent;
        border: none;
        outline: none;
        font-size: 20px;
        line-height: 1;
        color: #424242;
        cursor: pointer;
        padding: 0;
        margin: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      `;
      closeBtn.onclick = () => this.close();
      buttonContainer.appendChild(closeBtn);
    }

    this.header.appendChild(buttonContainer);

    if (this.options.draggable && this.header) {
      this.header.onmousedown = (e) => this.startDrag(e);
    }

    this.modal!.appendChild(this.header);
  }

  private async createBody(): Promise<void> {
    const doc = getTargetDocument();
    this.body = doc.createElement('div');

    // Check if wizard mode is enabled (has steps)
    const hasSteps = this.options.progress?.enabled && this.options.progress?.steps && this.options.progress.steps.length > 0;

    // Use the same body styling for both wizard and non-wizard modes
    this.body.style.cssText = `
      flex: 1;
      overflow: auto;
      padding: 20px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
    `;

    // Add modal message if provided
    if (this.options.message) {
      const messageEl = doc.createElement('p');
      messageEl.textContent = this.options.message;
      messageEl.style.cssText = `
        margin: 0 0 ${theme.spacing.m} 0;
        color: ${theme.colors.modal.textSecondary};
        font-size: ${theme.typography.fontSize.body};
      `;
      this.body.appendChild(messageEl);
    }

    // Add modal content if provided
    if (this.options.content) {
      const contentEl = doc.createElement('div');
      contentEl.innerHTML = this.options.content;
      contentEl.style.cssText = `
        margin-bottom: ${theme.spacing.m};
      `;
      this.body.appendChild(contentEl);
    }

    // Add custom content element if provided
    if (this.options.customContent) {
      const customContentWrapper = doc.createElement('div');
      customContentWrapper.style.cssText = `
        margin-bottom: ${theme.spacing.m};
        display: flex;
        flex-direction: column;
        gap: ${theme.spacing.s};
      `;
      customContentWrapper.appendChild(this.options.customContent);
      this.body.appendChild(customContentWrapper);
    }

    if (hasSteps) {
      // Wizard mode: add step indicator
      this.totalSteps = this.options.progress!.steps!.length;
      this.currentStep = this.options.progress!.currentStep || 1;

      this.stepIndicator = this.createStepIndicator();
      this.body.appendChild(this.stepIndicator);

      // Create step panels
      for (const [index, step] of this.options.progress!.steps!.entries()) {
        const panel = doc.createElement('div');
        panel.setAttribute('data-step', String(index + 1));
        panel.style.cssText = `
          display: ${index + 1 === this.currentStep ? 'flex' : 'none'};
          flex-direction: column;
          gap: ${theme.spacing.m};
          flex: 1;
          padding-top: ${theme.spacing.m};
        `;

        // Add step-specific message if provided
        if (step.message) {
          const stepMessageEl = doc.createElement('p');
          stepMessageEl.textContent = step.message;
          stepMessageEl.style.cssText = `
            margin: 0 0 ${theme.spacing.m} 0;
            color: ${theme.colors.modal.textSecondary};
            font-size: ${theme.typography.fontSize.body};
          `;
          panel.appendChild(stepMessageEl);
        }

        // Add step-specific content if provided
        if (step.content) {
          const stepContentEl = doc.createElement('div');
          stepContentEl.innerHTML = step.content;
          stepContentEl.style.cssText = `
            margin-bottom: ${theme.spacing.m};
          `;
          panel.appendChild(stepContentEl);
        }

        if (step.fields) {
          for (const field of step.fields) {
            const fieldEl = await this.createField(field);
            if (fieldEl) panel.appendChild(fieldEl);
          }
        }

        this.stepPanels.push(panel);
        this.body.appendChild(panel);
      }
    } else if (this.options.fields && this.options.fields.length > 0) {
      // Non-wizard mode: treat as single-step wizard internally (same code path)
      this.totalSteps = 1;
      this.currentStep = 1;

      const panel = doc.createElement('div');
      panel.setAttribute('data-step', '1');
      panel.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: ${theme.spacing.m};
        flex: 1;
        padding-top: ${theme.spacing.m};
      `;

      for (const field of this.options.fields) {
        const fieldEl = await this.createField(field);
        if (fieldEl) panel.appendChild(fieldEl);
      }

      this.stepPanels.push(panel);
      this.body.appendChild(panel);
    }
  }

  private createStepIndicator(): HTMLElement {
    const doc = getTargetDocument();
    const container = doc.createElement('div');
    container.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: flex-start;
      gap: 8px;
      padding-top: 20px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e1dfdd;
      margin-bottom: 24px;
    `;

    this.options.progress!.steps!.forEach((step, index) => {
      const stepNum = index + 1;
      const isCurrent = stepNum === this.currentStep;
      const isCompleted = stepNum < this.currentStep;
      const isValid = this.validateStep(index);
      const showError = isCompleted && !isValid;
      const missingFields = showError ? this.getMissingRequiredFields(index) : [];

      const stepEl = doc.createElement('div');
      stepEl.setAttribute('data-step-indicator', String(stepNum));
      stepEl.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        flex: 1;
        cursor: ${this.options.progress!.allowStepNavigation ? 'pointer' : 'default'};
      `;

      // Step circle with Popover for error state
      const circleWrapper = doc.createElement('div');
      const bgColor = isCurrent ? '#0078d4' : showError ? '#d13438' : isCompleted ? '#107c10' : '#f3f2f1';
      const textColor = isCurrent || isCompleted || showError ? '#ffffff' : '#605e5c';
      const borderColor = isCurrent ? '#0078d4' : showError ? '#d13438' : isCompleted ? '#107c10' : '#d2d0ce';
      
      if (showError && missingFields.length > 0) {
        // Use React Popover for error state
        const PopoverContent = () => {
          const trigger = React.createElement(
            PopoverTrigger,
            { disableButtonEnhancement: true },
            React.createElement('div', {
              onClick: (e: any) => e.stopPropagation(), // Prevent navigation on click
              style: {
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '14px',
                background: bgColor,
                color: textColor,
                border: `2px solid ${borderColor}`,
                cursor: 'help'
              }
            }, '!')
          );

          const surface = React.createElement(
            PopoverSurface,
            { style: { maxWidth: '280px', padding: '12px' } },
            React.createElement('div', null,
              React.createElement('div', { 
                style: { 
                  fontWeight: '600', 
                  marginBottom: '8px',
                  color: '#d13438'
                } 
              }, 'Missing Required Fields:'),
              React.createElement('ul', { 
                style: { 
                  margin: '0', 
                  paddingLeft: '20px',
                  fontSize: '13px',
                  lineHeight: '1.6'
                } 
              }, ...missingFields.map(field => 
                React.createElement('li', { key: field }, field)
              ))
            )
          );

          return React.createElement(
            Popover,
            { 
              positioning: 'below', 
              withArrow: true, 
              openOnHover: true,
              mouseLeaveDelay: 0,
              children: [trigger, surface] 
            }
          );
        };

        mountFluentComponent(circleWrapper, React.createElement(PopoverContent), defaultTheme);
      } else {
        // Regular circle without Popover
        const circle = doc.createElement('div');
        circle.style.cssText = `
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          background: ${bgColor};
          color: ${textColor};
          border: 2px solid ${borderColor};
        `;
        circle.textContent = showError ? '!' : isCompleted ? '✓' : String(stepNum);
        circleWrapper.appendChild(circle);
      }
      
      stepEl.appendChild(circleWrapper);

      // Step label
      if (step.label) {
        const label = doc.createElement('div');
        label.style.cssText = `
          font-size: 12px;
          color: ${isCurrent ? '#0078d4' : '#605e5c'};
          text-align: center;
          font-weight: ${isCurrent ? '600' : '400'};
        `;
        label.textContent = step.label;
        stepEl.appendChild(label);
      }

      if (this.options.progress!.allowStepNavigation) {
        stepEl.onclick = () => this.goToStep(String(stepNum));
      }

      container.appendChild(stepEl);

      // Add connector line (except after last step)
      if (index < this.options.progress!.steps!.length - 1) {
        const connector = doc.createElement('div');
        const connectorColor = showError ? '#d13438' : isCompleted ? '#107c10' : '#d2d0ce';
        connector.style.cssText = `
          flex: 1;
          height: 2px;
          background: ${connectorColor};
          margin-top: 16px;
          align-self: flex-start;
        `;
        container.appendChild(connector);
      }
    });

    return container;
  }

  private updateStepIndicator(): void {
    if (!this.stepIndicator || !this.stepIndicator.parentElement) return;

    // Store the next sibling (first step panel) to maintain correct position
    const nextSibling = this.stepIndicator.nextSibling;
    const parent = this.stepIndicator.parentElement;
    
    // Remove old indicator
    parent.removeChild(this.stepIndicator);
    
    // Create new indicator with updated state (including Popovers)
    this.stepIndicator = this.createStepIndicator();
    
    // Insert at the same position (before the first step panel)
    if (nextSibling) {
      parent.insertBefore(this.stepIndicator, nextSibling);
    } else {
      parent.appendChild(this.stepIndicator);
    }

    // Update button states based on validation
    this.updateButtonStates();
  }

  private createSideCart(): HTMLElement | null {
    if (!this.options.sideCart?.enabled) return null;

    const doc = getTargetDocument();
    const sideCart = doc.createElement('div');
    const cartWidth = this.options.sideCart.width || 300;
    const isAttached = this.options.sideCart.attached === true; // Default to false (detached)

    sideCart.style.cssText = `
      width: ${cartWidth}px;
      flex-shrink: 0;
      background: ${this.options.sideCart.backgroundColor || '#ffffff'};
      overflow: auto;
      border-radius: ${theme.borderRadius.medium};
      ${!isAttached ? `box-shadow: ${theme.shadows.modal};` : ''}
    `;

    if (this.options.sideCart.content) {
      sideCart.innerHTML = this.options.sideCart.content;
    } else if (this.options.sideCart.imageUrl) {
      const img = doc.createElement('img');
      img.src = this.options.sideCart.imageUrl;
      img.style.cssText = `
        width: 100%;
        height: auto;
        display: block;
      `;
      sideCart.appendChild(img);
    }

    return sideCart;
  }

  private async createTabs(tabs: FieldConfig[]): Promise<HTMLElement> {
    const doc = getTargetDocument();
    const container = doc.createElement('div');

    // Create tab panels content first (non-React)
    const tabPanelsContainer = doc.createElement('div');
    const tabPanels: HTMLElement[] = [];

    for (const [index, tab] of tabs.entries()) {
      const panel = doc.createElement('div');
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('id', `panel-${index}`);
      panel.style.cssText = `
        display: ${index === 0 ? 'flex' : 'none'};
        flex-direction: column;
        gap: 12px;
        padding-top: 12px;
      `;

      // Add content/html if provided
      if (tab.content) {
        const contentDiv = doc.createElement('div');
        contentDiv.innerHTML = tab.content;
        contentDiv.style.marginBottom = '12px';
        panel.appendChild(contentDiv);
      } else if (tab.html) {
        const htmlDiv = doc.createElement('div');
        htmlDiv.innerHTML = tab.html;
        htmlDiv.style.marginBottom = '12px';
        panel.appendChild(htmlDiv);
      }

      if (tab.fields) {
        for (const field of tab.fields) {
          const fieldEl = await this.createField(field);
          if (fieldEl) panel.appendChild(fieldEl);
        }
      }

      tabPanels.push(panel);
      tabPanelsContainer.appendChild(panel);
    }

    // Create React TabList component
    const tabListContainer = doc.createElement('div');

    const TabsComponent = () => {
      const [selectedValue, setSelectedValue] = React.useState('tab-0');

      const onTabSelect = (_event: any, data: any) => {
        setSelectedValue(data.value);

        // Show/hide corresponding panels
        tabPanels.forEach((panel, index) => {
          panel.style.display = data.value === `tab-${index}` ? 'flex' : 'none';
        });
      };

      return React.createElement(
        TabList,
        { selectedValue, onTabSelect },
        tabs.map((tab, index) =>
          React.createElement(
            Tab,
            { key: `tab-${index}`, value: `tab-${index}` },
            tab.label || `Tab ${index + 1}`
          )
        )
      );
    };

    mountFluentComponent(tabListContainer, React.createElement(TabsComponent), defaultTheme);

    container.appendChild(tabListContainer);
    container.appendChild(tabPanelsContainer);

    return container;
  }

  private async createFieldGroup(field: FieldConfig): Promise<HTMLElement> {
    const doc = getTargetDocument();
    const container = doc.createElement('div');
    container.setAttribute('data-field-id', field.id);
    container.setAttribute('data-field-group', field.id);

    // Set initial visibility based on visibleWhen condition
    if (field.visibleWhen) {
      const isVisible = this.evaluateVisibilityCondition(field.visibleWhen);
      this.fieldVisibilityMap.set(field.id, isVisible);
      if (!isVisible) {
        container.style.display = 'none';
      }
    } else {
      this.fieldVisibilityMap.set(field.id, true);
    }

    // Create field elements for nested fields
    const fieldElements: HTMLElement[] = [];
    if (field.fields) {
      for (const nestedField of field.fields) {
        const fieldEl = await this.createField(nestedField);
        if (fieldEl) {
          fieldElements.push(fieldEl);
        }
      }
    }

    // Create React wrapper component for the group
    const GroupWrapper = () => {
      return React.createElement(
        FieldGroupFluentUi,
        {
          id: field.id,
          label: field.label,
          content: field.content,
          border: field.border,
          collapsible: field.collapsible,
          defaultCollapsed: field.defaultCollapsed,
          // Pass children as a prop
          children: React.createElement('div', {
            ref: (el: HTMLDivElement | null) => {
              if (el && el.childElementCount === 0) {
                fieldElements.forEach(fieldEl => el.appendChild(fieldEl));
              }
            },
            style: { display: 'contents' }
          })
        }
      );
    };

    mountFluentComponent(container, React.createElement(GroupWrapper), defaultTheme);

    return container;
  }

  private async createField(field: FieldConfig): Promise<HTMLElement | null> {
    const doc = getTargetDocument();

    // Fetch D365 option set if specified
    if (field.optionSet && (!field.options || field.options.length === 0)) {
      const { entityName, attributeName, includeNull, sortByLabel } = field.optionSet;
      field.options = await this.fetchD365OptionSet(entityName, attributeName, includeNull, sortByLabel);
      
      // If no label provided, use attribute name
      if (!field.label) {
        field.label = attributeName.charAt(0).toUpperCase() + attributeName.slice(1).replace(/_/g, ' ');
      }
    }

    // Handle tabs
    if (field.asTabs && field.fields) {
      return this.createTabs(field.fields);
    }

    // Handle custom fields
    if (field.type === 'custom') {
      if (field.render) {
        return field.render();
      } else if (field.html) {
        const container = doc.createElement('div');
        container.innerHTML = field.html;
        return container;
      }
      return null;
    }

    // Handle group fields
    if (field.type === 'group' && field.fields) {
      return this.createFieldGroup(field);
    }

    const container = doc.createElement('div');

    // Set initial visibility based on visibleWhen condition
    if (field.visibleWhen) {
      const isVisible = this.evaluateVisibilityCondition(field.visibleWhen);
      this.fieldVisibilityMap.set(field.id, isVisible);
      if (!isVisible) {
        container.style.display = 'none';
      }
    } else {
      this.fieldVisibilityMap.set(field.id, true);
    }

    // Set initial required state based on requiredWhen condition
    if (field.requiredWhen) {
      const isRequired = this.evaluateVisibilityCondition(field.requiredWhen);
      this.fieldRequiredMap.set(field.id, isRequired);
      if (isRequired) {
        field.required = true;
      }
    } else {
      this.fieldRequiredMap.set(field.id, field.required || false);
    }

    const labelPosition = field.labelPosition || 'left';

    // Note: For Fluent UI field components (Input, Dropdown, Switch, etc.),
    // labels are handled by the components themselves, not here

    switch (field.type) {
      case 'lookup':
        // Inline D365-style lookup field
        const lookupWrapper = doc.createElement('div');
        lookupWrapper.setAttribute('data-field-id', field.id);

        const LookupWrapper = () => {
          const [selectedLookup, setSelectedLookup] = React.useState<any>(field.value || null);

          // Store setter for external updates
          React.useEffect(() => {
            this.fieldSetters.set(field.id, setSelectedLookup);
            return () => { this.fieldSetters.delete(field.id); };
          }, []);

          return React.createElement(LookupFluentUi, {
            id: field.id,
            label: field.label,
            placeholder: field.placeholder || 'Search...',
            tooltip: field.tooltip,
            orientation: field.orientation || 'horizontal',
            entityName: field.entityName || 'account',
            lookupColumns: field.lookupColumns || ['name'],
            filters: field.filters || '',
            value: selectedLookup,
            disabled: field.disabled,
            required: field.required,
            onChange: (selected: any) => {
              setSelectedLookup(selected);
              this.fieldValues.set(field.id, selected);
              this.updateFieldVisibility(field.id);
              this.updateButtonStates();
              field.onChange?.(selected);
            }
          });
        };

        mountFluentComponent(lookupWrapper, React.createElement(LookupWrapper), defaultTheme);
        container.appendChild(lookupWrapper);

        // Store initial value
        this.fieldValues.set(field.id, field.value || null);

        return container;
      case 'addressLookup':
        // Address lookup with Google Maps or Azure Maps
        return await this.createAddressLookupField(field);
      case 'file':
        // File upload with drag-and-drop
        const fileUploadWrapper = doc.createElement('div');
        fileUploadWrapper.setAttribute('data-field-id', field.id);

        const FileUploadWrapper = () => {
          const [selectedFiles, setSelectedFiles] = React.useState<File[]>(field.value || []);

          return React.createElement(FileUploadFluentUi, {
            id: field.id,
            label: field.label,
            accept: field.fileUpload?.accept,
            maxFiles: field.fileUpload?.maxFiles,
            maxSize: field.fileUpload?.maxSize,
            multiple: field.fileUpload?.multiple !== false,
            showFileList: field.fileUpload?.showFileList !== false,
            dragDropText: field.fileUpload?.dragDropText,
            browseText: field.fileUpload?.browseText,
            required: field.required,
            disabled: field.disabled,
            tooltip: field.tooltip,
            orientation: field.orientation || 'vertical',
            value: selectedFiles,
            onChange: (files: File[]) => {
              setSelectedFiles(files);
              this.fieldValues.set(field.id, files);
              field.value = files;
              this.updateFieldVisibility(field.id);
              this.updateButtonStates();
              field.onChange?.(files);
            },
            onFilesSelected: field.fileUpload?.onFilesSelected
          });
        };

        mountFluentComponent(fileUploadWrapper, React.createElement(FileUploadWrapper), defaultTheme);
        container.appendChild(fileUploadWrapper);

        // Store initial value
        this.fieldValues.set(field.id, field.value || []);

        return container;
      case 'checkbox':
        // Use Fluent UI Checkbox component for boolean fields (D365 style)
        const checkboxWrapper = doc.createElement('div');
        checkboxWrapper.setAttribute('data-field-id', field.id);

        // Create a stateful wrapper component to handle checkbox toggling
        const CheckboxWrapper = () => {
          const [checked, setChecked] = React.useState(field.value === true);

          return React.createElement(CheckboxFluentUi, {
            id: field.id,
            checked: checked,
            label: field.label,
            tooltip: field.tooltip,
            orientation: field.orientation || 'horizontal',
            onChange: (newChecked: boolean) => {
              setChecked(newChecked);
              field.value = newChecked;
              this.fieldValues.set(field.id, newChecked);
              this.updateFieldVisibility(field.id);
              this.updateButtonStates();
              field.onChange?.(newChecked);
            }
          });
        };

        mountFluentComponent(checkboxWrapper, React.createElement(CheckboxWrapper), defaultTheme);
        container.appendChild(checkboxWrapper);

        // Store initial value
        this.fieldValues.set(field.id, field.value === true);

        return container;
      case 'switch':
        // Use Fluent UI Switch component for boolean fields
        const switchWrapper = doc.createElement('div');
        switchWrapper.setAttribute('data-field-id', field.id);

        // Create a stateful wrapper component to handle switch toggling
        const SwitchWrapper = () => {
          const [checked, setChecked] = React.useState(field.value === true);

          return React.createElement(SwitchFluentUi, {
            id: field.id,
            checked: checked,
            label: field.label,
            tooltip: field.tooltip,
            orientation: field.orientation || 'horizontal',
            onChange: (newChecked: boolean) => {
              setChecked(newChecked);
              field.value = newChecked;
              this.fieldValues.set(field.id, newChecked);
              this.updateFieldVisibility(field.id);
              this.updateButtonStates();
              
              // Call user's onChange callback if provided
              if (field.onChange) {
                field.onChange(newChecked);
              }
            }
          });
        };

        mountFluentComponent(switchWrapper, React.createElement(SwitchWrapper), defaultTheme);
        container.appendChild(switchWrapper);

        // Store initial value
        this.fieldValues.set(field.id, field.value === true);

        return container;
      case 'textarea':
        // Use Fluent UI Textarea component
        const textareaWrapper = doc.createElement('div');
        textareaWrapper.setAttribute('data-field-id', field.id);

        const TextareaWrapper = () => {
          const [textValue, setTextValue] = React.useState(field.value || '');
          const [validationState, setValidationState] = React.useState<'error' | 'none'>('none');
          const [validationMessage, setValidationMessage] = React.useState<string>('');
          const [touched, setTouched] = React.useState(false);

          // Store setter for external updates
          React.useEffect(() => {
            this.fieldSetters.set(field.id, setTextValue);
            return () => { this.fieldSetters.delete(field.id); };
          }, []);

          const validateField = (value: any, showError: boolean = true) => {
            const isRequired = this.fieldRequiredMap.get(field.id) || false;
            const isEmpty = !value || value === '' || (Array.isArray(value) && value.length === 0);
            
            if (isRequired && isEmpty) {
              this.fieldValidationErrors.set(field.id, 'Required field is empty');
              if (showError && touched) {
                setValidationState('error');
                setValidationMessage('This field is required');
              }
            } else {
              this.fieldValidationErrors.delete(field.id);
              setValidationState('none');
              setValidationMessage('');
            }
          };

          // Validate on mount (without showing error)
          React.useEffect(() => {
            validateField(textValue, false);
          }, []);

          return React.createElement(InputFluentUi, {
            id: field.id,
            label: field.label,
            type: 'textarea',
            value: textValue,
            placeholder: field.placeholder || '---',
            required: field.required || false,
            disabled: field.disabled || false,
            readOnly: field.readOnly || false,
            rows: field.rows || 3,
            tooltip: field.tooltip,
            appearance: 'filled-darker' as const,
            orientation: field.orientation || 'horizontal',
            validationState: validationState,
            validationMessage: validationMessage,
            onChange: (value: string | number) => {
              setTouched(true);
              setTextValue(value);
              this.fieldValues.set(field.id, value);
              field.value = value;
              validateField(value, true);
              this.updateFieldVisibility(field.id);
              this.updateButtonStates();
              
              // Call user's onChange callback if provided
              if (field.onChange) {
                field.onChange(value);
              }
            },
            onFocus: () => {
              setTouched(true);
            },
            onBlur: () => {
              validateField(textValue, true);
            }
          });
        };

        mountFluentComponent(textareaWrapper, React.createElement(TextareaWrapper), defaultTheme);
        container.appendChild(textareaWrapper);

        this.fieldValues.set(field.id, field.value || '');

        return container;
      case 'select':
        // Use Fluent UI Dropdown component
        const selectWrapper = doc.createElement('div');
        selectWrapper.setAttribute('data-field-id', field.id);

        // Extract option strings
        const optionStrings = (field.options || []).map(opt =>
          typeof opt === 'string' ? opt : opt.label
        );

        const SelectWrapper = () => {
          const [selectValue, setSelectValue] = React.useState(field.value || '');

          // Store setter for external updates
          React.useEffect(() => {
            this.fieldSetters.set(field.id, setSelectValue);
            return () => { this.fieldSetters.delete(field.id); };
          }, []);

          return React.createElement(DropdownFluentUi, {
            id: field.id,
            label: field.label,
            value: selectValue,
            options: optionStrings,
            displayMode: field.displayMode || 'dropdown',
            placeholder: field.placeholder || '---',
            required: field.required,
            disabled: field.disabled,
            tooltip: field.tooltip,
            orientation: field.orientation || 'horizontal',
            onChange: (value: string) => {
              setSelectValue(value);
              this.fieldValues.set(field.id, value);
              field.value = value;
              this.updateFieldVisibility(field.id);
              this.updateButtonStates();
              
              // Call user's onChange callback if provided
              if (field.onChange) {
                field.onChange(value);
              }
            }
          });
        };

        mountFluentComponent(selectWrapper, React.createElement(SelectWrapper), defaultTheme);
        container.appendChild(selectWrapper);

        this.fieldValues.set(field.id, field.value || '');

        return container;
      case 'date':
        // Use Fluent UI DatePicker component
        const dateWrapper = doc.createElement('div');
        dateWrapper.setAttribute('data-field-id', field.id);

        // Parse initial date value
        let initialDate: Date | null = null;
        if (field.value) {
          if (field.value instanceof Date) {
            initialDate = field.value;
          } else if (typeof field.value === 'string') {
            initialDate = new Date(field.value);
          }
        }

        // Create a stateful wrapper component
        const DatePickerWrapper = () => {
          const [selectedDate, setSelectedDate] = React.useState<Date | null>(initialDate);

          return React.createElement(DatePickerFluentUi, {
            id: field.id,
            value: selectedDate,
            label: field.label,
            tooltip: field.tooltip,
            required: field.required,
            disabled: field.disabled,
            placeholder: field.placeholder || 'Select a date...',
            orientation: field.orientation || 'horizontal',
            onChange: (date: Date | null) => {
              setSelectedDate(date);
              field.value = date;
              this.fieldValues.set(field.id, date);
              this.updateFieldVisibility(field.id);
              this.updateButtonStates();
              
              // Call user's onChange callback if provided
              if (field.onChange) {
                field.onChange(date);
              }
            }
          });
        };

        mountFluentComponent(dateWrapper, React.createElement(DatePickerWrapper), defaultTheme);
        container.appendChild(dateWrapper);

        // Store initial value
        this.fieldValues.set(field.id, initialDate);

        return container;
      case 'table':
        this.log('Creating table field:', field.id);

        const tableWrapper = doc.createElement('div');
        tableWrapper.setAttribute('data-field-id', field.id);
        tableWrapper.style.cssText = `
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
          ${labelPosition === 'left' ? 'flex: 1;' : ''}
        `;

        // Create a deep copy to preserve the field config in closure (especially tableColumns)
        const tableFieldRef: FieldConfig = {
          ...field,
          tableColumns: field.tableColumns ? [...field.tableColumns.map(col => ({ ...col }))] : [],
          data: field.data ? [...field.data] : []
        };

        this.log('Table field config captured:', { 
          id: tableFieldRef.id, 
          hasColumns: !!tableFieldRef.tableColumns, 
          columnCount: tableFieldRef.tableColumns?.length,
          hasData: !!tableFieldRef.data,
          dataCount: tableFieldRef.data?.length 
        });

        // Create table component with state management
        const TableWrapper = () => {
          // Debug: Log what we received
          console.debug(...UILIB, '[TableWrapper] Received tableFieldRef:', {
            id: tableFieldRef?.id,
            type: tableFieldRef?.type,
            hasTableColumns: !!tableFieldRef?.tableColumns,
            tableColumnsIsArray: Array.isArray(tableFieldRef?.tableColumns),
            columnCount: tableFieldRef?.tableColumns?.length,
            tableColumns: tableFieldRef?.tableColumns,
            hasData: !!tableFieldRef?.data,
            dataCount: tableFieldRef?.data?.length
          });

          // Validate config before rendering
          if (!tableFieldRef || !tableFieldRef.tableColumns || tableFieldRef.tableColumns.length === 0) {
            console.error(...UILIB, '[Modal] TableWrapper: tableColumns missing or empty!', {
              tableFieldRef: tableFieldRef,
              originalField: field
            });
            return React.createElement('div', { 
              style: { padding: '20px', textAlign: 'center', color: '#a4262c' } 
            }, 'Error: Table configuration missing column definitions');
          }

          const [tableConfig, setTableConfig] = React.useState(tableFieldRef);

          // Expose update method for setFieldValue
          React.useEffect(() => {
            const updateData = (newData: any[]) => {
              tableFieldRef.data = newData;
              setTableConfig({ ...tableFieldRef });
            };
            this.fieldValues.set(field.id + '_updateData', updateData);

            return () => {
              this.fieldValues.delete(field.id + '_updateData');
            };
          }, []);

          return React.createElement(TableFluentUi, {
            config: tableConfig,
            onSelectionChange: (selectedRows: any[]) => {
              this.fieldValues.set(field.id, selectedRows);
              if (field.onRowSelect) {
                field.onRowSelect(selectedRows);
              }
            }
          });
        };

        // Defer React mount until after show() appends element to DOM
        // This is critical for cross-document rendering in D365 iframes
        // Pass wrapper directly instead of querying DOM later
        this.log('Queueing table React mount for:', field.id);
        this.pendingReactMounts.push(() => {
          this.log('Mounting table component for:', field.id);
          mountFluentComponent(tableWrapper, React.createElement(TableWrapper), defaultTheme);
          this.log('Table mounted successfully:', field.id);
        });

        container.appendChild(tableWrapper);

        // Store initial empty selection
        this.fieldValues.set(field.id, []);

        return container;
      case 'range':
        // Use Fluent UI Slider component with Field for consistent layout
        const sliderWrapper = doc.createElement('div');
        sliderWrapper.setAttribute('data-field-id', field.id);

        const SliderWrapper = () => {
          const [sliderValue, setSliderValue] = React.useState(field.value || 0);
          const sliderId = React.useId();

          return React.createElement(Field, {
            label: field.label,
            required: field.required,
            hint: field.tooltip,
            orientation: field.orientation || 'horizontal',
            style: { marginBottom: '8px' }
          },
            React.createElement('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%'
              }
            },
              React.createElement(Slider, {
                id: sliderId,
                value: sliderValue,
                min: Number(field.extraAttributes?.min) || 0,
                max: Number(field.extraAttributes?.max) || 100,
                step: Number(field.extraAttributes?.step) || 1,
                onChange: (_: any, data: { value: number }) => {
                  setSliderValue(data.value);
                  field.value = data.value;
                  this.fieldValues.set(field.id, data.value);
                  this.updateFieldVisibility(field.id);
                  this.updateButtonStates();
                  
                  // Call user's onChange callback if provided
                  if (field.onChange) {
                    field.onChange(data.value);
                  }
                },
                style: { flex: 1 }
              }),
              field.showValue && React.createElement('span', {
                style: {
                  minWidth: '40px',
                  textAlign: 'right',
                  fontSize: '14px',
                  color: '#323130'
                }
              }, String(sliderValue))
            )
          );
        };

        mountFluentComponent(sliderWrapper, React.createElement(SliderWrapper), defaultTheme);
        container.appendChild(sliderWrapper);

        this.fieldValues.set(field.id, field.value || 0);

        return container;
      default:
        // Use Fluent UI Input component for native Dynamics look
        const inputWrapper = doc.createElement('div');
        inputWrapper.setAttribute('data-field-id', field.id);

        // Create input component with underline appearance
        const InputWrapper = () => {
          const [inputValue, setInputValue] = React.useState(field.value || '');
          const [validationState, setValidationState] = React.useState<'error' | 'none'>('none');
          const [validationMessage, setValidationMessage] = React.useState<string>('');
          const [touched, setTouched] = React.useState(false);

          // Store setter for external updates
          React.useEffect(() => {
            this.fieldSetters.set(field.id, setInputValue);
            return () => { this.fieldSetters.delete(field.id); };
          }, []);

          const validateField = (value: any, showError: boolean = true) => {
            const isRequired = this.fieldRequiredMap.get(field.id) || false;
            const isEmpty = !value || value === '' || (Array.isArray(value) && value.length === 0);
            
            // Check if required field is empty
            if (isRequired && isEmpty) {
              this.fieldValidationErrors.set(field.id, 'Required field is empty');
              if (showError && touched) {
                setValidationState('error');
                setValidationMessage('This field is required');
              }
              return;
            }
            
            // Format validation for specific field types (only if not empty)
            if (!isEmpty && value) {
              const fieldType = field.type || 'text';
              
              // Email validation
              if (fieldType === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(String(value))) {
                  this.fieldValidationErrors.set(field.id, 'Invalid email format');
                  if (showError && touched) {
                    setValidationState('error');
                    setValidationMessage('Please enter a valid email address');
                  }
                  return;
                }
              }
              
              // URL validation
              if (fieldType === 'url') {
                try {
                  new URL(String(value));
                } catch {
                  this.fieldValidationErrors.set(field.id, 'Invalid URL format');
                  if (showError && touched) {
                    setValidationState('error');
                    setValidationMessage('Please enter a valid URL (e.g., https://example.com)');
                  }
                  return;
                }
              }
              
              // Phone validation (flexible - allows various formats)
              if (fieldType === 'tel') {
                const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
                const digitCount = String(value).replace(/\D/g, '').length;
                if (!phoneRegex.test(String(value)) || digitCount < 7) {
                  this.fieldValidationErrors.set(field.id, 'Invalid phone format');
                  if (showError && touched) {
                    setValidationState('error');
                    setValidationMessage('Please enter a valid phone number');
                  }
                  return;
                }
              }
            }
            
            // All validations passed
            this.fieldValidationErrors.delete(field.id);
            setValidationState('none');
            setValidationMessage('');
          };

          // Validate on mount (without showing error)
          React.useEffect(() => {
            validateField(inputValue, false);
          }, []);

          return React.createElement(InputFluentUi, {
            id: field.id,
            label: field.label,
            type: (field.type || 'text') as 'text' | 'number' | 'email' | 'tel' | 'password' | 'url' | 'search',
            value: inputValue,
            placeholder: field.placeholder || '---',
            required: field.required || false,
            disabled: field.disabled || false,
            readOnly: field.readOnly || false,
            rows: field.rows || 3,
            tooltip: field.tooltip,
            appearance: 'filled-darker' as const,
            orientation: field.orientation || 'horizontal',
            validationState: validationState,
            validationMessage: validationMessage,
            onChange: (value: string | number) => {
              console.debug(...UILIB, `[Field ${field.id}] onChange triggered with value:`, value, `(type: ${typeof value})`);
              setTouched(true);
              setInputValue(value);
              this.fieldValues.set(field.id, value);
              field.value = value;
              validateField(value, true);
              this.updateFieldVisibility(field.id);
              console.debug(...UILIB, `[Field ${field.id}] Calling updateButtonStates...`);
              this.updateButtonStates();
              
              // Call user's onChange callback if provided
              if (field.onChange) {
                field.onChange(value);
              }
            },
            onFocus: () => {
              setTouched(true);
            },
            onBlur: () => {
              validateField(inputValue, true);
            }
          });
        };

        mountFluentComponent(inputWrapper, React.createElement(InputWrapper), defaultTheme);
        container.appendChild(inputWrapper);

        // Store initial value
        this.fieldValues.set(field.id, field.value || '');

        return container;
    }
  }

  private evaluateVisibilityCondition(condition: { field: string; operator?: string; value?: any }): boolean {
    const fieldValue = this.fieldValues.get(condition.field);
    const operator = condition.operator || 'equals';

    switch (operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'notEquals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'greaterThan':
        return Number(fieldValue) > Number(condition.value);
      case 'lessThan':
        return Number(fieldValue) < Number(condition.value);
      case 'truthy':
        return !!fieldValue;
      case 'falsy':
        return !fieldValue;
      default:
        return true;
    }
  }

  private updateFieldVisibility(changedFieldId: string): void {
    // Find all fields that have visibility conditions
    const allFields = this.getAllFields();

    allFields.forEach(field => {
      if (field.visibleWhen && field.visibleWhen.field === changedFieldId) {
        const shouldBeVisible = this.evaluateVisibilityCondition(field.visibleWhen);
        const currentlyVisible = this.fieldVisibilityMap.get(field.id);

        if (shouldBeVisible !== currentlyVisible) {
          this.fieldVisibilityMap.set(field.id, shouldBeVisible);
          const fieldEl = this.body?.querySelector(`[data-field-id="${field.id}"]`) as HTMLElement;
          if (fieldEl) {
            fieldEl.style.display = shouldBeVisible ? '' : 'none';
          }
        }
      }

      // Check requiredWhen conditions
      if (field.requiredWhen && field.requiredWhen.field === changedFieldId) {
        const shouldBeRequired = this.evaluateVisibilityCondition(field.requiredWhen);
        const currentlyRequired = this.fieldRequiredMap.get(field.id);

        if (shouldBeRequired !== currentlyRequired) {
          this.fieldRequiredMap.set(field.id, shouldBeRequired);
          const fieldEl = this.body?.querySelector(`[data-field-id="${field.id}"]`) as HTMLElement;
          if (fieldEl) {
            const label = fieldEl.querySelector('.err403-field-label, label[for]');
            if (label) {
              if (shouldBeRequired) {
                label.classList.add('required');
              } else {
                label.classList.remove('required');
              }
            }
          }
        }
      }
    });
    
    // Update step indicator if we're in a wizard (validation status may have changed)
    if (this.options.progress?.enabled) {
      this.updateStepIndicator();
    }
  }

  private getAllFields(): FieldConfig[] {
    const fields: FieldConfig[] = [];

    // Get fields from regular modal
    if (this.options.fields) {
      fields.push(...this.options.fields);
    }

    // Get fields from wizard steps
    if (this.options.progress?.steps) {
      this.options.progress.steps.forEach(step => {
        if (step.fields) {
          fields.push(...step.fields);
        }
      });
    }

    return fields;
  }

  private createFooter(): void {
    const doc = getTargetDocument();
    this.footer = doc.createElement('div');

    const alignment = this.options.buttonAlignment || 'right';
    const justifyContent = alignment === 'space-between' ? 'space-between' :
      alignment === 'center' ? 'center' :
        alignment === 'left' ? 'flex-start' : 'flex-end';

    // Fluent UI v9 DialogActions styling
    this.footer.style.cssText = `
      padding: 20px;
      padding-top: 12px;
      border-top: none;
      background: #ffffff;
      display: flex;
      justify-content: ${justifyContent};
      gap: 8px;
      flex-shrink: 0;
    `;

    if (this.options.buttons && this.options.buttons.length > 0) {
      this.options.buttons.forEach((btn) => {
        const button = this.createButton(btn);
        this.buttonElements.set(btn, button);
        this.footer!.appendChild(button);
      });
    }

    // Initial button state check
    this.updateButtonStates();

    this.modal!.appendChild(this.footer);
  }

  /**
   * Update button states based on validation requirements
   * Disables buttons with requiresValidation=true when required fields are invalid
   * 
   * For wizards:
   * - Default behavior (requiresValidation: true): validates ALL steps
   * - To validate only current step: set validateAllSteps: false explicitly
   * 
   * Debounced to prevent validation storms from rapid field updates
   */
  private updateButtonStates(): void {
    // Clear existing timer
    if (this.updateButtonStatesTimer !== null) {
      clearTimeout(this.updateButtonStatesTimer);
    }

    // Debounce validation by 50ms to prevent storms from rapid updates
    this.updateButtonStatesTimer = window.setTimeout(() => {
      this.executeButtonStateUpdate();
      this.updateButtonStatesTimer = null;
    }, 50);
  }

  /**
   * Execute the actual button state update logic
   */
  private executeButtonStateUpdate(): void {
    if (!this.options.buttons || this.options.buttons.length === 0) return;

    this.options.buttons.forEach((btn) => {
      if (!btn.requiresValidation) return;

      // Use React state setter instead of DOM manipulation
      const setDisabled = this.buttonDisabledSetters.get(btn);
      if (!setDisabled) return;

      // Check if all required fields are valid
      let isValid = true;

      if (this.options.progress?.enabled && this.options.progress.steps) {
        // For wizard: default is to validate ALL steps
        // Set validateAllSteps: false explicitly to only validate current step
        const shouldValidateAllSteps = btn.validateAllSteps !== false; // Default to true
        
        if (shouldValidateAllSteps) {
          // Validate ALL steps (default for wizards with requiresValidation)
          isValid = this.options.progress.steps.every((_, index) => {
            const stepValid = this.validateStep(index);
            console.debug(...UILIB, `[updateButtonStates] Step ${index + 1} validation:`, stepValid);
            return stepValid;
          });
          console.debug(...UILIB, `[updateButtonStates] ${btn.label} button validation result (all steps):`, isValid);
        } else {
          // Validate only current step (when validateAllSteps: false)
          isValid = this.validateStep(this.currentStep - 1);
          console.debug(...UILIB, `[updateButtonStates] ${btn.label} button validation result (current step only):`, isValid);
        }
      } else if (this.options.fields) {
        // For regular modal: validate all fields
        isValid = this.validateAllFields();
        console.debug(...UILIB, `[updateButtonStates] ${btn.label} button validation result (all fields):`, isValid);
      }

      console.debug(...UILIB, `[updateButtonStates] Setting ${btn.label} button disabled state to:`, !isValid);
      setDisabled(!isValid); // Set React state, which updates Fluent UI Button's disabled prop
    });
  }

  /**
   * Validate all fields in the modal (non-wizard)
   */
  validateAllFields(): boolean {
    if (!this.options.fields) return true;

    for (const field of this.options.fields) {
      // Skip hidden fields
      if (field.visibleWhen) {
        const isVisible = this.evaluateVisibilityCondition(field.visibleWhen);
        if (!isVisible) continue;
      }

      // Determine if field is required
      let isRequired = false;
      
      if (field.requiredWhen) {
        isRequired = this.evaluateVisibilityCondition(field.requiredWhen);
      } else {
        isRequired = field.required || false;
      }

      if (isRequired) {
        const value = this.getFieldValue(field.id);
        // Empty values: null, undefined, empty string, empty array
        if (value === null || value === undefined || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          return false;
        }
      }
    }

    return true;
  }

  private createButton(btn: ModalButton): HTMLElement {
    const doc = getTargetDocument();
    const buttonContainer = doc.createElement('div');

    const isPrimary = btn.setFocus;
    
    // Determine button appearance
    // isDestructive takes precedence and shows red warning style
    let appearance: 'primary' | 'secondary' | 'outline' = isPrimary ? 'primary' : 'secondary';
    
    // Additional styling for destructive buttons (red)
    const buttonStyle: React.CSSProperties = { minWidth: '96px' };
    if (btn.isDestructive) {
      buttonStyle.backgroundColor = '#d13438';
      buttonStyle.color = '#ffffff';
      buttonStyle.borderColor = '#d13438';
    }

    // Use state for disabled to allow dynamic updates
    const ButtonWrapper = () => {
      const [isDisabled, setIsDisabled] = React.useState(false);

      // Store setter for external updates
      React.useEffect(() => {
        this.buttonDisabledSetters.set(btn, setIsDisabled);
        return () => { this.buttonDisabledSetters.delete(btn); };
      }, []);

      return React.createElement(Button, {
        appearance: appearance,
        disabled: isDisabled,
        onClick: async () => {
          const result = await btn.callback();

          if (result !== false && !btn.preventClose) {
            if (this.resolvePromise) {
              this.resolvePromise({ button: btn, data: this.getFieldValues() });
            }
            this.close();
          }
        },
        children: btn.label,
        style: buttonStyle
      });
    };

    // Mount the Fluent UI button
    mountFluentComponent(buttonContainer, React.createElement(ButtonWrapper), defaultTheme);

    if (btn.setFocus) {
      setTimeout(() => {
        const fluentButton = buttonContainer.querySelector('button');
        if (fluentButton) fluentButton.focus();
      }, 100);
    }

    return buttonContainer;
  }

  private startDrag(e: MouseEvent): void {
    if (!this.options.draggable || !this.container) return;

    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;

    const rect = this.container.getBoundingClientRect();
    this.modalStartX = rect.left;
    this.modalStartY = rect.top;

    const doc = getTargetDocument();
    doc.addEventListener('mousemove', this.handleDrag);
    doc.addEventListener('mouseup', this.stopDrag);

    e.preventDefault();
  }

  private handleDrag = (e: MouseEvent): void => {
    if (!this.isDragging || !this.container) return;

    const deltaX = e.clientX - this.dragStartX;
    const deltaY = e.clientY - this.dragStartY;

    const newX = this.modalStartX + deltaX;
    const newY = this.modalStartY + deltaY;

    this.container.style.transform = 'none';
    this.container.style.left = `${newX}px`;
    this.container.style.top = `${newY}px`;
    this.container.style.margin = '0';
  };

  private stopDrag = (): void => {
    this.isDragging = false;

    const doc = getTargetDocument();
    doc.removeEventListener('mousemove', this.handleDrag);
    doc.removeEventListener('mouseup', this.stopDrag);
  };

  private handleEscapeKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.options.allowEscapeClose) {
      this.close();
    }
  };

  private toggleFullscreen(iconContainer: HTMLElement): void {
    if (!this.modal || !this.container) return;

    this.isFullscreen = !this.isFullscreen;

    if (this.isFullscreen) {
      // Fullscreen mode
      this.modal.style.width = '100vw';
      this.modal.style.height = '100vh';
      this.modal.style.maxWidth = '100vw';
      this.modal.style.maxHeight = '100vh';
      this.modal.style.borderRadius = '0';
      this.container.style.top = '0';
      this.container.style.left = '0';
      this.container.style.transform = 'none';

      // Update icon to minimize
      const MinimizeIcon = React.createElement(FullScreenMinimizeRegular);
      iconContainer.innerHTML = '';
      mountFluentComponent(iconContainer, MinimizeIcon, defaultTheme);
    } else {
      // Restore normal mode
      const { width, height } = this.getModalDimensions();
      const formatSize = (value: number | string | null | undefined): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        return `${value}px`;
      };

      this.modal.style.width = formatSize(width);
      this.modal.style.height = height ? formatSize(height) : '';
      this.modal.style.maxWidth = '95vw';
      this.modal.style.maxHeight = '90vh';
      this.modal.style.borderRadius = '8px';
      this.container.style.top = '50%';
      this.container.style.left = '50%';
      this.container.style.transform = 'translate(-50%, -50%)';

      // Update icon to maximize
      const MaximizeIcon = React.createElement(FullScreenMaximizeRegular);
      iconContainer.innerHTML = '';
      mountFluentComponent(iconContainer, MaximizeIcon, defaultTheme);
    }
  }

  async show(): Promise<void> {
    // Wait for modal initialization to complete before showing
    await this.initPromise;

    console.debug(...UILIB, 'Modal.show()', {
      version: PACKAGE_VERSION,
      title: this.options.title,
      size: this.options.size,
      icon: this.options.icon,
      fieldsCount: this.options.fields?.length || 0,
      buttonsCount: this.options.buttons?.length || 0,
      draggable: this.options.draggable,
      hasSideCart: this.options.sideCart?.enabled
    });

    const doc = getTargetDocument();
    if (this.overlay && this.container) {
      doc.body.appendChild(this.overlay);
      doc.body.appendChild(this.container);
      doc.body.style.overflow = 'hidden';
      this.log('Modal displayed');

      // Force a reflow immediately after appending to DOM
      // This helps Griffel detect that components are now in live DOM
      void this.container.offsetHeight;

      // Execute pending React mounts now that modal is in DOM
      if (this.pendingReactMounts.length > 0) {
        this.log('Executing', this.pendingReactMounts.length, 'pending React mounts');
        this.pendingReactMounts.forEach(mountFn => mountFn());
        this.pendingReactMounts = [];
      }
      
      // CRITICAL: Always add delay after modal is in DOM, not just for pending mounts
      // This ensures Griffel CSS-in-JS has time to inject styles for ALL components
      // including buttons which are mounted during initialization (while detached)
      // Without this, buttons can render unstyled because Griffel needs time to:
      // 1. Detect the component is now in live DOM
      // 2. Inject the CSS rules into the document
      // 3. Apply the styles to the elements
      await new Promise(resolve => setTimeout(resolve, 10));
    } else {
      console.error('[Modal] Failed to display: overlay or container is null');
    }
  }

  async showAsync(): Promise<ModalResponse> {
    return new Promise(async (resolve) => {
      this.resolvePromise = resolve;
      await this.show();
    });
  }

  close(): void {
    const doc = getTargetDocument();

    doc.removeEventListener('keydown', this.handleEscapeKey);
    doc.removeEventListener('mousemove', this.handleDrag);
    doc.removeEventListener('mouseup', this.stopDrag);

    // Apply smooth fade-out animations with fill-mode to maintain final state
    if (this.modal) {
      this.modal.style.animation = 'fadeOutScale 0.3s cubic-bezier(0.33, 0, 0.67, 1) forwards';
    }
    if (this.overlay) {
      this.overlay.style.animation = 'fadeOut 0.3s cubic-bezier(0.33, 0, 0.67, 1) forwards';
    }

    // Use animationend event for reliable cleanup timing
    const handleAnimationEnd = () => {
      if (this.container?.parentElement) {
        this.container.parentElement.removeChild(this.container);
      }
      if (this.overlay?.parentElement) {
        this.overlay.parentElement.removeChild(this.overlay);
      }
      doc.body.style.overflow = '';
    };

    // Listen for animation end on modal (primary element)
    if (this.modal) {
      this.modal.addEventListener('animationend', handleAnimationEnd, { once: true });
    }

    // Fallback timeout in case animationend doesn't fire
    setTimeout(() => {
      if (this.container?.parentElement || this.overlay?.parentElement) {
        handleAnimationEnd();
      }
    }, 350); // Slightly longer than animation duration
  }

  setLoading(loading: boolean, options?: string | { message?: string; progress?: number }): void {
    const doc = getTargetDocument();

    if (loading) {
      // Parse options
      let message: string | undefined;
      let progress: number | undefined;
      
      if (typeof options === 'string') {
        message = options;
      } else if (options && typeof options === 'object') {
        message = options.message;
        progress = options.progress;
      }

      // Create or update loading overlay
      if (!this.loadingOverlay && this.modal) {
        this.loadingOverlay = doc.createElement('div');
        this.loadingOverlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.95);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          z-index: 10;
          border-radius: 8px;
        `;

        this.modal.appendChild(this.loadingOverlay);
      }

      // Clear existing content
      if (this.loadingOverlay) {
        this.loadingOverlay.innerHTML = '';

        // Show spinner or progress bar
        if (progress !== undefined && progress >= 0 && progress <= 100) {
          // Progress bar container
          const progressContainer = doc.createElement('div');
          progressContainer.style.cssText = `
            width: 300px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: center;
          `;

          // Progress bar background
          const progressBar = doc.createElement('div');
          progressBar.style.cssText = `
            width: 100%;
            height: 8px;
            background: ${theme.colors.modal.divider};
            border-radius: 4px;
            overflow: hidden;
            position: relative;
          `;

          // Progress bar fill
          const progressFill = doc.createElement('div');
          progressFill.style.cssText = `
            height: 100%;
            width: ${progress}%;
            background: ${theme.colors.modal.primary};
            border-radius: 4px;
            transition: width 0.3s ease;
          `;
          progressFill.setAttribute('data-progress-fill', 'true');

          progressBar.appendChild(progressFill);
          progressContainer.appendChild(progressBar);

          // Progress percentage text
          const progressText = doc.createElement('div');
          progressText.textContent = `${Math.round(progress)}%`;
          progressText.style.cssText = `
            color: ${theme.colors.modal.text};
            font-size: ${theme.typography.fontSize.subtitle};
            font-weight: 600;
          `;
          progressText.setAttribute('data-progress-text', 'true');
          progressContainer.appendChild(progressText);

          this.loadingOverlay.appendChild(progressContainer);
        } else {
          // Spinner (default)
          const spinner = doc.createElement('div');
          spinner.style.cssText = `
            width: 48px;
            height: 48px;
            border: 4px solid ${theme.colors.modal.divider};
            border-top-color: ${theme.colors.modal.primary};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          `;
          this.loadingOverlay.appendChild(spinner);
        }

        // Message
        if (message) {
          const messageEl = doc.createElement('div');
          messageEl.textContent = message;
          messageEl.style.cssText = `
            color: ${theme.colors.modal.text};
            font-size: ${theme.typography.fontSize.body};
            text-align: center;
            max-width: 400px;
          `;
          messageEl.setAttribute('data-loading-message', 'true');
          this.loadingOverlay.appendChild(messageEl);
        }
      }
    } else {
      if (this.loadingOverlay?.parentElement) {
        this.loadingOverlay.parentElement.removeChild(this.loadingOverlay);
        this.loadingOverlay = null;
      }
    }
  }

  updateProgress(step: number, _skipValidation?: boolean): void {
    if (step < 1 || step > this.totalSteps) return;

    this.currentStep = step;

    // Show/hide step panels
    this.stepPanels.forEach((panel, index) => {
      panel.style.display = index + 1 === step ? 'flex' : 'none';
    });

    // Apply step-specific width/height if defined
    if (this.modal && this.options.progress?.steps) {
      const currentStepConfig = this.options.progress.steps[step - 1];
      if (currentStepConfig) {
        // Extract width/height from size object if provided (same as modal constructor)
        let stepWidth = currentStepConfig.width;
        let stepHeight = currentStepConfig.height;
        
        // Check if size is an object with width/height properties
        if (typeof (currentStepConfig as any).size === 'object' && (currentStepConfig as any).size !== null) {
          const sizeObj = (currentStepConfig as any).size;
          if (sizeObj.width !== undefined) {
            stepWidth = sizeObj.width;
          }
          if (sizeObj.height !== undefined) {
            stepHeight = sizeObj.height;
          }
        }
        
        // Apply step-specific width
        if (stepWidth !== undefined) {
          const width = typeof stepWidth === 'number' 
            ? `${stepWidth}px` 
            : stepWidth;
          this.modal.style.width = width;
        }
        
        // Apply step-specific height
        if (stepHeight !== undefined) {
          const height = typeof stepHeight === 'number' 
            ? `${stepHeight}px` 
            : stepHeight;
          this.modal.style.height = height;
        }
      }
    }

    // Update step indicator
    this.updateStepIndicator();
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateProgress(this.currentStep);
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgress(this.currentStep);
    }
  }

  goToStep(stepId: string): void {
    const step = parseInt(stepId, 10);
    if (!isNaN(step)) {
      this.updateProgress(step);
    }
  }

  /**
   * Validate if a step has all required fields filled
   */
  private validateStep(stepIndex: number): boolean {
    if (!this.options.progress?.steps) return true;
    
    const step = this.options.progress.steps[stepIndex];
    if (!step?.fields) return true;

    console.debug(...UILIB, `[validateStep] Validating step ${stepIndex + 1}:`, step.label || step.id);

    // Recursive function to validate fields (including all nested structures: groups, tabs, etc.)
    const validateFields = (fields: FieldConfig[], depth: number = 0): boolean => {
      const indent = '  '.repeat(depth);
      
      for (const field of fields) {
        console.debug(...UILIB, `${indent}[validateStep] Checking field:`, field.id, `type: ${field.type}`);
        
        // Skip hidden fields - if visibleWhen is false, don't validate
        if (field.visibleWhen) {
          const isVisible = this.evaluateVisibilityCondition(field.visibleWhen);
          console.debug(...UILIB, `${indent}[validateStep] Field ${field.id} visibleWhen:`, field.visibleWhen, `result: ${isVisible}`);
          if (!isVisible) {
            console.debug(...UILIB, `${indent}[validateStep] Field ${field.id} is hidden, skipping`);
            continue; // Skip this field
          }
        }

        // If this field contains nested fields (group, tabs, or any container), recursively validate
        if (field.fields && field.fields.length > 0) {
          console.debug(...UILIB, `${indent}[validateStep] Field ${field.id} has ${field.fields.length} nested fields`);
          if (!validateFields(field.fields, depth + 1)) {
            console.debug(...UILIB, `${indent}[validateStep] Nested field validation failed for ${field.id}`);
            return false;
          }
          // If this is just a container (group, tabs), don't validate the container itself
          if (field.type === 'group' || field.asTabs) {
            console.debug(...UILIB, `${indent}[validateStep] Field ${field.id} is container, skipping self-validation`);
            continue;
          }
        }

        // Determine if field is required
        let isRequired = false;
        
        // If requiredWhen is specified, use that condition
        if (field.requiredWhen) {
          isRequired = this.evaluateVisibilityCondition(field.requiredWhen);
          console.debug(...UILIB, `${indent}[validateStep] Field ${field.id} requiredWhen:`, field.requiredWhen, `result: ${isRequired}`);
        } else {
          // Otherwise use the static required property
          isRequired = field.required || false;
          console.debug(...UILIB, `${indent}[validateStep] Field ${field.id} static required: ${isRequired}`);
        }

        if (isRequired) {
          const value = this.getFieldValue(field.id);
          console.debug(...UILIB, `${indent}[validateStep] Field ${field.id} is required, value:`, value, `(type: ${typeof value})`);
          
          // Empty values: null, undefined, empty string, empty array
          if (value === null || value === undefined || value === '' || 
              (Array.isArray(value) && value.length === 0)) {
            console.debug(...UILIB, `${indent}[validateStep] ❌ Field ${field.id} is EMPTY and required!`);
            return false;
          }
          console.debug(...UILIB, `${indent}[validateStep] ✅ Field ${field.id} has value`);
        }
      }
      return true;
    };

    const result = validateFields(step.fields);
    console.debug(...UILIB, `[validateStep] Step ${stepIndex + 1} validation result:`, result);
    return result;
  }

  /**
   * Get list of missing required fields for a step
   */
  private getMissingRequiredFields(stepIndex: number): string[] {
    if (!this.options.progress?.steps) return [];
    
    const step = this.options.progress.steps[stepIndex];
    if (!step?.fields) return [];

    const missingFields: string[] = [];

    // Recursive function to collect missing fields (including all nested structures: groups, tabs, etc.)
    const collectMissingFields = (fields: FieldConfig[]) => {
      for (const field of fields) {
        // Skip hidden fields
        if (field.visibleWhen) {
          const isVisible = this.evaluateVisibilityCondition(field.visibleWhen);
          if (!isVisible) continue;
        }

        // If this field contains nested fields (group, tabs, or any container), recursively check
        if (field.fields && field.fields.length > 0) {
          collectMissingFields(field.fields);
          // If this is just a container (group, tabs), don't validate the container itself
          if (field.type === 'group' || field.asTabs) {
            continue;
          }
        }

        // Determine if field is required
        let isRequired = false;
        if (field.requiredWhen) {
          isRequired = this.evaluateVisibilityCondition(field.requiredWhen);
        } else {
          isRequired = field.required || false;
        }

        if (isRequired) {
          const value = this.getFieldValue(field.id);
          if (value === null || value === undefined || value === '' || 
              (Array.isArray(value) && value.length === 0)) {
            missingFields.push(field.label || field.id);
          }
        }
      }
    };

    collectMissingFields(step.fields);
    return missingFields;
  }

  getFieldValue(fieldId: string): any {
    const value = this.fieldValues.get(fieldId);
    // If it's a Table instance, get the selected rows
    if (value && typeof value === 'object' && 'getValue' in value) {
      return value.getValue();
    }
    return value;
  }

  getFieldValues(): Record<string, any> {
    const values: Record<string, any> = {};
    this.fieldValues.forEach((value, key) => {
      // If it's a Table instance, get the selected rows
      if (value && typeof value === 'object' && 'getValue' in value) {
        values[key] = value.getValue();
      } else {
        values[key] = value;
      }
    });
    return values;
  }

  setFieldValue(fieldId: string, value: any): void {
    const existingValue = this.fieldValues.get(fieldId);

    // If it's a Table instance, use its setValue method
    if (existingValue && typeof existingValue === 'object' && 'setValue' in existingValue) {
      existingValue.setValue(value);
      return;
    }

    // Handle table data updates
    const updateDataFn = this.fieldValues.get(fieldId + '_updateData');
    if (typeof updateDataFn === 'function') {
      updateDataFn(value);
      return;
    }

    // Update internal value map
    this.fieldValues.set(fieldId, value);

    // Use React state setter if available (for Fluent UI components)
    const setter = this.fieldSetters.get(fieldId);
    if (setter) {
      setter(value);
      return;
    }

    // Fallback: Update the actual DOM element for non-React fields
    const element = this.getElement(`[data-field-id="${fieldId}"]`);
    if (element && element instanceof HTMLElement) {
      const input = element.querySelector('input, textarea, select') as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (input) {
        if (input instanceof HTMLInputElement && (input.type === 'checkbox' || input.type === 'radio')) {
          input.checked = !!value;
        } else if (input instanceof HTMLSelectElement) {
          input.value = String(value);
        } else {
          input.value = value != null ? String(value) : '';
        }
        // Trigger change event
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Update button states based on new field value
    this.updateButtonStates();
  }

  validateCurrentStep(): boolean {
    if (this.options.progress?.steps) {
      return this.validateStep(this.currentStep - 1);
    }
    return this.validateAllFields();
  }

  updateSideCart(_content: string | { imageUrl: string }): void {
    // Not implemented
  }

  clearAutoSave(): void {
    // Not implemented
  }

  getElement(selector?: string): HTMLElement | HTMLElement[] | null {
    if (!selector) return this.modal;
    if (this.modal) {
      const elements = this.modal.querySelectorAll(selector);
      return elements.length === 1 ? elements[0] as HTMLElement : Array.from(elements) as HTMLElement[];
    }
    return null;
  }

  /**
   * Get button by id, label, or index with chainable methods
   * @param idLabelOrIndex - Button id (string), label (string), or index (number, 0-based)
   * @returns Chainable button controller or null if not found
   */
  getButton(idLabelOrIndex: string | number): ButtonController | null {
    if (!this.options.buttons || this.options.buttons.length === 0) return null;

    let button: ModalButton | undefined;

    if (typeof idLabelOrIndex === 'number') {
      // Index-based lookup
      button = this.options.buttons[idLabelOrIndex];
    } else {
      // String: try ID first, then label
      button = this.options.buttons.find(btn => btn.id === idLabelOrIndex);
      if (!button) {
        button = this.options.buttons.find(btn => btn.label === idLabelOrIndex);
      }
    }

    if (!button) return null;

    return new ButtonController(button, this.buttonElements);
  }

  title(title: string): this {
    this.options.title = title;
    if (this.header) {
      const titleEl = this.header.querySelector('h2');
      if (titleEl) titleEl.textContent = title;
    }
    return this;
  }

  message(message: string): this {
    this.options.message = message;
    return this;
  }

  content(content: string): this {
    this.options.content = content;
    return this;
  }

  width(width: number): this {
    this.options.width = width;
    if (this.modal) {
      this.modal.style.width = `${width}px`;
    }
    return this;
  }

  height(height: number): this {
    this.options.height = height;
    if (this.modal) {
      this.modal.style.height = `${height}px`;
    }
    return this;
  }

  static open(options: ModalOptions): Modal {
    const modal = new Modal(options);
    modal.show();
    return modal;
  }

  static alert(title: string, message: string, options?: Partial<ModalOptions>): Promise<void> {
    return new Promise((resolve) => {
      Modal.open({
        title,
        message,
        size: 'small',
        ...options,
        buttons: [
          new ModalButton('OK', () => {
            resolve();
          }, true)
        ]
      });
    });
  }

  static confirm(title: string, message: string, options?: Partial<ModalOptions>): Promise<boolean> {
    return new Promise((resolve) => {
      Modal.open({
        title,
        message,
        size: 'small',
        ...options,
        buttons: [
          new ModalButton('Cancel', () => {
            resolve(false);
          }),
          new ModalButton('OK', () => {
            resolve(true);
          }, true)
        ]
      });
    });
  }

  static async openQueryBuilder(options: QueryBuilderOpenOptions): Promise<QueryBuilderOpenResult> {
    const startTime = performance.now();
    const entityName = options?.entityName;

    if (!entityName || !entityName.trim()) {
      return {
        opened: false,
        reason: 'error',
        elapsedMs: Math.round(performance.now() - startTime),
        error: 'entityName is required for openQueryBuilder.'
      };
    }

    const host = getTargetDocument().createElement('div');
    let latestPayload: QueryBuilderApplyResult | undefined;
    const root = mountFluentComponent(
      host,
      React.createElement(
        FluentProvider,
        { theme: webLightTheme },
        React.createElement(QueryBuilder, {
          ...options,
          onSerializedChange: (result: QueryBuilderApplyResult) => {
            latestPayload = result;
          },
        })
      ),
      defaultTheme,
    );

    return new Promise((resolve) => {
      let settled = false;
      const complete = (result: QueryBuilderOpenResult): void => {
        if (settled) {
          return;
        }

        settled = true;
        try {
          unmountFluentComponent(root);
        } catch {
          // no-op
        }

        resolve(result);
      };

      Modal.open({
        title: options.title || 'Query Builder',
        customContent: host,
        size: 'large',
        width: options.width || 960,
        height: options.height || 640,
        preventClose: true,
        allowDismiss: false,
        allowEscapeClose: false,
        buttons: [
          new ModalButton({
            label: options.cancelButtonText || 'Cancel',
            id: 'queryBuilderCancel',
            callback: () => {
              options.onCancel?.();
              complete({
                opened: false,
                reason: 'cancelled',
                elapsedMs: Math.round(performance.now() - startTime),
              });
            },
          }),
          new ModalButton({
            label: options.applyButtonText || 'Apply',
            id: 'queryBuilderApply',
            setFocus: true,
            callback: async () => {
              try {
                if (!latestPayload) {
                  complete({
                    opened: false,
                    reason: 'error',
                    elapsedMs: Math.round(performance.now() - startTime),
                    error: 'Query builder is not ready yet.',
                  });
                  return;
                }

                await options.onApply?.(latestPayload);
                complete({
                  opened: true,
                  reason: 'applied',
                  elapsedMs: Math.round(performance.now() - startTime),
                  result: latestPayload,
                });
              } catch (error) {
                complete({
                  opened: false,
                  reason: 'error',
                  elapsedMs: Math.round(performance.now() - startTime),
                  error: error instanceof Error ? error.message : String(error),
                });
              }
            },
          }),
        ],
      });
    });
  }

  /**
   * Show a D365 web resource in the modal
   * @param webResourcePath - Path to the web resource (e.g., 'abdg_/html/datagrid.htm?data=ProductQuotedHistory&id=123')
   * @param options - Options for webresource display (optional)
   */
  showWebResource(webResourcePath: string, options?: { 
    autoResize?: boolean; 
    width?: number | string; 
    height?: number | string; 
    size?: 'small' | 'medium' | 'large' | 'fullscreen' 
  }): void {
    const doc = getTargetDocument();

    if (!this.body) return;

    // Apply size options if provided, or use defaults for webresource
    let newWidth = this.options.width;
    let newHeight = this.options.height;

    if (options?.size || options?.width || options?.height || !newHeight) {
      if (options?.size) {
        const sizeMap: Record<string, { width: number; height: number | null }> = {
          small: { width: 400, height: 400 },
          medium: { width: 600, height: 500 },
          large: { width: 900, height: 700 },
          fullscreen: { width: window.innerWidth * 0.95, height: window.innerHeight * 0.9 }
        };
        const sizeDims = sizeMap[options.size];
        newWidth = sizeDims.width;
        newHeight = sizeDims.height || undefined;
      }

      if (options?.width) newWidth = options.width;
      if (options?.height) newHeight = options.height;

      // Default size for webresource if no height specified
      if (!newHeight) {
        newWidth = newWidth || 800;
        newHeight = 600;
      }

      // Helper function to format size value
      const formatSize = (value: number | string | undefined): string => {
        if (typeof value === 'string') {
          return value; // Already formatted (e.g., "80%", "800px", "80vh")
        }
        return `${value}px`; // Convert number to px
      };

      // Update modal dimensions
      if (newWidth && this.modal) {
        this.modal.style.width = formatSize(newWidth);
        this.options.width = typeof newWidth === 'number' ? newWidth : undefined;
      }
      if (newHeight && this.modal) {
        this.modal.style.height = formatSize(newHeight);
        this.modal.style.maxHeight = '90vh';
        this.options.height = typeof newHeight === 'number' ? newHeight : undefined;
      }
    }

    // Clear existing body content
    this.body.innerHTML = '';

    // Reset body styling for iframe with important to override existing styles
    this.body.style.cssText = `
      flex: 1 1 0% !important;
      overflow: hidden !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #ffffff !important;
      display: flex !important;
      flex-direction: column !important;
    `;

    // Create iframe
    const iframe = doc.createElement('iframe');
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    `;

    // Construct the full URL for the web resource
    const baseUrl = window.location.origin;
    const fullUrl = webResourcePath.startsWith('http')
      ? webResourcePath
      : `${baseUrl}/WebResources/${webResourcePath}`;

    iframe.src = fullUrl;

    // Auto-resize functionality - disabled when any height is specified
    const hasExplicitHeight = options?.height !== undefined;
    const shouldAutoResize = options?.autoResize === true && !hasExplicitHeight;
    
    if (shouldAutoResize) {
      iframe.onload = () => {
        try {
          // Try to access iframe content (will fail if cross-origin)
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            // Wait for content to load
            setTimeout(() => {
              const content = iframeDoc.body;
              if (content) {
                const contentWidth = content.scrollWidth;
                const contentHeight = content.scrollHeight;
                
                // Add some padding and ensure minimum sizes
                const minWidth = 400;
                const minHeight = 300;
                const maxWidth = window.innerWidth * 0.95;
                const maxHeight = window.innerHeight * 0.9;
                
                const newWidth = Math.min(maxWidth, Math.max(minWidth, contentWidth + 40));
                const newHeight = Math.min(maxHeight, Math.max(minHeight, contentHeight + 100)); // Extra for header
                
                // Update modal size
                if (this.modal) {
                  this.modal.style.width = `${newWidth}px`;
                  this.modal.style.height = `${newHeight}px`;
                  this.options.width = newWidth;
                  this.options.height = newHeight;
                
                  console.debug(...UILIB, 'Modal: Auto-resized webresource to', `${newWidth}x${newHeight}`);
                }
              }
            }, 500); // Give content time to render
          }
        } catch (e) {
          // Cross-origin iframe - can't auto-resize
          console.warn(...UILIB, 'Modal: Cannot auto-resize cross-origin webresource');
        }
      };
    }

    this.body.appendChild(iframe);

    // Show the modal if not already visible
    if (!this.overlay?.parentElement) {
      this.show();
    }
  }
}

/**
 * Chainable button controller for manipulating modal buttons
 */
class ButtonController {
  private button: ModalButton;
  private buttonElements: Map<ModalButton, HTMLElement>;

  constructor(button: ModalButton, buttonElements: Map<ModalButton, HTMLElement>) {
    this.button = button;
    this.buttonElements = buttonElements;
  }

  /**
   * Set button label text
   * @param label - New label text
   * @returns This ButtonController for chaining
   */
  setLabel(label: string): this {
    this.button.label = label;

    const buttonElement = this.buttonElements.get(this.button);
    if (buttonElement) {
      const fluentButton = buttonElement.querySelector('button');
      if (fluentButton) {
        fluentButton.textContent = label;
      }
    }

    return this;
  }

  /**
   * Enable or disable the button
   * @param disabled - True to disable, false to enable
   * @returns This ButtonController for chaining
   */
  setDisabled(disabled: boolean): this {
    const buttonElement = this.buttonElements.get(this.button);
    if (buttonElement) {
      const fluentButton = buttonElement.querySelector('button');
      if (fluentButton) {
        fluentButton.disabled = disabled;
      }
    }

    return this;
  }

  /**
   * Show or hide the button
   * @param visible - True to show, false to hide
   * @returns This ButtonController for chaining
   */
  setVisible(visible: boolean): this {
    const buttonElement = this.buttonElements.get(this.button);
    if (buttonElement) {
      buttonElement.style.display = visible ? '' : 'none';
    }

    return this;
  }

  /**
   * Enable the button (convenience method)
   * @returns This ButtonController for chaining
   */
  enable(): this {
    return this.setDisabled(false);
  }

  /**
   * Disable the button (convenience method)
   * @returns This ButtonController for chaining
   */
  disable(): this {
    return this.setDisabled(true);
  }

  /**
   * Show the button (convenience method)
   * @returns This ButtonController for chaining
   */
  show(): this {
    return this.setVisible(true);
  }

  /**
   * Hide the button (convenience method)
   * @returns This ButtonController for chaining
   */
  hide(): this {
    return this.setVisible(false);
  }
}

export { ModalButton } from './Modal.types';
