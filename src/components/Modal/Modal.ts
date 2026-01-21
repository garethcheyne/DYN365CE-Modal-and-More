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
} from '@fluentui/react-icons';
import { theme } from '../../styles/theme';
import { injectAnimations } from '../../styles/animations';
import type {
  ModalOptions,
  ModalInstance,
  ModalResponse,
  FieldConfig
} from './Modal.types';
import { ModalButton } from './Modal.types';
import { getTargetDocument } from '../../utils/dom';
import { TRACE } from '../Logger/Logger';
import {
  React,
  TabList,
  Tab,
  Button,
  SwitchFluentUi,
  DatePickerFluentUi,
  TableFluentUi,
  InputFluentUi,
  DropdownFluentUi,
  mountFluentComponent,
  defaultTheme,
} from '../FluentUi';

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
  private currentStep: number = 1;
  private options: ModalOptions;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private modalStartX: number = 0;
  private modalStartY: number = 0;

  constructor(options: ModalOptions) {
    this.options = {
      preventClose: false,
      allowDismiss: true,
      allowEscapeClose: true,
      draggable: false,
      buttonAlignment: 'right',
      autoSave: false,
      size: 'medium',
      ...options
    };

    // Extract width/height from size object if provided
    if (typeof this.options.size === 'object' && this.options.size !== null) {
      if (this.options.size.width !== undefined) {
        this.options.width = this.options.size.width;
      }
      if (this.options.size.height !== undefined) {
        this.options.height = this.options.size.height;
      }
    }

    this.createModal();
  }

  private createModal(): void {
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
      animation: fadeIn 0.2s cubic-bezier(0.33, 0, 0.67, 1);
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
      animation: fadeInScale 0.2s cubic-bezier(0.33, 0, 0.67, 1);
      width: ${formatSize(width)};
      max-width: 95vw;
      ${height ? `height: ${formatSize(height)}; max-height: 90vh;` : 'max-height: 90vh;'}
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    `;

    this.createHeader();
    this.createBody();
    this.modal.appendChild(this.body!);
    this.createFooter();

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

    if (!this.options.preventClose) {
      const closeBtn = doc.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Close');
      // Fluent UI v9 Dialog close button styling
      closeBtn.style.cssText = `
        background: transparent;
        border: none;
        border-radius: 4px;
        font-size: 20px;
        line-height: 1;
        color: #424242;
        cursor: pointer;
        padding: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.1s ease-in-out, color 0.1s ease-in-out;
        flex-shrink: 0;
      `;
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = '#f3f2f1';
        closeBtn.style.color = '#201f1e';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = 'transparent';
        closeBtn.style.color = '#424242';
      });
      closeBtn.addEventListener('mousedown', () => {
        closeBtn.style.backgroundColor = '#edebe9';
      });
      closeBtn.addEventListener('mouseup', () => {
        closeBtn.style.backgroundColor = '#f3f2f1';
      });
      closeBtn.addEventListener('focus', () => {
        closeBtn.style.outline = '2px solid #0078d4';
        closeBtn.style.outlineOffset = '2px';
      });
      closeBtn.addEventListener('blur', () => {
        closeBtn.style.outline = 'none';
      });
      closeBtn.onclick = () => this.close();
      this.header.appendChild(closeBtn);
    }

    if (this.options.draggable && this.header) {
      this.header.onmousedown = (e) => this.startDrag(e);
    }

    this.modal!.appendChild(this.header);
  }

  private createBody(): void {
    const doc = getTargetDocument();
    this.body = doc.createElement('div');

    // Count sections to determine styling
    const sectionCount =
      (this.options.message ? 1 : 0) +
      (this.options.content ? 1 : 0) +
      (this.options.fields && this.options.fields.length > 0 ? 1 : 0);

    const needsSectionStyling = sectionCount > 1;

    this.body.style.cssText = `
      flex: 1;
      overflow: auto;
      padding: 20px;
      background: ${needsSectionStyling ? 'rgb(243, 242, 241)' : '#ffffff'};
    `;

    if (this.options.message) {
      const messageEl = doc.createElement('p');
      messageEl.textContent = this.options.message;
      messageEl.style.cssText = `
        margin: 0 0 ${needsSectionStyling ? theme.spacing.m : '0'} 0;
        color: ${theme.colors.modal.textSecondary};
        font-size: ${theme.typography.fontSize.body};
        ${needsSectionStyling ? `
          background: #ffffff;
          padding: ${theme.spacing.l};
          border-radius: ${theme.borderRadius.medium};
          box-shadow: rgba(0, 0, 0, 0.12) 0px 0px 2px, rgba(0, 0, 0, 0.14) 0px 2px 4px;
        ` : ''}
      `;
      this.body.appendChild(messageEl);
    }

    if (this.options.content) {
      const contentEl = doc.createElement('div');
      contentEl.innerHTML = this.options.content;
      contentEl.style.cssText = `
        ${needsSectionStyling ? `
          background: #ffffff;
          padding: ${theme.spacing.l};
          border-radius: ${theme.borderRadius.medium};
          box-shadow: rgba(0, 0, 0, 0.12) 0px 0px 2px, rgba(0, 0, 0, 0.14) 0px 2px 4px;
        ` : ''}
        margin-bottom: ${this.options.fields && this.options.fields.length > 0 ? theme.spacing.m : '0'};
      `;
      this.body.appendChild(contentEl);
    }

    if (this.options.fields && this.options.fields.length > 0) {
      const fieldsContainer = doc.createElement('div');
      fieldsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: ${theme.spacing.m};
        ${needsSectionStyling ? `
          background: #ffffff;
          padding: ${theme.spacing.l};
          border-radius: ${theme.borderRadius.medium};
          box-shadow: rgba(0, 0, 0, 0.12) 0px 0px 2px, rgba(0, 0, 0, 0.14) 0px 2px 4px;
        ` : `
          padding: ${theme.spacing.l};
          border-radius: ${theme.borderRadius.medium};
        `}
      `;

      this.options.fields.forEach(field => {
        const fieldEl = this.createField(field);
        if (fieldEl) fieldsContainer.appendChild(fieldEl);
      });

      this.body.appendChild(fieldsContainer);
    }
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

  private createTabs(tabs: FieldConfig[]): HTMLElement {
    const doc = getTargetDocument();
    const container = doc.createElement('div');

    // Create tab panels content first (non-React)
    const tabPanelsContainer = doc.createElement('div');
    const tabPanels: HTMLElement[] = [];

    tabs.forEach((tab, index) => {
      const panel = doc.createElement('div');
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('id', `panel-${index}`);
      panel.style.cssText = `
        display: ${index === 0 ? 'flex' : 'none'};
        flex-direction: column;
        gap: 12px;
        padding-top: 12px;
      `;

      if (tab.fields) {
        tab.fields.forEach(field => {
          const fieldEl = this.createField(field);
          if (fieldEl) panel.appendChild(fieldEl);
        });
      }

      tabPanels.push(panel);
      tabPanelsContainer.appendChild(panel);
    });

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

  private createField(field: FieldConfig): HTMLElement | null {
    const doc = getTargetDocument();

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

    const container = doc.createElement('div');

    const labelPosition = field.labelPosition || 'left';

    // Note: For Fluent UI field components (Input, Dropdown, Switch, etc.),
    // labels are handled by the components themselves, not here

    switch (field.type) {
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
            onChange: (newChecked: boolean) => {
              setChecked(newChecked);
              field.value = newChecked;
              this.fieldValues.set(field.id, newChecked);
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
            appearance: 'underline' as const,
            onChange: (value: string | number) => {
              setTextValue(value);
              this.fieldValues.set(field.id, value);
              field.value = value;
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

          return React.createElement(DropdownFluentUi, {
            id: field.id,
            label: field.label,
            value: selectValue,
            options: optionStrings,
            placeholder: field.placeholder || '---',
            required: field.required,
            disabled: field.disabled,
            tooltip: field.tooltip,
            appearance: 'underline',
            onChange: (value: string) => {
              setSelectValue(value);
              this.fieldValues.set(field.id, value);
              field.value = value;
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
            onChange: (date: Date | null) => {
              setSelectedDate(date);
              field.value = date;
              this.fieldValues.set(field.id, date);
            }
          });
        };

        mountFluentComponent(dateWrapper, React.createElement(DatePickerWrapper), defaultTheme);
        container.appendChild(dateWrapper);

        // Store initial value
        this.fieldValues.set(field.id, initialDate);

        return container;
      case 'table':
        // Use Fluent UI DataGrid component
        const tableWrapper = doc.createElement('div');
        tableWrapper.setAttribute('data-field-id', field.id);
        tableWrapper.style.cssText = `
          display: flex;
          flex-direction: column;
          width: 100%;
          ${labelPosition === 'left' ? 'flex: 1;' : ''}
        `;

        // Create table component
        const TableWrapper = () => {
          return React.createElement(TableFluentUi, {
            config: field,
            onSelectionChange: (selectedRows: any[]) => {
              this.fieldValues.set(field.id, selectedRows);
              if (field.onRowSelect) {
                field.onRowSelect(selectedRows);
              }
            }
          });
        };

        mountFluentComponent(tableWrapper, React.createElement(TableWrapper), defaultTheme);
        container.appendChild(tableWrapper);

        // Store initial empty selection
        this.fieldValues.set(field.id, []);

        return container;
      default:
        // Use Fluent UI Input component for native Dynamics look
        const inputWrapper = doc.createElement('div');
        inputWrapper.setAttribute('data-field-id', field.id);

        // Create input component with underline appearance
        const InputWrapper = () => {
          const [inputValue, setInputValue] = React.useState(field.value || '');

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
            appearance: 'underline' as const, // Dynamics-style underline
            onChange: (value: string | number) => {
              setInputValue(value);
              this.fieldValues.set(field.id, value);
              field.value = value;
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
        this.footer!.appendChild(button);
      });
    }

    this.modal!.appendChild(this.footer);
  }

  private createButton(btn: ModalButton): HTMLElement {
    const doc = getTargetDocument();
    const buttonContainer = doc.createElement('div');

    const isPrimary = btn.setFocus;

    // Use Fluent UI Button component via React
    const ButtonComponent = React.createElement(Button, {
      appearance: isPrimary ? 'primary' : 'secondary',
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
      style: { minWidth: '96px' }
    });

    // Mount the Fluent UI button
    mountFluentComponent(buttonContainer, ButtonComponent, defaultTheme);

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

  show(): void {
    console.debug(...TRACE, 'UI-lib Modal.show()', {
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
    }
  }

  showAsync(): Promise<ModalResponse> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.show();
    });
  }

  close(): void {
    const doc = getTargetDocument();

    doc.removeEventListener('keydown', this.handleEscapeKey);
    doc.removeEventListener('mousemove', this.handleDrag);
    doc.removeEventListener('mouseup', this.stopDrag);

    if (this.modal) {
      this.modal.style.animation = 'fadeOutScale 0.2s cubic-bezier(0.33, 0, 0.67, 1)';
    }
    if (this.overlay) {
      this.overlay.style.animation = 'fadeOut 0.2s cubic-bezier(0.33, 0, 0.67, 1)';
    }

    setTimeout(() => {
      if (this.container?.parentElement) {
        this.container.parentElement.removeChild(this.container);
      }
      if (this.overlay?.parentElement) {
        this.overlay.parentElement.removeChild(this.overlay);
      }
      doc.body.style.overflow = '';
    }, 200);
  }

  setLoading(loading: boolean, message?: string): void {
    const doc = getTargetDocument();

    if (loading) {
      if (!this.loadingOverlay && this.modal) {
        this.loadingOverlay = doc.createElement('div');
        this.loadingOverlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: ${theme.spacing.m};
          z-index: 10;
        `;

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

        if (message) {
          const messageEl = doc.createElement('div');
          messageEl.textContent = message;
          messageEl.style.cssText = `
            color: ${theme.colors.modal.text};
            font-size: ${theme.typography.fontSize.body};
          `;
          this.loadingOverlay.appendChild(messageEl);
        }

        this.modal.appendChild(this.loadingOverlay);
      }
    } else {
      if (this.loadingOverlay?.parentElement) {
        this.loadingOverlay.parentElement.removeChild(this.loadingOverlay);
        this.loadingOverlay = null;
      }
    }
  }

  updateProgress(step: number, _skipValidation?: boolean): void {
    this.currentStep = step;
  }

  nextStep(): void {
    this.currentStep++;
    this.updateProgress(this.currentStep);
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgress(this.currentStep);
    }
  }

  goToStep(_stepId: string): void {
    // TODO: Implement
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

    // Update internal value map
    this.fieldValues.set(fieldId, value);

    // Update the actual DOM element
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
  }

  validateCurrentStep(): boolean {
    return true;
  }

  validateAllFields(): boolean {
    return true;
  }

  updateSideCart(_content: string | { imageUrl: string }): void {
    // TODO: Implement
  }

  clearAutoSave(): void {
    // TODO: Implement
  }

  getElement(selector?: string): HTMLElement | HTMLElement[] | null {
    if (!selector) return this.modal;
    if (this.modal) {
      const elements = this.modal.querySelectorAll(selector);
      return elements.length === 1 ? elements[0] as HTMLElement : Array.from(elements) as HTMLElement[];
    }
    return null;
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
                
                  console.log('Modal: Auto-resized webresource to', `${newWidth}x${newHeight}`);
                }
              }
            }, 500); // Give content time to render
          }
        } catch (e) {
          // Cross-origin iframe - can't auto-resize
          console.warn('Modal: Cannot auto-resize cross-origin webresource');
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

export { ModalButton } from './Modal.types';
