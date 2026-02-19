/**
 * Field Editor - Property panel for configuring fields
 * Uses Fluent UI components for consistent styling
 */

import React from 'react';
import {
  Input,
  Textarea,
  Checkbox,
  Dropdown,
  Option,
  Button,
  Field,
  SpinButton,
  makeStyles,
  tokens,
  Text,
} from '@fluentui/react-components';
import { CursorClick24Regular } from '@fluentui/react-icons';
import { BuilderFieldConfig, VisibilityCondition, AddressLookupConfig } from './types';
import { ToolbarIcons } from './icons';

const useStyles = makeStyles({
  editor: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    borderLeft: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  editorEmpty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    borderLeft: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
    textAlign: 'center' as const,
    padding: tokens.spacingHorizontalL,
  },
  placeholderIcon: {
    fontSize: '32px',
    color: tokens.colorNeutralForeground3,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  headerTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: tokens.spacingHorizontalM,
  },
  section: {
    marginBottom: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: tokens.spacingVerticalM,
    marginTop: 0,
  },
  field: {
    marginBottom: tokens.spacingVerticalS,
  },
  inlineCheckbox: {
    marginBottom: tokens.spacingVerticalXS,
  },
});

interface FieldEditorProps {
  field: BuilderFieldConfig | null;
  allFields: BuilderFieldConfig[];
  onChange: (field: BuilderFieldConfig) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  allFields,
  onChange,
  onDelete,
  onDuplicate,
}) => {
  const styles = useStyles();

  if (!field) {
    return (
      <div className={styles.editorEmpty}>
        <div className={styles.placeholder}>
          <CursorClick24Regular className={styles.placeholderIcon} />
          <Text>Select a field to edit its properties</Text>
        </div>
      </div>
    );
  }

  const updateField = (updates: Partial<BuilderFieldConfig>) => {
    onChange({ ...field, ...updates });
  };

  const updateVisibleWhen = (updates: Partial<VisibilityCondition> | null) => {
    if (updates === null) {
      updateField({ visibleWhen: undefined });
    } else {
      updateField({
        visibleWhen: {
          field: field.visibleWhen?.field || '',
          operator: field.visibleWhen?.operator || 'equals',
          value: field.visibleWhen?.value,
          ...updates,
        },
      });
    }
  };

  // Get other fields for visibility conditions (excluding current field)
  const otherFields = allFields.filter(f => f.id !== field.id);

  return (
    <div className={styles.editor}>
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>Field Properties</h3>
        <div className={styles.headerActions}>
          <Button
            appearance="subtle"
            icon={ToolbarIcons.duplicate}
            onClick={onDuplicate}
            title="Duplicate field"
            size="small"
          />
          <Button
            appearance="subtle"
            icon={ToolbarIcons.delete}
            onClick={onDelete}
            title="Delete field"
            size="small"
          />
        </div>
      </div>

      <div className={styles.content}>
        {/* Basic Properties */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Basic</h4>

          <Field label="ID" className={styles.field}>
            <Input
              value={field.id}
              onChange={(e, data) => updateField({ id: data.value })}
              appearance="filled-darker"
            />
          </Field>

          <Field label="Label" className={styles.field}>
            <Input
              value={field.label}
              onChange={(e, data) => updateField({ label: data.value })}
              appearance="filled-darker"
            />
          </Field>

          <Field label="Type" className={styles.field}>
            <Input
              value={field.type}
              disabled
              appearance="filled-darker"
            />
          </Field>

          {['text', 'email', 'number', 'textarea'].includes(field.type) && (
            <Field label="Placeholder" className={styles.field}>
              <Input
                value={field.placeholder || ''}
                onChange={(e, data) => updateField({ placeholder: data.value })}
                appearance="filled-darker"
              />
            </Field>
          )}

          {field.type === 'textarea' && (
            <Field label="Rows" className={styles.field}>
              <SpinButton
                value={field.rows || 4}
                onChange={(e, data) => updateField({ rows: data.value || 4 })}
                min={1}
                max={20}
                appearance="filled-darker"
              />
            </Field>
          )}

          <Field label="Tooltip" className={styles.field}>
            <Input
              value={field.tooltip || ''}
              onChange={(e, data) => updateField({ tooltip: data.value })}
              appearance="filled-darker"
            />
          </Field>
        </div>

        {/* Validation */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Validation</h4>

          <Checkbox
            checked={field.required || false}
            onChange={(e, data) => updateField({ required: data.checked === true })}
            label="Required"
            className={styles.inlineCheckbox}
          />

          <Checkbox
            checked={field.disabled || false}
            onChange={(e, data) => updateField({ disabled: data.checked === true })}
            label="Disabled"
            className={styles.inlineCheckbox}
          />
        </div>

        {/* Select Options */}
        {field.type === 'select' && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Options</h4>
            <Field label="Options (one per line)" className={styles.field}>
              <Textarea
                value={(field.options || []).join('\n')}
                onChange={(e, data) =>
                  updateField({
                    options: data.value.split('\n').filter(o => o.trim()),
                  })
                }
                resize="vertical"
                rows={4}
                appearance="filled-darker"
              />
            </Field>
          </div>
        )}

        {/* Lookup Properties */}
        {field.type === 'lookup' && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Lookup Settings</h4>

            <Field label="Entity Name" className={styles.field}>
              <Input
                value={field.entityName || ''}
                onChange={(e, data) => updateField({ entityName: data.value })}
                placeholder="e.g., account, contact"
                appearance="filled-darker"
              />
            </Field>

            <Field label="Columns (comma-separated)" className={styles.field}>
              <Input
                value={(field.lookupColumns || []).join(', ')}
                onChange={(e, data) =>
                  updateField({
                    lookupColumns: data.value.split(',').map(c => c.trim()).filter(c => c),
                  })
                }
                placeholder="name, email"
                appearance="filled-darker"
              />
            </Field>
          </div>
        )}

        {/* Address Lookup Properties */}
        {field.type === 'addressLookup' && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Address Lookup Settings</h4>

            <Field label="Provider" className={styles.field}>
              <Dropdown
                value={field.addressLookup?.provider || 'google'}
                selectedOptions={[field.addressLookup?.provider || 'google']}
                onOptionSelect={(e, data) =>
                  updateField({
                    addressLookup: { ...field.addressLookup, provider: data.optionValue as 'google' | 'azure' },
                  })
                }
                appearance="filled-darker"
              >
                <Option value="google">Google Places</Option>
                <Option value="azure">Azure Maps</Option>
              </Dropdown>
            </Field>

            <Field label="Country Restriction" className={styles.field}>
              <Input
                value={field.addressLookup?.countryRestriction || ''}
                onChange={(e, data) =>
                  updateField({
                    addressLookup: { ...field.addressLookup, countryRestriction: data.value },
                  })
                }
                placeholder="e.g., nz, au, us"
                appearance="filled-darker"
              />
            </Field>

            <Field label="Auto-populate Street Field" className={styles.field}>
              <Dropdown
                value={field.addressLookup?.streetField || ''}
                selectedOptions={field.addressLookup?.streetField ? [field.addressLookup.streetField] : []}
                onOptionSelect={(e, data) =>
                  updateField({
                    addressLookup: { ...field.addressLookup, streetField: data.optionValue || undefined },
                  })
                }
                appearance="filled-darker"
              >
                <Option value="">None</Option>
                {otherFields.filter(f => f.type === 'text').map(f => (
                  <Option key={f.id} value={f.id}>{f.label}</Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="Auto-populate City Field" className={styles.field}>
              <Dropdown
                value={field.addressLookup?.cityField || ''}
                selectedOptions={field.addressLookup?.cityField ? [field.addressLookup.cityField] : []}
                onOptionSelect={(e, data) =>
                  updateField({
                    addressLookup: { ...field.addressLookup, cityField: data.optionValue || undefined },
                  })
                }
                appearance="filled-darker"
              >
                <Option value="">None</Option>
                {otherFields.filter(f => f.type === 'text').map(f => (
                  <Option key={f.id} value={f.id}>{f.label}</Option>
                ))}
              </Dropdown>
            </Field>
          </div>
        )}

        {/* Table Properties */}
        {field.type === 'table' && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Table Settings</h4>

            <Field label="Selection Mode" className={styles.field}>
              <Dropdown
                value={field.selectionMode || 'single'}
                selectedOptions={[field.selectionMode || 'single']}
                onOptionSelect={(e, data) =>
                  updateField({ selectionMode: data.optionValue as 'none' | 'single' | 'multiple' })
                }
                appearance="filled-darker"
              >
                <Option value="none">No Selection</Option>
                <Option value="single">Single Row</Option>
                <Option value="multiple">Multiple Rows</Option>
              </Dropdown>
            </Field>
          </div>
        )}

        {/* Group Properties */}
        {field.type === 'group' && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Group Settings</h4>

            <Checkbox
              checked={field.asTabs || false}
              onChange={(e, data) => updateField({ asTabs: data.checked === true })}
              label="Render as Tabs"
              className={styles.inlineCheckbox}
            />

            {!field.asTabs && (
              <>
                <Checkbox
                  checked={field.border || false}
                  onChange={(e, data) => updateField({ border: data.checked === true })}
                  label="Show Border"
                  className={styles.inlineCheckbox}
                />

                <Checkbox
                  checked={field.collapsible || false}
                  onChange={(e, data) => updateField({ collapsible: data.checked === true })}
                  label="Collapsible"
                  className={styles.inlineCheckbox}
                />

                {field.collapsible && (
                  <Checkbox
                    checked={field.defaultCollapsed || false}
                    onChange={(e, data) => updateField({ defaultCollapsed: data.checked === true })}
                    label="Start Collapsed"
                    className={styles.inlineCheckbox}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Custom HTML */}
        {field.type === 'custom' && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Custom HTML</h4>
            <Field label="HTML Content" className={styles.field}>
              <Textarea
                value={field.html || ''}
                onChange={(e, data) => updateField({ html: data.value })}
                resize="vertical"
                rows={6}
                placeholder="<div>Custom content</div>"
                appearance="filled-darker"
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
            </Field>
          </div>
        )}

        {/* Conditional Visibility */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Conditional Visibility</h4>

          <Checkbox
            checked={!!field.visibleWhen}
            onChange={(e, data) => {
              if (data.checked === true) {
                updateVisibleWhen({
                  field: otherFields[0]?.id || '',
                  operator: 'equals',
                  value: '',
                });
              } else {
                updateVisibleWhen(null);
              }
            }}
            label="Enable Visibility Condition"
            className={styles.inlineCheckbox}
          />

          {field.visibleWhen && (
            <>
              <Field label="Show when field" className={styles.field}>
                <Dropdown
                  value={field.visibleWhen.field || ''}
                  selectedOptions={[field.visibleWhen.field || '']}
                  onOptionSelect={(e, data) => updateVisibleWhen({ field: data.optionValue || '' })}
                  appearance="filled-darker"
                >
                  <Option value="">Select a field...</Option>
                  {otherFields.map(f => (
                    <Option key={f.id} value={f.id}>
                      {`${f.label} (${f.id})`}
                    </Option>
                  ))}
                </Dropdown>
              </Field>

              <Field label="Operator" className={styles.field}>
                <Dropdown
                  value={field.visibleWhen.operator}
                  selectedOptions={[field.visibleWhen.operator]}
                  onOptionSelect={(e, data) =>
                    updateVisibleWhen({ operator: data.optionValue as VisibilityCondition['operator'] })
                  }
                  appearance="filled-darker"
                >
                  <Option value="equals">Equals</Option>
                  <Option value="notEquals">Not Equals</Option>
                  <Option value="contains">Contains</Option>
                  <Option value="greaterThan">Greater Than</Option>
                  <Option value="lessThan">Less Than</Option>
                  <Option value="truthy">Is Truthy (has value)</Option>
                  <Option value="falsy">Is Falsy (empty)</Option>
                </Dropdown>
              </Field>

              {!['truthy', 'falsy'].includes(field.visibleWhen.operator) && (
                <Field label="Value" className={styles.field}>
                  <Input
                    value={String(field.visibleWhen.value || '')}
                    onChange={(e, data) => updateVisibleWhen({ value: data.value })}
                    appearance="filled-darker"
                  />
                </Field>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldEditor;
