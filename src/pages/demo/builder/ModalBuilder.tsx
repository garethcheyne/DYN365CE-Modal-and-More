/**
 * Modal Builder - Main builder component with drag & drop
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
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
  exportAsJson,
  importFromJson,
} from './CodeGenerator';
import * as uiLib from '../../../index';

// Fluent UI styles
const useBuilderStyles = makeStyles({
  toolbar: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    width: '100%',
    boxSizing: 'border-box',
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
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Resolve the active step (wizard mode). Falls back to first step when
  // activeStepId is stale or not set.
  const resolvedStepId =
    config.isWizard && config.steps && config.steps.length > 0
      ? (config.steps.some(s => s.id === activeStepId) ? activeStepId : config.steps[0].id)
      : null;

  // "Current fields" = the fields being edited right now. In wizard mode this
  // is the active step's fields; otherwise the top-level fields.
  const currentFields: BuilderFieldConfig[] =
    config.isWizard && resolvedStepId
      ? (config.steps?.find(s => s.id === resolvedStepId)?.fields ?? [])
      : config.fields;

  // Update the current field list (wizard-aware). Wraps setConfig so all
  // mutations can stay agnostic of wizard vs. single-page mode.
  const updateFieldsList = useCallback(
    (updater: (fields: BuilderFieldConfig[]) => BuilderFieldConfig[]) => {
      setConfig(prev => {
        if (prev.isWizard && prev.steps && prev.steps.length > 0) {
          const stepId =
            prev.steps.some(s => s.id === activeStepId) ? activeStepId : prev.steps[0].id;
          return {
            ...prev,
            steps: prev.steps.map(s =>
              s.id === stepId ? { ...s, fields: updater(s.fields) } : s
            ),
          };
        }
        return { ...prev, fields: updater(prev.fields) };
      });
    },
    [activeStepId]
  );

  // Get the selected field (including nested fields in groups) across every
  // step in wizard mode, so switching steps doesn't lose the selection reference.
  const getSelectedField = (): BuilderFieldConfig | null => {
    if (!selectedFieldId) return null;
    const pools: BuilderFieldConfig[][] =
      config.isWizard && config.steps ? config.steps.map(s => s.fields) : [config.fields];
    for (const pool of pools) {
      const topLevel = pool.find(f => f.id === selectedFieldId);
      if (topLevel) return topLevel;
      for (const field of pool) {
        if (field.type === 'group' && field.fields) {
          const nested = field.fields.find(f => f.id === selectedFieldId);
          if (nested) return nested;
        }
      }
    }
    return null;
  };
  const selectedField = getSelectedField();

  // Generate unique field ID (scoped to the entire config so wizard steps don't clash)
  const generateFieldId = (type: FieldType): string => {
    const baseId = type.toLowerCase();
    const allIds = new Set<string>();
    const collect = (fields: BuilderFieldConfig[]) => {
      for (const f of fields) {
        allIds.add(f.id);
        if (f.type === 'group' && f.fields) collect(f.fields);
      }
    };
    if (config.isWizard && config.steps) {
      config.steps.forEach(s => collect(s.fields));
    } else {
      collect(config.fields);
    }
    let counter = 1;
    while (allIds.has(`${baseId}${counter}`)) counter++;
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
      const list = prev.isWizard && prev.steps && prev.steps.length > 0
        ? (prev.steps.find(s => s.id === (prev.steps!.some(s => s.id === activeStepId) ? activeStepId : prev.steps![0].id))?.fields ?? [])
        : prev.fields;
      const newList = [...list];
      if (index !== undefined) newList.splice(index, 0, newField);
      else newList.push(newField);

      if (prev.isWizard && prev.steps && prev.steps.length > 0) {
        const stepId = prev.steps.some(s => s.id === activeStepId) ? activeStepId : prev.steps[0].id;
        return {
          ...prev,
          steps: prev.steps.map(s => (s.id === stepId ? { ...s, fields: newList } : s)),
        };
      }
      return { ...prev, fields: newList };
    });

    setSelectedFieldId(newField.id);
  }, [activeStepId]);

  // Update a field (including nested fields in groups). Wizard-aware.
  const updateField = useCallback((updatedField: BuilderFieldConfig) => {
    const mapFields = (fields: BuilderFieldConfig[]): BuilderFieldConfig[] =>
      fields.map(f => {
        if (f.id === updatedField.id) return updatedField;
        if (f.type === 'group' && f.fields) {
          return { ...f, fields: f.fields.map(nf => (nf.id === updatedField.id ? updatedField : nf)) };
        }
        return f;
      });
    setConfig(prev => {
      if (prev.isWizard && prev.steps) {
        return { ...prev, steps: prev.steps.map(s => ({ ...s, fields: mapFields(s.fields) })) };
      }
      return { ...prev, fields: mapFields(prev.fields) };
    });
  }, []);

  // Delete the currently-selected field (top-level or nested). Wizard-aware.
  const deleteField = useCallback(() => {
    if (!selectedFieldId) return;
    const filterFields = (fields: BuilderFieldConfig[]): BuilderFieldConfig[] => {
      if (fields.some(f => f.id === selectedFieldId)) {
        return fields.filter(f => f.id !== selectedFieldId);
      }
      return fields.map(f => {
        if (f.type === 'group' && f.fields) {
          return { ...f, fields: f.fields.filter(nf => nf.id !== selectedFieldId) };
        }
        return f;
      });
    };
    setConfig(prev => {
      if (prev.isWizard && prev.steps) {
        return { ...prev, steps: prev.steps.map(s => ({ ...s, fields: filterFields(s.fields) })) };
      }
      return { ...prev, fields: filterFields(prev.fields) };
    });
    setSelectedFieldId(null);
  }, [selectedFieldId]);

  // Duplicate the currently-selected field (top-level or nested). Wizard-aware.
  const duplicateField = useCallback(() => {
    if (!selectedFieldId) return;

    // Search across every pool (regular fields or every step's fields) to find
    // the source field + its parent group (if nested).
    const pools: BuilderFieldConfig[][] =
      config.isWizard && config.steps ? config.steps.map(s => s.fields) : [config.fields];
    let source: BuilderFieldConfig | null = null;
    let parentId: string | null = null;
    for (const pool of pools) {
      const top = pool.find(f => f.id === selectedFieldId);
      if (top) { source = top; break; }
      for (const f of pool) {
        if (f.type === 'group' && f.fields) {
          const nested = f.fields.find(nf => nf.id === selectedFieldId);
          if (nested) { source = nested; parentId = f.id; break; }
        }
      }
      if (source) break;
    }
    if (!source) return;

    const newField: BuilderFieldConfig = {
      ...source,
      id: generateFieldId(source.type),
      label: `${source.label} (Copy)`,
    };

    const insertIntoList = (fields: BuilderFieldConfig[]): BuilderFieldConfig[] => {
      if (parentId) {
        return fields.map(f => {
          if (f.id === parentId && f.fields) {
            const idx = f.fields.findIndex(nf => nf.id === selectedFieldId);
            if (idx === -1) return f;
            const next = [...f.fields];
            next.splice(idx + 1, 0, newField);
            return { ...f, fields: next };
          }
          return f;
        });
      }
      const idx = fields.findIndex(f => f.id === selectedFieldId);
      if (idx === -1) return fields;
      const next = [...fields];
      next.splice(idx + 1, 0, newField);
      return next;
    };

    setConfig(prev => {
      if (prev.isWizard && prev.steps) {
        return { ...prev, steps: prev.steps.map(s => ({ ...s, fields: insertIntoList(s.fields) })) };
      }
      return { ...prev, fields: insertIntoList(prev.fields) };
    });

    setSelectedFieldId(newField.id);
  }, [selectedFieldId, config.isWizard, config.steps, config.fields]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  // Add a field to a group inside the current editing surface. Wizard-aware.
  const addFieldToGroup = useCallback((groupId: string, type: FieldType) => {
    const template = FIELD_TEMPLATES.find(t => t.type === type);
    if (!template) return;

    const newField: BuilderFieldConfig = {
      id: generateFieldId(type),
      type,
      label: template.label,
      ...template.defaultConfig,
    };

    updateFieldsList(fields =>
      fields.map(f => {
        if (f.id === groupId && f.type === 'group') {
          return { ...f, fields: [...(f.fields || []), newField] };
        }
        return f;
      })
    );

    setSelectedFieldId(newField.id);
  }, [updateFieldsList]);

  // Find field by ID within the current editing surface (wizard-aware)
  const findFieldById = useCallback((id: string): { field: BuilderFieldConfig | null; parentId: string | null } => {
    const topLevelField = currentFields.find(f => f.id === id);
    if (topLevelField) return { field: topLevelField, parentId: null };

    for (const field of currentFields) {
      if (field.type === 'group' && field.fields) {
        const nested = field.fields.find(f => f.id === id);
        if (nested) return { field: nested, parentId: field.id };
      }
    }
    return { field: null, parentId: null };
  }, [currentFields]);

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

      // Add new field to canvas (wizard-aware via addField → updateFieldsList)
      let insertIndex = currentFields.length;

      if (over.id === 'canvas-drop-zone') {
        insertIndex = currentFields.length;
      } else if (currentFields.some(f => f.id === over.id)) {
        insertIndex = currentFields.findIndex(f => f.id === over.id);
      }

      addField(template.type, insertIndex);
      return;
    }

    // Reorder existing fields
    if (active.id !== over.id && over.id !== 'canvas-drop-zone') {
      // Check if dropping into a group
      if (overData?.type === 'group' && overData?.groupId) {
        const { field: sourceField, parentId } = findFieldById(String(active.id));
        if (sourceField && sourceField.type !== 'group') {
          updateFieldsList(fields => {
            let next = fields;
            if (parentId) {
              next = next.map(f =>
                f.id === parentId && f.fields
                  ? { ...f, fields: f.fields.filter(cf => cf.id !== sourceField.id) }
                  : f
              );
            } else {
              next = next.filter(f => f.id !== sourceField.id);
            }
            return next.map(f =>
              f.id === overData.groupId && f.type === 'group'
                ? { ...f, fields: [...(f.fields || []), sourceField] }
                : f
            );
          });
          return;
        }
      }

      const oldIndex = currentFields.findIndex(f => f.id === active.id);
      const newIndex = currentFields.findIndex(f => f.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        updateFieldsList(fields => arrayMove(fields, oldIndex, newIndex));
      }
    }
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

  // Import configuration (JSON round-trip)
  const handleImport = async () => {
    const modal = new uiLib.Modal({
      title: 'Import Configuration',
      message: 'Paste a builder configuration (JSON) below. Use "Export JSON" to produce a compatible payload.',
      size: 'large',
      fields: [
        {
          id: 'json',
          label: 'Configuration JSON',
          type: 'textarea',
          rows: 12,
          placeholder: '{\n  "title": "My Modal",\n  "fields": [ ... ],\n  "buttons": [ ... ]\n}',
          required: true,
        },
      ],
      buttons: [
        new uiLib.Button({ label: 'Cancel', callback: () => {}, id: 'cancel' }),
        new uiLib.Button({
          label: 'Import',
          callback: () => {
            const json = modal.getFieldValue('json');
            const parsed = importFromJson(json);
            if (parsed) {
              setConfig(parsed);
              setSelectedFieldId(null);
              setActiveStepId(parsed.isWizard ? parsed.steps?.[0]?.id ?? null : null);
              uiLib.Toast.success({ title: 'Imported', message: 'Configuration loaded' });
            } else {
              uiLib.Toast.error({ title: 'Invalid JSON', message: 'Could not parse the configuration. Check the JSON is well-formed.' });
              return false;
            }
          },
          setFocus: true,
          requiresValidation: true,
          id: 'import',
        }),
      ],
    });
    modal.show();
  };

  // Export configuration as JSON (copy to clipboard)
  const handleExportJson = async () => {
    const json = exportAsJson(config);
    try {
      await navigator.clipboard.writeText(json);
      uiLib.Toast.success({ title: 'Copied', message: 'Configuration JSON copied to clipboard' });
    } catch {
      // Fallback: show modal with the JSON
      new uiLib.Modal({
        title: 'Export Configuration',
        message: 'Copy the JSON below to save your configuration:',
        size: 'large',
        fields: [
          { id: 'json', label: 'Configuration JSON', type: 'textarea', rows: 16, value: json, readOnly: true },
        ],
        buttons: [new uiLib.Button({ label: 'Close', callback: () => {}, id: 'close' })],
      }).show();
    }
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
      // Switch to regular modal - collapse all step fields into main fields
      const allStepFields = (config.steps ?? []).flatMap(s => s.fields);
      setConfig(prev => ({
        ...prev,
        isWizard: false,
        fields: allStepFields,
        steps: [],
      }));
      setActiveStepId(null);
    } else {
      // Switch to wizard - move current fields to first step
      const firstStep: WizardStepConfig = {
        id: 'step1',
        label: 'Step 1',
        fields: config.fields,
      };
      setConfig(prev => ({
        ...prev,
        isWizard: true,
        steps: [firstStep],
        fields: [],
      }));
      setActiveStepId(firstStep.id);
    }
    setSelectedFieldId(null);
  };

  // Add a new empty wizard step
  const addWizardStep = () => {
    if (!config.isWizard) {
      // Turn on wizard mode first
      toggleWizardMode();
      return;
    }
    // Pick a unique step id
    const existing = new Set((config.steps ?? []).map(s => s.id));
    let n = (config.steps?.length ?? 0) + 1;
    let newId = `step${n}`;
    while (existing.has(newId)) { n++; newId = `step${n}`; }

    const newStep: WizardStepConfig = {
      id: newId,
      label: `Step ${n}`,
      fields: [],
    };
    setConfig(prev => ({ ...prev, steps: [...(prev.steps || []), newStep] }));
    setActiveStepId(newId);
    setSelectedFieldId(null);
  };

  // Remove a wizard step (keeps at least one step)
  const removeWizardStep = (stepId: string) => {
    if (!config.isWizard || !config.steps || config.steps.length <= 1) return;
    setConfig(prev => {
      const nextSteps = (prev.steps ?? []).filter(s => s.id !== stepId);
      return { ...prev, steps: nextSteps };
    });
    if (activeStepId === stepId) {
      const remaining = (config.steps ?? []).filter(s => s.id !== stepId);
      setActiveStepId(remaining[0]?.id ?? null);
    }
    setSelectedFieldId(null);
  };

  // Rename a wizard step
  const renameStep = (stepId: string, label: string) => {
    setConfig(prev => ({
      ...prev,
      steps: (prev.steps ?? []).map(s => (s.id === stepId ? { ...s, label } : s)),
    }));
  };

  // Keyboard shortcuts: Delete to remove selected field, Escape to clear selection.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        if (selectedFieldId) {
          setSelectedFieldId(null);
          e.preventDefault();
        }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditable && selectedFieldId) {
        deleteField();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedFieldId, deleteField]);

  return (
    <div className="modal-builder">
      {/* Toolbar */}
      <div className="builder-toolbar">
      <Toolbar className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <ToolbarButton icon={ToolbarIcons.save} onClick={handleSave} title="Save configuration">
            Save
          </ToolbarButton>
          <ToolbarButton icon={ToolbarIcons.load} onClick={handleLoad} title="Load saved configuration">
            Load
          </ToolbarButton>
          <ToolbarButton icon={ToolbarIcons.import} onClick={handleImport} title="Import configuration from JSON">
            Import
          </ToolbarButton>
          <ToolbarButton icon={ToolbarIcons.import} onClick={handleExportJson} title="Export configuration as JSON">
            Export JSON
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
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`${styles.settingsPanel} builder-settings`}>
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
      >
        <div className="builder-main">
          {/* Field Palette */}
          <FieldPalette />

          {/* Fields Canvas */}
          <div className="builder-canvas">
            <div className="builder-canvas__header">
              <Text weight="semibold" size={400}>Fields</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {currentFields.length} {currentFields.length === 1 ? 'field' : 'fields'}
              </Text>
            </div>

            {/* Wizard Step Tabs */}
            {config.isWizard && config.steps && config.steps.length > 0 && (
              <div className="builder-steps">
                {config.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`builder-steps__tab ${step.id === resolvedStepId ? 'builder-steps__tab--active' : ''}`}
                    onClick={() => { setActiveStepId(step.id); setSelectedFieldId(null); }}
                    title="Click to edit this step"
                  >
                    <span className="builder-steps__number">{index + 1}</span>
                    <input
                      type="text"
                      value={step.label}
                      onChange={(e) => renameStep(step.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="builder-steps__label"
                      aria-label={`Step ${index + 1} label`}
                    />
                    <span className="builder-steps__count">{step.fields.length}</span>
                    {config.steps!.length > 1 && (
                      <button
                        type="button"
                        className="builder-steps__remove"
                        onClick={(e) => { e.stopPropagation(); removeWizardStep(step.id); }}
                        title="Remove this step"
                        aria-label="Remove step"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="builder-steps__add"
                  onClick={addWizardStep}
                  title="Add a new step"
                >
                  + Step
                </button>
              </div>
            )}

            {/* Step Settings - show when in wizard mode to edit the active step */}
            {config.isWizard && resolvedStepId && (
              <div className="builder-step-settings">
                <div className="builder-step-settings__header">
                  <Text weight="semibold" size={200}>
                    Step settings
                  </Text>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                    Shown below the step indicator in this step
                  </Text>
                </div>
                <div className="builder-step-settings__row">
                  <Field label="Step label" className="builder-step-settings__field">
                    <Input
                      value={config.steps?.find(s => s.id === resolvedStepId)?.label ?? ''}
                      onChange={(_e, data) => renameStep(resolvedStepId, data.value)}
                      appearance="filled-darker"
                    />
                  </Field>
                  <Field label="Step message" className="builder-step-settings__field">
                    <Input
                      value={config.steps?.find(s => s.id === resolvedStepId)?.message ?? ''}
                      onChange={(_e, data) =>
                        setConfig(prev => ({
                          ...prev,
                          steps: (prev.steps ?? []).map(s =>
                            s.id === resolvedStepId ? { ...s, message: data.value } : s
                          ),
                        }))
                      }
                      placeholder="Optional plain-text message for this step"
                      appearance="filled-darker"
                    />
                  </Field>
                </div>
                <div className="builder-step-settings__row">
                  <Field label="Step HTML content" className="builder-step-settings__field builder-step-settings__field--full">
                    <textarea
                      className="builder-step-settings__textarea"
                      rows={2}
                      value={config.steps?.find(s => s.id === resolvedStepId)?.content ?? ''}
                      onChange={(e) =>
                        setConfig(prev => ({
                          ...prev,
                          steps: (prev.steps ?? []).map(s =>
                            s.id === resolvedStepId ? { ...s, content: e.target.value } : s
                          ),
                        }))
                      }
                      placeholder="Optional HTML rendered below the step message"
                    />
                  </Field>
                </div>
              </div>
            )}

            <DroppableCanvas isEmpty={currentFields.length === 0}>
              <SortableContext items={currentFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                {currentFields.length === 0 ? (
                  <div className="builder-canvas__empty">
                    <span className="builder-canvas__empty-icon">{ToolbarIcons.emptyCanvas}</span>
                    <Text>Drag fields here to build your modal</Text>
                  </div>
                ) : (
                  currentFields.map(field => (
                    <SortableField
                      key={field.id}
                      field={field}
                      isSelected={field.id === selectedFieldId}
                      onSelect={() => setSelectedFieldId(field.id)}
                      onSelectChild={(childId) => setSelectedFieldId(childId)}
                      selectedChildId={selectedFieldId}
                      allFields={currentFields}
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
