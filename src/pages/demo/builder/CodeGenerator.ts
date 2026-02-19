/**
 * Code Generator - Generates JavaScript code from Modal configuration
 */

import { ModalConfig, BuilderFieldConfig, BuilderButtonConfig, WizardStepConfig } from './types';

/**
 * Generate JavaScript code for the modal configuration
 */
export function generateModalCode(config: ModalConfig): string {
  const lines: string[] = [];
  
  // Start modal construction
  lines.push(`const modal = new uiLib.Modal({`);
  
  // Basic options
  lines.push(`  title: '${escapeString(config.title)}',`);
  
  if (config.message) {
    lines.push(`  message: '${escapeString(config.message)}',`);
  }
  
  if (config.content) {
    lines.push(`  content: '${escapeString(config.content)}',`);
  }
  
  // Size
  if (config.size === 'custom' && config.customWidth && config.customHeight) {
    lines.push(`  size: { width: ${config.customWidth}, height: ${config.customHeight} },`);
  } else if (config.size !== 'medium') {
    lines.push(`  size: '${config.size}',`);
  }
  
  // Boolean options (only include if different from defaults)
  if (config.draggable) {
    lines.push(`  draggable: true,`);
  }
  if (config.allowDismiss) {
    lines.push(`  allowDismiss: true,`);
  }
  if (!config.allowEscapeClose) {
    lines.push(`  allowEscapeClose: false,`);
  }
  if (config.buttonAlignment && config.buttonAlignment !== 'right') {
    lines.push(`  buttonAlignment: '${config.buttonAlignment}',`);
  }
  
  // Wizard mode
  if (config.isWizard && config.steps && config.steps.length > 0) {
    lines.push(`  progress: {`);
    lines.push(`    enabled: true,`);
    lines.push(`    currentStep: 1,`);
    lines.push(`    steps: [`);
    
    config.steps.forEach((step, index) => {
      lines.push(`      {`);
      lines.push(`        id: '${step.id}',`);
      lines.push(`        label: '${escapeString(step.label)}',`);
      if (step.message) {
        lines.push(`        message: '${escapeString(step.message)}',`);
      }
      if (step.content) {
        lines.push(`        content: '${escapeString(step.content)}',`);
      }
      lines.push(`        fields: [`);
      step.fields.forEach((field, fieldIndex) => {
        const fieldCode = generateFieldCode(field, 10);
        lines.push(fieldCode + (fieldIndex < step.fields.length - 1 ? ',' : ''));
      });
      lines.push(`        ]`);
      lines.push(`      }${index < config.steps!.length - 1 ? ',' : ''}`);
    });
    
    lines.push(`    ]`);
    lines.push(`  },`);
  } else if (config.fields.length > 0) {
    // Regular fields
    lines.push(`  fields: [`);
    config.fields.forEach((field, index) => {
      const fieldCode = generateFieldCode(field, 4);
      lines.push(fieldCode + (index < config.fields.length - 1 ? ',' : ''));
    });
    lines.push(`  ],`);
  }
  
  // Buttons
  if (config.buttons.length > 0) {
    lines.push(`  buttons: [`);
    config.buttons.forEach((button, index) => {
      const buttonCode = generateButtonCode(button);
      lines.push(`    ${buttonCode}${index < config.buttons.length - 1 ? ',' : ''}`);
    });
    lines.push(`  ]`);
  }
  
  lines.push(`});`);
  lines.push(``);
  lines.push(`modal.show();`);
  
  return lines.join('\n');
}

/**
 * Generate code for a single field
 */
function generateFieldCode(field: BuilderFieldConfig, indent: number): string {
  const pad = ' '.repeat(indent);
  const lines: string[] = [];
  
  lines.push(`${pad}{`);
  lines.push(`${pad}  id: '${field.id}',`);
  lines.push(`${pad}  label: '${escapeString(field.label)}',`);
  lines.push(`${pad}  type: '${field.type}',`);
  
  // Optional properties
  if (field.placeholder) {
    lines.push(`${pad}  placeholder: '${escapeString(field.placeholder)}',`);
  }
  if (field.required) {
    lines.push(`${pad}  required: true,`);
  }
  if (field.disabled) {
    lines.push(`${pad}  disabled: true,`);
  }
  if (field.tooltip) {
    lines.push(`${pad}  tooltip: '${escapeString(field.tooltip)}',`);
  }
  
  // Type-specific properties
  if (field.type === 'textarea' && field.rows) {
    lines.push(`${pad}  rows: ${field.rows},`);
  }
  if (field.type === 'select' && field.options && field.options.length > 0) {
    lines.push(`${pad}  options: [${field.options.map(o => `'${escapeString(o)}'`).join(', ')}],`);
  }
  if (field.type === 'lookup') {
    if (field.entityName) {
      lines.push(`${pad}  entityName: '${field.entityName}',`);
    }
    if (field.lookupColumns && field.lookupColumns.length > 0) {
      lines.push(`${pad}  lookupColumns: [${field.lookupColumns.map(c => `'${c}'`).join(', ')}],`);
    }
  }
  if (field.type === 'custom' && field.html) {
    lines.push(`${pad}  html: '${escapeString(field.html)}',`);
  }
  
  // Group properties
  if (field.type === 'group') {
    if (field.border) {
      lines.push(`${pad}  border: true,`);
    }
    if (field.collapsible) {
      lines.push(`${pad}  collapsible: true,`);
    }
    if (field.defaultCollapsed) {
      lines.push(`${pad}  defaultCollapsed: true,`);
    }
    if (field.fields && field.fields.length > 0) {
      lines.push(`${pad}  fields: [`);
      field.fields.forEach((childField, index) => {
        const childCode = generateFieldCode(childField, indent + 4);
        lines.push(childCode + (index < field.fields!.length - 1 ? ',' : ''));
      });
      lines.push(`${pad}  ]`);
    }
  }
  
  // Conditional visibility
  if (field.visibleWhen) {
    lines.push(`${pad}  visibleWhen: {`);
    lines.push(`${pad}    field: '${field.visibleWhen.field}',`);
    lines.push(`${pad}    operator: '${field.visibleWhen.operator}',`);
    if (field.visibleWhen.value !== undefined) {
      const val = typeof field.visibleWhen.value === 'string' 
        ? `'${escapeString(field.visibleWhen.value)}'` 
        : field.visibleWhen.value;
      lines.push(`${pad}    value: ${val}`);
    }
    lines.push(`${pad}  },`);
  }
  
  // Conditional required
  if (field.requiredWhen) {
    lines.push(`${pad}  requiredWhen: {`);
    lines.push(`${pad}    field: '${field.requiredWhen.field}',`);
    lines.push(`${pad}    operator: '${field.requiredWhen.operator}',`);
    if (field.requiredWhen.value !== undefined) {
      const val = typeof field.requiredWhen.value === 'string' 
        ? `'${escapeString(field.requiredWhen.value)}'` 
        : field.requiredWhen.value;
      lines.push(`${pad}    value: ${val}`);
    }
    lines.push(`${pad}  },`);
  }
  
  // Remove trailing comma from last property
  const lastLine = lines[lines.length - 1];
  if (lastLine.endsWith(',')) {
    lines[lines.length - 1] = lastLine.slice(0, -1);
  }
  
  lines.push(`${pad}}`);
  
  return lines.join('\n');
}

/**
 * Generate code for a button
 */
function generateButtonCode(button: BuilderButtonConfig): string {
  const props: string[] = [];
  
  props.push(`label: '${escapeString(button.label)}'`);
  props.push(`callback: () => true`);
  
  if (button.setFocus) {
    props.push(`setFocus: true`);
  }
  if (button.isDestructive) {
    props.push(`isDestructive: true`);
  }
  if (button.preventClose) {
    props.push(`preventClose: true`);
  }
  if (button.requiresValidation) {
    props.push(`requiresValidation: true`);
  }
  props.push(`id: '${button.id}'`);
  
  return `new uiLib.Button({ ${props.join(', ')} })`;
}

/**
 * Escape special characters in strings
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Parse JavaScript code back into ModalConfig (basic implementation)
 * Note: This is a simplified parser that handles common patterns
 */
export function parseModalCode(code: string): ModalConfig | null {
  try {
    // Extract the object literal from new uiLib.Modal({ ... })
    const match = code.match(/new\s+uiLib\.Modal\s*\(\s*(\{[\s\S]*?\})\s*\)/);
    if (!match) return null;
    
    // This is a simplified approach - for full parsing we'd need a proper JS parser
    // For now, return a basic config that can be edited
    const config: ModalConfig = {
      title: extractStringProperty(code, 'title') || 'Imported Modal',
      message: extractStringProperty(code, 'message'),
      size: (extractStringProperty(code, 'size') as ModalConfig['size']) || 'medium',
      draggable: code.includes('draggable: true'),
      allowDismiss: code.includes('allowDismiss: true'),
      allowEscapeClose: !code.includes('allowEscapeClose: false'),
      buttonAlignment: 'right',
      isWizard: code.includes('progress:') && code.includes('enabled: true'),
      fields: [],
      buttons: [],
      steps: [],
    };
    
    return config;
  } catch (error) {
    console.error('Failed to parse modal code:', error);
    return null;
  }
}

function extractStringProperty(code: string, prop: string): string | undefined {
  const regex = new RegExp(`${prop}:\\s*['"\`]([^'"\`]*)['"\`]`);
  const match = code.match(regex);
  return match ? match[1] : undefined;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Download code as a JavaScript file
 */
export function downloadAsFile(code: string, filename: string = 'modal-config.js'): void {
  const blob = new Blob([code], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Save configuration to localStorage
 */
export function saveToStorage(key: string, config: ModalConfig): void {
  localStorage.setItem(`modal-builder-${key}`, JSON.stringify(config));
}

/**
 * Load configuration from localStorage
 */
export function loadFromStorage(key: string): ModalConfig | null {
  const stored = localStorage.getItem(`modal-builder-${key}`);
  if (stored) {
    try {
      return JSON.parse(stored) as ModalConfig;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * List all saved configurations
 */
export function listSavedConfigs(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('modal-builder-')) {
      keys.push(key.replace('modal-builder-', ''));
    }
  }
  return keys;
}

/**
 * Delete a saved configuration
 */
export function deleteFromStorage(key: string): void {
  localStorage.removeItem(`modal-builder-${key}`);
}
