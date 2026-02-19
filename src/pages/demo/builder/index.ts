/**
 * Modal Builder - Barrel Export
 */

export { ModalBuilder } from './ModalBuilder';
export type { 
  FieldType, 
  FieldTemplate, 
  BuilderFieldConfig, 
  VisibilityCondition,
  WizardStepConfig,
  ModalConfig,
  ButtonConfig 
} from './types';
export { FIELD_TEMPLATES, DEFAULT_MODAL_CONFIG } from './types';
export { 
  generateModalCode, 
  parseModalCode, 
  copyToClipboard, 
  downloadAsFile,
  saveToStorage,
  loadFromStorage,
  listSavedConfigs,
  deleteFromStorage 
} from './CodeGenerator';
