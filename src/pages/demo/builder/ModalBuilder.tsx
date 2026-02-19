/**
 * Modal Builder - Main builder component with drag & drop
 */

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import './styles.css';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Button,
  Input,
  Checkbox,
  Dropdown,
  Option,
  Field,
  SpinButton,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  makeStyles,
  tokens,
  Text,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { Add24Regular, Dismiss24Regular } from '@fluentui/react-icons';

import { FieldPalette } from './FieldPalette';
import { FieldEditor } from './FieldEditor';
import { Preview } from './Preview';
import { getFieldIcon, ToolbarIcons } from './icons';
import {
  ModalConfig,
  BuilderFieldConfig,
  BuilderButtonConfig,
  WizardStepConfig,
  DEFAULT_MODAL_CONFIG,
  FIELD_TEMPLATES,
  FieldType,
} from './types';
import {
  saveToStorage,
  loadFromStorage,
  listSavedConfigs,
  deleteFromStorage,
  parseModalCode,
} from './CodeGenerator';
import * as uiLib from '../../../index';

// Fluent UI styles
const useBuilderStyles = makeStyles({
  toolbar: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  settingsPanel: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: tokens.spacingHorizontalM,
  },
  settingsRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalS,
    alignItems: 'flex-end',
    flexWrap: 'wrap' as const,
  },
  settingsField: {
    flex: 1,
    minWidth: '150px',
  },
  settingsFieldSmall: {
    width: '100px',
    flex: 'none',
  },
  buttonsSection: {
    marginTop: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  buttonRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalXS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
  },
  buttonInput: {
    flex: 1,
    maxWidth: '200px',
  },
  checkboxGroup: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
});

// Sortable field item
interface SortableFieldProps {
  field: BuilderFieldConfig;
  isSelected: boolean;
  onSelect: () => void;
  onSelectChild?: (id: string) => void;
  selectedChildId?: string | null;
  allFields: BuilderFieldConfig[];
}

// Droppable group zone - for dropping fields into groups
interface DroppableGroupProps {
  groupId: string;
  children: React.ReactNode;
  isEmpty: boolean;
}

const DroppableGroup: React.FC<DroppableGroupProps> = ({ groupId, children, isEmpty }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `group-drop-${groupId}`,
    data: { type: 'group', groupId },
  });

  return (
    <div
      ref={setNodeRef}
      className={`builder-group__drop-zone ${isOver ? 'builder-group__drop-zone--over' : ''} ${isEmpty ? 'builder-group__drop-zone--empty' : ''}`}
    >
      {children}
    </div>
  );
};

const SortableField: React.FC<SortableFieldProps> = ({ field, isSelected, onSelect, onSelectChild, selectedChildId, allFields }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Check if this is a group field
  const isGroup = field.type === 'group';
  const childFields = field.fields || [];

  // Regular field (non-group)
  if (!isGroup) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`builder-field ${isSelected ? 'builder-field--selected' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        {...attributes}
        {...listeners}
      >
        <span className="builder-field__icon">{getFieldIcon(field.type)}</span>
        <div className="builder-field__info">
          <span className="builder-field__label">{field.label}</span>
          <span className="builder-field__type">{field.type}</span>
        </div>
        <div className="builder-field__badges">
          {field.required && <span className="builder-field__badge builder-field__badge--required">Required</span>}
          {field.visibleWhen && <span className="builder-field__badge builder-field__badge--conditional">Conditional</span>}
        </div>
        <span className="builder-field__drag-handle">{ToolbarIcons.dragHandle}</span>
      </div>
    );
  }

  // Group field
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`builder-field builder-field--group ${isSelected ? 'builder-field--selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      {...attributes}
      {...listeners}
    >
      <div className="builder-field__header">
        <span className="builder-field__icon">{getFieldIcon(field.type)}</span>
        <div className="builder-field__info">
          <span className="builder-field__label">{field.label}</span>
          <span className="builder-field__type">{field.type}</span>
        </div>
        <div className="builder-field__badges">
          {field.required && <span className="builder-field__badge builder-field__badge--required">Required</span>}
          {field.visibleWhen && <span className="builder-field__badge builder-field__badge--conditional">Conditional</span>}
          <span className="builder-field__badge builder-field__badge--group">{childFields.length} fields</span>
        </div>
        <span className="builder-field__drag-handle">{ToolbarIcons.dragHandle}</span>
      </div>
      
      {/* Nested fields for groups */}
      <div className="builder-group__children">
        <DroppableGroup groupId={field.id} isEmpty={childFields.length === 0}>
          {childFields.length === 0 ? (
            <div className="builder-group__empty">
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Drop fields here to add to group
              </Text>
            </div>
          ) : (
            <SortableContext items={childFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              {childFields.map(childField => (
                <div
                  key={childField.id}
                  className={`builder-field builder-field--nested ${selectedChildId === childField.id ? 'builder-field--selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectChild?.(childField.id);
                  }}
                >
                  <span className="builder-field__icon">{getFieldIcon(childField.type)}</span>
                  <div className="builder-field__info">
                    <span className="builder-field__label">{childField.label}</span>
                    <span className="builder-field__type">{childField.type}</span>
                  </div>
                  <div className="builder-field__badges">
                    {childField.required && <span className="builder-field__badge builder-field__badge--required">Required</span>}
                  </div>
                </div>
              ))}
            </SortableContext>
          )}
        </DroppableGroup>
      </div>
    </div>
  );
};

// Droppable Canvas component - provides drop target for palette items
interface DroppableCanvasProps {
  children: React.ReactNode;
  isEmpty: boolean;
}

const DroppableCanvas: React.FC<DroppableCanvasProps> = ({ children, isEmpty }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas-drop-zone',
  });

  return (
    <div
      ref={setNodeRef}
      className={`builder-canvas__drop-zone ${isOver ? 'builder-canvas__drop-zone--over' : ''} ${isEmpty ? 'builder-canvas__drop-zone--empty' : ''}`}
    >
      {children}
    </div>
  );
};

// Main Modal Builder component
interface ModalBuilderProps {
  initialConfig?: ModalConfig;
}

export const ModalBuilder: React.FC<ModalBuilderProps> = ({ initialConfig }) => {
  const styles = useBuilderStyles();
  const [config, setConfig] = useState<ModalConfig>(initialConfig || DEFAULT_MODAL_CONFIG);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Get the selected field (including nested fields in groups)
  const getSelectedField = (): BuilderFieldConfig | null => {
    if (!selectedFieldId) return null;
    
    // Check top-level fields
    const topLevel = config.fields.find(f => f.id === selectedFieldId);
    if (topLevel) return topLevel;
    
    // Check nested fields in groups
    for (const field of config.fields) {
      if (field.type === 'group' && field.fields) {
        const nested = field.fields.find(f => f.id === selectedFieldId);
        if (nested) return nested;
      }
    }
    return null;
  };
  const selectedField = getSelectedField();

  // Generate unique field ID
  const generateFieldId = (type: FieldType): string => {
    const baseId = type.toLowerCase();
    let counter = 1;
    while (config.fields.some(f => f.id === `${baseId}${counter}`)) {
      counter++;
    }
    return `${baseId}${counter}`;
  };

  // Add a new field
  const addField = useCallback((type: FieldType, index?: number) => {
    const template = FIELD_TEMPLATES.find(t => t.type === type);
    if (!template) return;

    const newField: BuilderFieldConfig = {
      id: generateFieldId(type),
      type,
      label: template.label,
      ...template.defaultConfig,
    };

    setConfig(prev => {
      const newFields = [...prev.fields];
      if (index !== undefined) {
        newFields.splice(index, 0, newField);
      } else {
        newFields.push(newField);
      }
      return { ...prev, fields: newFields };
    });

    setSelectedFieldId(newField.id);
  }, [config.fields]);

  // Update a field (including nested fields in groups)
  const updateField = useCallback((updatedField: BuilderFieldConfig) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(f => {
        // Direct match
        if (f.id === updatedField.id) return updatedField;
        // Check nested fields in groups
        if (f.type === 'group' && f.fields) {
          const nestedIndex = f.fields.findIndex(nf => nf.id === updatedField.id);
          if (nestedIndex !== -1) {
            return {
              ...f,
              fields: f.fields.map(nf => nf.id === updatedField.id ? updatedField : nf),
            };
          }
        }
        return f;
      }),
    }));
  }, []);

  // Delete a field (including nested fields in groups)
  const deleteField = useCallback(() => {
    if (!selectedFieldId) return;
    setConfig(prev => {
      // Check if it's a top-level field
      if (prev.fields.some(f => f.id === selectedFieldId)) {
        return { ...prev, fields: prev.fields.filter(f => f.id !== selectedFieldId) };
      }
      // Check nested fields in groups
      return {
        ...prev,
        fields: prev.fields.map(f => {
          if (f.type === 'group' && f.fields) {
            return { ...f, fields: f.fields.filter(nf => nf.id !== selectedFieldId) };
          }
          return f;
        }),
      };
    });
    setSelectedFieldId(null);
  }, [selectedFieldId]);

  // Duplicate a field (including nested fields)
  const duplicateField = useCallback(() => {
    if (!selectedFieldId) return;
    
    // Find field and its parent
    let field: BuilderFieldConfig | null = null;
    let parentId: string | null = null;
    
    field = config.fields.find(f => f.id === selectedFieldId) || null;
    if (!field) {
      // Check nested
      for (const f of config.fields) {
        if (f.type === 'group' && f.fields) {
          const nested = f.fields.find(nf => nf.id === selectedFieldId);
          if (nested) {
            field = nested;
            parentId = f.id;
            break;
          }
        }
      }
    }
    
    if (!field) return;

    const newField: BuilderFieldConfig = {
      ...field,
      id: generateFieldId(field.type),
      label: `${field.label} (Copy)`,
    };

    if (parentId) {
      // Duplicate within group
      setConfig(prev => ({
        ...prev,
        fields: prev.fields.map(f => {
          if (f.id === parentId && f.fields) {
            const index = f.fields.findIndex(nf => nf.id === selectedFieldId);
            const newFields = [...f.fields];
            newFields.splice(index + 1, 0, newField);
            return { ...f, fields: newFields };
          }
          return f;
        }),
      }));
    } else {
      // Duplicate at top level
      const index = config.fields.findIndex(f => f.id === selectedFieldId);
      setConfig(prev => {
        const newFields = [...prev.fields];
        newFields.splice(index + 1, 0, newField);
        return { ...prev, fields: newFields };
      });
    }

    setSelectedFieldId(newField.id);
  }, [selectedFieldId, config.fields]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  // Add a field to a group
  const addFieldToGroup = useCallback((groupId: string, type: FieldType) => {
    const template = FIELD_TEMPLATES.find(t => t.type === type);
    if (!template) return;

    const newField: BuilderFieldConfig = {
      id: generateFieldId(type),
      type,
      label: template.label,
      ...template.defaultConfig,
    };

    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(f => {
        if (f.id === groupId && f.type === 'group') {
          return {
            ...f,
            fields: [...(f.fields || []), newField],
          };
        }
        return f;
      }),
    }));

    setSelectedFieldId(newField.id);
  }, [config.fields]);

  // Find field by ID (including nested fields)
  const findFieldById = useCallback((id: string): { field: BuilderFieldConfig | null; parentId: string | null } => {
    // Check top-level fields
    const topLevelField = config.fields.find(f => f.id === id);
    if (topLevelField) return { field: topLevelField, parentId: null };

    // Check nested fields in groups
    for (const field of config.fields) {
      if (field.type === 'group' && field.fields) {
        const nested = field.fields.find(f => f.id === id);
        if (nested) return { field: nested, parentId: field.id };
      }
    }
    return { field: null, parentId: null };
  }, [config.fields]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Check if dragging from palette
    const activeData = active.data.current;
    const overData = over.data.current;
    
    if (activeData?.type === 'palette' && activeData?.template) {
      const template = activeData.template;
      
      // Check if dropping into a group
      if (overData?.type === 'group' && overData?.groupId) {
        // Don't allow dropping groups into groups
        if (template.type === 'group') {
          uiLib.Toast.warn({ title: 'Warning', message: 'Cannot nest groups inside groups' });
          return;
        }
        addFieldToGroup(overData.groupId, template.type);
        return;
      }
      
      // Add new field to canvas
      let insertIndex = config.fields.length;
      
      // If dropping on canvas drop zone itself (empty canvas or general drop area)
      if (over.id === 'canvas-drop-zone') {
        // Add at the end
        insertIndex = config.fields.length;
      }
      // If dropping on existing field, insert before it
      else if (config.fields.some(f => f.id === over.id)) {
        insertIndex = config.fields.findIndex(f => f.id === over.id);
      }
      
      addField(template.type, insertIndex);
      return;
    }

    // Reorder existing fields
    if (active.id !== over.id && over.id !== 'canvas-drop-zone') {
      // Check if dropping into a group
      if (overData?.type === 'group' && overData?.groupId) {
        // Move field into group
        const { field: sourceField, parentId } = findFieldById(String(active.id));
        if (sourceField && sourceField.type !== 'group') {
          // Remove from current location
          setConfig(prev => {
            let newFields = prev.fields;
            
            // Remove from top-level or parent group
            if (parentId) {
              newFields = newFields.map(f => {
                if (f.id === parentId && f.fields) {
                  return { ...f, fields: f.fields.filter(cf => cf.id !== sourceField.id) };
                }
                return f;
              });
            } else {
              newFields = newFields.filter(f => f.id !== sourceField.id);
            }
            
            // Add to target group
            return {
              ...prev,
              fields: newFields.map(f => {
                if (f.id === overData.groupId && f.type === 'group') {
                  return { ...f, fields: [...(f.fields || []), sourceField] };
                }
                return f;
              }),
            };
          });
          return;
        }
      }
      
      const oldIndex = config.fields.findIndex(f => f.id === active.id);
      const newIndex = config.fields.findIndex(f => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setConfig(prev => ({
          ...prev,
          fields: arrayMove(prev.fields, oldIndex, newIndex),
        }));
      }
    }
  };

  // Handle drag over (for drop zone highlighting)
  const handleDragOver = (event: DragOverEvent) => {
    // Could add visual feedback here
  };

  // Update modal settings
  const updateSettings = (updates: Partial<ModalConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Update button
  const updateButton = (index: number, updates: Partial<BuilderButtonConfig>) => {
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.map((btn, i) => (i === index ? { ...btn, ...updates } : btn)),
    }));
  };

  // Add button
  const addButton = () => {
    const newButton: BuilderButtonConfig = {
      id: `button${config.buttons.length + 1}`,
      label: 'New Button',
      setFocus: false,
    };
    setConfig(prev => ({
      ...prev,
      buttons: [...prev.buttons, newButton],
    }));
  };

  // Remove button
  const removeButton = (index: number) => {
    setConfig(prev => ({
      ...prev,
      buttons: prev.buttons.filter((_, i) => i !== index),
    }));
  };

  // Save configuration
  const handleSave = async () => {
    const result = await uiLib.ModalHelpers.prompt('Save Configuration', 'Enter a name for this configuration:');
    if (result) {
      saveToStorage(result, config);
      uiLib.Toast.success({ title: 'Saved', message: `Configuration "${result}" saved` });
    }
  };

  // Load configuration
  const handleLoad = async () => {
    const saved = listSavedConfigs();
    if (saved.length === 0) {
      uiLib.Toast.info({ title: 'Info', message: 'No saved configurations found' });
      return;
    }

    const modal = new uiLib.Modal({
      title: 'Load Configuration',
      size: 'small',
      fields: [
        {
          id: 'configSelect',
          label: 'Select Configuration',
          type: 'select',
          options: saved,
          required: true,
        },
      ],
      buttons: [
        new uiLib.Button({ label: 'Cancel', callback: () => {}, id: 'cancel' }),
        new uiLib.Button({
          label: 'Load',
          callback: () => {
            const selected = modal.getFieldValue('configSelect');
            if (selected) {
              const loaded = loadFromStorage(selected);
              if (loaded) {
                setConfig(loaded);
                setSelectedFieldId(null);
                uiLib.Toast.success({ title: 'Loaded', message: `Configuration: ${selected}` });
              }
            }
            // Return void to close modal
          },
          setFocus: true,
          requiresValidation: true,
          id: 'load',
        }),
        new uiLib.Button({
          label: 'Delete',
          callback: () => {
            const selected = modal.getFieldValue('configSelect');
            if (selected) {
              deleteFromStorage(selected);
              uiLib.Toast.info({ title: 'Deleted', message: `Configuration: ${selected}` });
            }
            return false; // Keep modal open after delete
          },
          isDestructive: true,
          id: 'delete',
        }),
      ],
    });
    modal.show();
  };

  // Import code
  const handleImport = async () => {
    const modal = new uiLib.Modal({
      title: 'Import Code',
      message: 'Paste your modal code below:',
      size: 'large',
      fields: [
        {
          id: 'code',
          label: 'JavaScript Code',
          type: 'textarea',
          rows: 12,
          placeholder: 'const modal = new uiLib.Modal({ ... });',
          required: true,
        },
      ],
      buttons: [
        new uiLib.Button({ label: 'Cancel', callback: () => {}, id: 'cancel' }),
        new uiLib.Button({
          label: 'Import',
          callback: () => {
            const code = modal.getFieldValue('code');
            const parsed = parseModalCode(code);
            if (parsed) {
              setConfig(parsed);
              setSelectedFieldId(null);
              uiLib.Toast.success({ title: 'Imported', message: 'Code imported successfully' });
            } else {
              uiLib.Toast.error({ title: 'Error', message: 'Failed to parse code' });
              return false;
            }
            // Return void to close on success
          },
          setFocus: true,
          requiresValidation: true,
          id: 'import',
        }),
      ],
    });
    modal.show();
  };

  // Reset to default
  const handleReset = async () => {
    const confirmed = await uiLib.ModalHelpers.confirm('Reset Builder', 'Are you sure? All unsaved changes will be lost.');
    if (confirmed) {
      setConfig(DEFAULT_MODAL_CONFIG);
      setSelectedFieldId(null);
    }
  };

  // Toggle wizard mode
  const toggleWizardMode = () => {
    if (config.isWizard) {
      // Switch to regular modal - move first step fields to main fields
      const firstStepFields = config.steps?.[0]?.fields || [];
      setConfig(prev => ({
        ...prev,
        isWizard: false,
        fields: firstStepFields,
        steps: [],
      }));
    } else {
      // Switch to wizard - move current fields to first step
      setConfig(prev => ({
        ...prev,
        isWizard: true,
        steps: [
          {
            id: 'step1',
            label: 'Step 1',
            fields: prev.fields,
          },
        ],
        fields: [],
      }));
    }
  };

  // Add wizard step
  const addWizardStep = () => {
    if (!config.isWizard) return;
    const newStep: WizardStepConfig = {
      id: `step${(config.steps?.length || 0) + 1}`,
      label: `Step ${(config.steps?.length || 0) + 1}`,
      fields: [],
    };
    setConfig(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep],
    }));
  };

  return (
    <div className="modal-builder">
      {/* Beta Banner */}
      <MessageBar intent="warning" style={{ marginBottom: tokens.spacingVerticalM }}>
        <MessageBarBody>
          <strong>Beta Feature:</strong> The Modal Builder is currently in beta. Some features may be incomplete or change in future releases.
        </MessageBarBody>
      </MessageBar>

      {/* Toolbar */}
      <Toolbar className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <ToolbarButton icon={ToolbarIcons.save} onClick={handleSave} title="Save configuration">
            Save
          </ToolbarButton>
          <ToolbarButton icon={ToolbarIcons.load} onClick={handleLoad} title="Load saved configuration">
            Load
          </ToolbarButton>
          <ToolbarButton icon={ToolbarIcons.import} onClick={handleImport} title="Import from code">
            Import
          </ToolbarButton>
          <ToolbarDivider />
          <ToolbarButton
            appearance={config.isWizard ? 'primary' : undefined}
            icon={config.isWizard ? ToolbarIcons.multiStep : ToolbarIcons.singlePage}
            onClick={toggleWizardMode}
            title="Toggle wizard mode"
          >
            {config.isWizard ? 'Multi-Step' : 'Single Page'}
          </ToolbarButton>
          {config.isWizard && (
            <ToolbarButton icon={<Add24Regular />} onClick={addWizardStep} title="Add wizard step">
              Add Step
            </ToolbarButton>
          )}
        </div>
        <div className={styles.toolbarRight}>
          <ToolbarButton
            appearance={showSettings ? 'primary' : undefined}
            icon={ToolbarIcons.settings}
            onClick={() => setShowSettings(!showSettings)}
          >
            Settings
          </ToolbarButton>
          <ToolbarButton icon={ToolbarIcons.reset} onClick={handleReset} title="Reset to default">
            Reset
          </ToolbarButton>
        </div>
      </Toolbar>

      {/* Settings Panel */}
      {showSettings && (
        <div className={styles.settingsPanel}>
          <div className={styles.settingsRow}>
            <Field label="Title" className={styles.settingsField}>
              <Input
                value={config.title}
                onChange={(e, data) => updateSettings({ title: data.value })}
                appearance="filled-darker"
              />
            </Field>
            <Field label="Size" className={styles.settingsField}>
              <Dropdown
                value={config.size}
                selectedOptions={[config.size]}
                onOptionSelect={(e, data) => updateSettings({ size: data.optionValue as ModalConfig['size'] })}
                appearance="filled-darker"
              >
                <Option value="small">Small</Option>
                <Option value="medium">Medium</Option>
                <Option value="large">Large</Option>
                <Option value="fullscreen">Fullscreen</Option>
                <Option value="custom">Custom</Option>
              </Dropdown>
            </Field>
            {config.size === 'custom' && (
              <>
                <Field label="Width" className={styles.settingsFieldSmall}>
                  <SpinButton
                    value={config.customWidth || 600}
                    onChange={(e, data) => updateSettings({ customWidth: data.value || 600 })}
                    appearance="filled-darker"
                  />
                </Field>
                <Field label="Height" className={styles.settingsFieldSmall}>
                  <SpinButton
                    value={config.customHeight || 400}
                    onChange={(e, data) => updateSettings({ customHeight: data.value || 400 })}
                    appearance="filled-darker"
                  />
                </Field>
              </>
            )}
          </div>
          <div className={styles.settingsRow}>
            <Field label="Message" className={styles.settingsField}>
              <Input
                value={config.message || ''}
                onChange={(e, data) => updateSettings({ message: data.value })}
                placeholder="Optional message text"
                appearance="filled-darker"
              />
            </Field>
            <Field label="Button Alignment" className={styles.settingsField}>
              <Dropdown
                value={config.buttonAlignment || 'right'}
                selectedOptions={[config.buttonAlignment || 'right']}
                onOptionSelect={(e, data) => updateSettings({ buttonAlignment: data.optionValue as ModalConfig['buttonAlignment'] })}
                appearance="filled-darker"
              >
                <Option value="left">Left</Option>
                <Option value="center">Center</Option>
                <Option value="right">Right</Option>
                <Option value="space-between">Space Between</Option>
              </Dropdown>
            </Field>
          </div>
          <div className={styles.checkboxGroup}>
            <Checkbox
              checked={config.draggable || false}
              onChange={(e, data) => updateSettings({ draggable: data.checked === true })}
              label="Draggable"
            />
            <Checkbox
              checked={config.allowDismiss || false}
              onChange={(e, data) => updateSettings({ allowDismiss: data.checked === true })}
              label="Click Outside to Close"
            />
            <Checkbox
              checked={config.allowEscapeClose !== false}
              onChange={(e, data) => updateSettings({ allowEscapeClose: data.checked === true })}
              label="Press Escape to Close"
            />
          </div>

          {/* Buttons Section */}
          <div className={styles.buttonsSection}>
            <Text weight="semibold" size={300}>Buttons</Text>
            {config.buttons.map((btn, index) => (
              <div key={btn.id} className={styles.buttonRow}>
                <Input
                  value={btn.label}
                  onChange={(e, data) => updateButton(index, { label: data.value })}
                  placeholder="Label"
                  appearance="filled-darker"
                  className={styles.buttonInput}
                />
                <Checkbox
                  checked={btn.setFocus || false}
                  onChange={(e, data) => updateButton(index, { setFocus: data.checked === true })}
                  label="Primary"
                />
                <Checkbox
                  checked={btn.requiresValidation || false}
                  onChange={(e, data) => updateButton(index, { requiresValidation: data.checked === true })}
                  label="Validation"
                />
                <Checkbox
                  checked={btn.isDestructive || false}
                  onChange={(e, data) => updateButton(index, { isDestructive: data.checked === true })}
                  label="Destructive"
                />
                <Button
                  icon={<Dismiss24Regular />}
                  appearance="subtle"
                  onClick={() => removeButton(index)}
                  title="Remove button"
                />
              </div>
            ))}
            <Button
              icon={<Add24Regular />}
              appearance="subtle"
              onClick={addButton}
            >
              Add Button
            </Button>
          </div>
        </div>
      )}

      {/* Main Builder Area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="builder-main">
          {/* Field Palette */}
          <FieldPalette />

          {/* Fields Canvas */}
          <div className="builder-canvas">
            <div className="builder-canvas__header">
              <Text weight="semibold" size={400}>Fields</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{config.fields.length} fields</Text>
            </div>
            
            <DroppableCanvas isEmpty={config.fields.length === 0}>
              <SortableContext items={config.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                {config.fields.length === 0 ? (
                  <div className="builder-canvas__empty">
                    <span className="builder-canvas__empty-icon">{ToolbarIcons.emptyCanvas}</span>
                    <Text>Drag fields here to build your modal</Text>
                  </div>
                ) : (
                  config.fields.map(field => (
                    <SortableField
                      key={field.id}
                      field={field}
                      isSelected={field.id === selectedFieldId}
                      onSelect={() => setSelectedFieldId(field.id)}
                      onSelectChild={(childId) => setSelectedFieldId(childId)}
                      selectedChildId={selectedFieldId}
                      allFields={config.fields}
                    />
                  ))
                )}
              </SortableContext>
            </DroppableCanvas>
          </div>

          {/* Field Editor */}
          <FieldEditor
            field={selectedField}
            allFields={config.fields}
            onChange={updateField}
            onDelete={deleteField}
            onDuplicate={duplicateField}
          />
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && (
            <div className="builder-field builder-field--dragging">
              {(() => {
                const field = config.fields.find(f => f.id === activeId);
                if (field) {
                  return (
                    <>
                      <span className="builder-field__icon">{getFieldIcon(field.type)}</span>
                      <div className="builder-field__info">
                        <span className="builder-field__label">{field.label}</span>
                        <span className="builder-field__type">{field.type}</span>
                      </div>
                    </>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Preview Panel */}
      <Preview config={config} />
    </div>
  );
};

export default ModalBuilder;
