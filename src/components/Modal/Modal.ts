/**
 * Modal Component
 * Advanced dialog system for D365 CE
 */

import { theme } from '../../styles/theme';
import { injectAnimations } from '../../styles/animations';
import type {
  ModalOptions,
  ModalInstance,
  ModalResponse,
  FieldConfig
} from './Modal.types';
import { ModalButton } from './Modal.types';

/**
 * Get target document for D365 iframe support
 */
function getTargetDocument(): Document {
  try {
    if (window.self !== window.top && window.top) {
      return window.top.document;
    }
  } catch (e) {
    // Cross-origin - use current document
  }
  return document;
}

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

    this.createModal();
  }

  private createModal(): void {
    const doc = getTargetDocument();
    injectAnimations();

    this.overlay = doc.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${theme.colors.modal.overlay};
      z-index: ${theme.zIndex.modalOverlay};
      animation: fadeIn 0.2s ease-out;
    `;

    if (this.options.allowDismiss) {
      this.overlay.onclick = () => this.close();
    }

    this.container = doc.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: ${theme.zIndex.modal};
      animation: fadeInScale 0.3s ease-out;
    `;
    this.container.onclick = (e) => e.stopPropagation();

    this.modal = doc.createElement('div');
    const { width, height } = this.getModalDimensions();

    this.modal.style.cssText = `
      background: #fafafa;
      border-radius: ${theme.borderRadius.medium};
      box-shadow: ${theme.shadows.modal};
      width: ${width}px;
      max-width: 95vw;
      ${height ? `height: ${height}px; max-height: 90vh;` : 'max-height: 90vh;'}
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    this.createHeader();
    this.createBody();
    this.modal.appendChild(this.body!);
    this.createFooter();

    // If sideCart is enabled, create a wrapper for modal + sideCart
    if (this.options.sideCart?.enabled) {
      const isAttached = this.options.sideCart.attached !== false;
      const modalWrapper = doc.createElement('div');
      modalWrapper.style.cssText = `
        display: flex;
        ${this.options.sideCart.position === 'left' ? 'flex-direction: row-reverse;' : 'flex-direction: row;'}
        align-items: stretch;
        gap: ${!isAttached ? '20px' : '0'};
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

  private getModalDimensions(): { width: number; height: number | null } {
    if (this.options.width) {
      return { width: this.options.width, height: this.options.height || null };
    }

    const sizeMap: Record<string, { width: number; height: number | null }> = {
      small: { width: 400, height: null },
      medium: { width: 600, height: null },
      large: { width: 900, height: null },
      fullscreen: { width: window.innerWidth * 0.95, height: window.innerHeight * 0.9 }
    };

    return sizeMap[this.options.size || 'medium'] || sizeMap.medium;
  }

  private createHeader(): void {
    const doc = getTargetDocument();
    this.header = doc.createElement('div');
    this.header.style.cssText = `
      padding: ${theme.spacing.l};
      border-bottom: 1px solid rgb(239, 239, 239);
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      ${this.options.draggable ? 'cursor: move;' : ''}
    `;

    const titleEl = doc.createElement('h2');
    titleEl.textContent = this.options.title;
    titleEl.style.cssText = `
      margin: 0;
      font-size: ${theme.typography.fontSize.title};
      font-weight: ${theme.typography.fontWeight.semibold};
      color: ${theme.colors.modal.text};
    `;
    this.header.appendChild(titleEl);

    if (!this.options.preventClose) {
      const closeBtn = doc.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 32px;
        line-height: 1;
        color: ${theme.colors.modal.textSecondary};
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s;
      `;
      closeBtn.onmouseover = () => closeBtn.style.color = theme.colors.modal.text;
      closeBtn.onmouseout = () => closeBtn.style.color = theme.colors.modal.textSecondary;
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
    
    this.body.style.cssText = `
      flex: 1;
      overflow: auto;
      padding: ${theme.spacing.l};
      background: #fafafa;
    `;

    if (this.options.message) {
      const messageEl = doc.createElement('p');
      messageEl.textContent = this.options.message;
      messageEl.style.cssText = `
        margin: 0 0 ${theme.spacing.m} 0;
        color: ${theme.colors.modal.textSecondary};
        font-size: ${theme.typography.fontSize.body};
        background: #ffffff;
        padding: ${theme.spacing.l};
        border-radius: ${theme.borderRadius.medium};
        box-shadow: rgba(0, 0, 0, 0.12) 0px 0px 2px, rgba(0, 0, 0, 0.14) 0px 2px 4px;
      `;
      this.body.appendChild(messageEl);
    }

    if (this.options.content) {
      const contentEl = doc.createElement('div');
      contentEl.innerHTML = this.options.content;
      contentEl.style.cssText = `
        background: #ffffff;
        padding: ${theme.spacing.l};
        border-radius: ${theme.borderRadius.medium};
        box-shadow: rgba(0, 0, 0, 0.12) 0px 0px 2px, rgba(0, 0, 0, 0.14) 0px 2px 4px;
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
        background: #ffffff;
        padding: ${theme.spacing.l};
        border-radius: ${theme.borderRadius.medium};
        box-shadow: rgba(0, 0, 0, 0.12) 0px 0px 2px, rgba(0, 0, 0, 0.14) 0px 2px 4px;
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
    const isAttached = this.options.sideCart.attached !== false; // Default to true
    
    sideCart.style.cssText = `
      width: ${cartWidth}px;
      flex-shrink: 0;
      background: ${this.options.sideCart.backgroundColor || '#ffffff'};
      overflow: auto;
      ${isAttached 
        ? `border-${this.options.sideCart.position === 'left' ? 'left' : 'right'}-radius: ${theme.borderRadius.medium};` 
        : `border-radius: ${theme.borderRadius.medium}; 
           box-shadow: ${theme.shadows.modal};`
      }
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
    const tabsContainer = doc.createElement('div');
    tabsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing.m};
    `;
    
    // Tab headers wrapper
    const tabHeadersWrapper = doc.createElement('div');
    tabHeadersWrapper.setAttribute('role', 'presentation');
    tabHeadersWrapper.style.cssText = `
      min-height: 51px;
      border-bottom: 2px solid rgb(239, 239, 239);
    `;
    
    // Tab headers list
    const tabHeaders = doc.createElement('ul');
    tabHeaders.setAttribute('role', 'tablist');
    tabHeaders.style.cssText = `
      display: flex;
      gap: 0;
      list-style: none;
      margin: 0;
      padding: 0;
      padding-bottom: 5px;
    `;
    
    // Tab content containers
    const tabContents = doc.createElement('div');
    tabContents.style.cssText = `
      position: relative;
      min-height: 0;
    `;
    
    const tabContentElements: HTMLElement[] = [];
    
    tabs.forEach((tab, index) => {
      // Create tab header list item
      const tabHeaderLi = doc.createElement('li');
      tabHeaderLi.setAttribute('role', 'tab');
      tabHeaderLi.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      tabHeaderLi.setAttribute('aria-label', tab.label || `Tab ${index + 1}`);
      tabHeaderLi.setAttribute('tabindex', index === 0 ? '0' : '-1');
      tabHeaderLi.textContent = tab.label || `Tab ${index + 1}`;
      tabHeaderLi.style.cssText = `
        padding: 0 0 0 0;
        margin-right: 20px;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 14px;
        color: #000;
        font-weight: ${index === 0 ? 'bold' : 'normal'};
        line-height: 28px;
        border-radius: 0;
        position: relative;
      `;
      
      // Create animated underline element
      const underline = doc.createElement('div');
      underline.setAttribute('aria-hidden', 'true');
      underline.style.cssText = `
        position: absolute;
        bottom: -7px;
        left: 50%;
        transform: translateX(-50%) scaleX(0);
        height: 3px;
        background-color: #0078d4;
        transition: transform 0.15s ease-out;
        transform-origin: center;
        border-radius: 2px 2px 0 0;
      `;
      tabHeaderLi.appendChild(underline);
      
      // Create tab content
      const tabContent = doc.createElement('div');
      tabContent.style.cssText = `
        display: ${index === 0 ? 'flex' : 'none'};
        flex-direction: column;
        gap: ${theme.spacing.m};
        padding: ${theme.spacing.m} 0;
      `;
      
      if (tab.fields) {
        tab.fields.forEach(field => {
          const fieldEl = this.createField(field);
          if (fieldEl) tabContent.appendChild(fieldEl);
        });
      }
      
      tabContentElements.push(tabContent);
      
      // Tab click handler
      tabHeaderLi.onclick = () => {
        // Hide all tabs
        tabContentElements.forEach((content) => {
          content.style.display = 'none';
        });
        
        // Reset all tab headers
        Array.from(tabHeaders.children).forEach((header) => {
          const headerEl = header as HTMLElement;
          headerEl.style.fontWeight = 'normal';
          headerEl.setAttribute('aria-selected', 'false');
          headerEl.setAttribute('tabindex', '-1');
          const underlineEl = headerEl.querySelector('div') as HTMLElement;
          if (underlineEl) {
            underlineEl.style.transform = 'translateX(-50%) scaleX(0)';
          }
        });
        
        // Show selected tab
        tabContent.style.display = 'flex';
        tabHeaderLi.style.fontWeight = 'bold';
        tabHeaderLi.setAttribute('aria-selected', 'true');
        tabHeaderLi.setAttribute('tabindex', '0');
        
        // Measure text width and animate underline
        const textWidth = tabHeaderLi.offsetWidth;
        const underlineEl = tabHeaderLi.querySelector('div') as HTMLElement;
        if (underlineEl) {
          underlineEl.style.width = `${textWidth + 2}px`; // +1px left and right
          underlineEl.style.transform = 'translateX(-50%) scaleX(1)';
        }
      };
      
      // Set first tab as active
      if (index === 0) {
        tabHeaderLi.style.fontWeight = 'bold';
        // Measure and set initial underline width
        setTimeout(() => {
          const textWidth = tabHeaderLi.offsetWidth;
          const underlineEl = tabHeaderLi.querySelector('div') as HTMLElement;
          if (underlineEl) {
            underlineEl.style.width = `${textWidth + 2}px`;
            underlineEl.style.transform = 'translateX(-50%) scaleX(1)';
          }
        }, 0);
      }
      
      tabHeaders.appendChild(tabHeaderLi);
      tabContents.appendChild(tabContent);
    });
    
    tabHeadersWrapper.appendChild(tabHeaders);
    tabsContainer.appendChild(tabHeadersWrapper);
    tabsContainer.appendChild(tabContents);
    
    // After rendering, calculate max height and set it
    setTimeout(() => {
      let maxHeight = 0;
      tabContentElements.forEach((content) => {
        // Temporarily show to measure
        const originalDisplay = content.style.display;
        content.style.display = 'flex';
        const height = content.scrollHeight;
        if (height > maxHeight) {
          maxHeight = height;
        }
        content.style.display = originalDisplay;
      });
      
      if (maxHeight > 0) {
        tabContents.style.minHeight = `${maxHeight}px`;
      }
    }, 0);
    
    return tabsContainer;
  }

  private createField(field: FieldConfig): HTMLElement | null {
    const doc = getTargetDocument();
    
    // Handle tabs
    if (field.asTabs && field.fields) {
      return this.createTabs(field.fields);
    }
    
    const container = doc.createElement('div');
    
    const labelPosition = field.labelPosition || 'left';
    
    container.style.cssText = `
      display: flex;
      flex-direction: ${labelPosition === 'top' ? 'column' : 'row'};
      gap: ${labelPosition === 'top' ? theme.spacing.xs : theme.spacing.m};
      align-items: ${labelPosition === 'top' ? 'stretch' : 'center'};
    `;

    if (field.label) {
      const label = doc.createElement('label');
      label.textContent = field.label + (field.required ? ' *' : '');
      label.style.cssText = `
        display: block;
        margin-bottom: ${labelPosition === 'top' ? '4px' : '0'};
        font-style: normal;
        font-variant: normal;
        font-weight: normal;
        font-size: 14px;
        font-family: 'SegoeUI', 'Segoe UI', ${theme.typography.fontFamily};
        color: ${theme.colors.modal.text};
        ${labelPosition === 'left' ? 'min-width: 120px; flex-shrink: 0;' : ''}
      `;
      container.appendChild(label);
    }

    let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    switch (field.type) {
      case 'textarea':
        input = doc.createElement('textarea');
        (input as HTMLTextAreaElement).rows = field.rows || 4;
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');
        break;
      case 'select':
        input = doc.createElement('select');
        input.setAttribute('autocomplete', 'off');
        if (field.options) {
          field.options.forEach(opt => {
            const option = doc.createElement('option');
            if (typeof opt === 'string') {
              option.value = opt;
              option.textContent = opt;
            } else {
              option.value = opt.value;
              option.textContent = opt.label;
            }
            (input as HTMLSelectElement).appendChild(option);
          });
        }
        break;
      default:
        input = doc.createElement('input');
        input.type = field.type || 'text';
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');
        if (field.placeholder) input.placeholder = field.placeholder;
    }

    input.id = field.id;

    // Determine if this input type needs animated border
    const needsAnimatedBorder = field.type !== 'checkbox' && field.type !== 'range';

    // Create wrapper for animated border effect
    const inputWrapper = doc.createElement('div');
    inputWrapper.style.cssText = `
      position: relative;
      width: 100%;
      ${labelPosition === 'left' ? 'flex: 1;' : ''}
    `;

    input.style.cssText = `
      width: 100%;
      padding: 8px 8px 6px 8px;
      background-color: white;
      border: none;
      border-bottom: 1px solid rgb(216, 216, 216);
      border-radius: 2px 2px 0 0;
      font-size: 14px;
      font-family: ${theme.typography.fontFamily};
      color: ${theme.colors.modal.inputText};
      outline: none;
      min-height: 32px;
      box-sizing: border-box;
    `;

    // Create animated bottom border element only for text-like inputs
    if (needsAnimatedBorder) {
      const borderElement = doc.createElement('div');
      borderElement.style.cssText = `
        position: absolute;
        left: -1px;
        right: -1px;
        bottom: 0;
        height: 2px;
        background-color: #0078d4;
        transform: scaleX(0);
        transition: transform 0.15s ease-out;
        border-radius: 0 0 4px 4px;
        pointer-events: none;
      `;

      input.onfocus = () => {
        borderElement.style.transform = 'scaleX(1)';
      };
      input.onblur = () => {
        borderElement.style.transform = 'scaleX(0)';
      };

      inputWrapper.appendChild(borderElement);
    }

    if (field.value !== undefined) {
      if (input instanceof HTMLInputElement && input.type === 'checkbox') {
        input.checked = Boolean(field.value);
      } else {
        input.value = String(field.value);
      }
      this.fieldValues.set(field.id, field.value);
    }

    input.oninput = () => {
      if (input instanceof HTMLInputElement && input.type === 'checkbox') {
        this.fieldValues.set(field.id, input.checked);
      } else {
        this.fieldValues.set(field.id, input.value);
      }
    };

    inputWrapper.appendChild(input);
    container.appendChild(inputWrapper);
    return container;
  }

  private createFooter(): void {
    const doc = getTargetDocument();
    this.footer = doc.createElement('div');

    const alignment = this.options.buttonAlignment || 'right';
    const justifyContent = alignment === 'space-between' ? 'space-between' :
      alignment === 'center' ? 'center' :
        alignment === 'left' ? 'flex-start' : 'flex-end';

    this.footer.style.cssText = `
      padding: ${theme.spacing.l};
      border-top: 1px solid rgb(239, 239, 239);
      background: #ffffff;
      display: flex;
      justify-content: ${justifyContent};
      gap: ${theme.spacing.m};
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
    const button = doc.createElement('button');
    button.textContent = btn.label;

    const isPrimary = btn.setFocus;

    button.style.cssText = `
      padding: 5px 12px;
      background: ${isPrimary ? theme.colors.modal.primary : theme.colors.modal.secondary};
      border: ${isPrimary ? 'none' : `1px solid ${theme.colors.modal.secondaryBorder}`};
      border-radius: ${theme.borderRadius.small};
      color: ${isPrimary ? theme.colors.modal.primaryText : theme.colors.modal.secondaryText};
      font-size: ${theme.typography.fontSize.body};
      font-weight: ${theme.typography.fontWeight.semibold};
      font-family: ${theme.typography.fontFamily};
      cursor: pointer;
      transition: all 0.2s;
      min-height: 32px;
      min-width: 96px;
    `;

    button.onmouseover = () => {
      button.style.background = isPrimary
        ? theme.colors.modal.primaryHover
        : theme.colors.modal.secondaryHover;
    };

    button.onmouseout = () => {
      button.style.background = isPrimary
        ? theme.colors.modal.primary
        : theme.colors.modal.secondary;
    };

    button.onclick = async () => {
      const result = await btn.callback();

      if (result !== false && !btn.preventClose) {
        if (this.resolvePromise) {
          this.resolvePromise({ button: btn, data: this.getFieldValues() });
        }
        this.close();
      }
    };

    if (btn.setFocus) {
      setTimeout(() => button.focus(), 100);
    }

    return button;
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

    if (this.container) {
      this.container.style.animation = 'fadeOutScale 0.2s ease-in';
    }
    if (this.overlay) {
      this.overlay.style.animation = 'fadeOut 0.2s ease-in';
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
    return this.fieldValues.get(fieldId);
  }

  getFieldValues(): Record<string, any> {
    const values: Record<string, any> = {};
    this.fieldValues.forEach((value, key) => {
      values[key] = value;
    });
    return values;
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
}

export { ModalButton } from './Modal.types';
