import React from 'react';
import { makeStyles, tokens, Button, Select, Option, Input, Text, Field, Spinner } from '@fluentui/react-components';
import {
  QueryBuilderOpenOptions,
  QueryBuilderState,
  QueryBuilderGroup,
  QueryBuilderCondition,
  QueryBuilderField,
  QueryBuilderApplyResult,
} from '../Modal/Modal.types';
import { UILIB } from '../Logger/Logger';

export interface QueryBuilderFluentUiProps extends Omit<QueryBuilderOpenOptions, 'title' | 'width' | 'height' | 'applyButtonText' | 'cancelButtonText' | 'onApply' | 'onCancel'> {
  onStateChange?: (state: QueryBuilderState) => void;
  onSerializedChange?: (result: QueryBuilderApplyResult) => void;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  toolbarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  caption: {
    color: tokens.colorNeutralForeground2,
  },
  addRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  groupsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  groupCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  groupHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  groupHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  rowGrid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr 1fr 1fr auto',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  staticLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
  },
  previewCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalS,
  },
  previewCode: {
    display: 'block',
    fontSize: tokens.fontSizeBase200,
    wordBreak: 'break-all',
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalXS,
  },
  loadingWrap: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: tokens.spacingVerticalXL,
    paddingBottom: tokens.spacingVerticalXL,
  },
});

const FALLBACK_FIELDS: QueryBuilderField[] = [
  { id: 'name', label: 'Name', dataType: 'string' },
  { id: 'createdon', label: 'Created On', dataType: 'datetime' },
  {
    id: 'statecode',
    label: 'State',
    dataType: 'optionset',
    options: [
      { label: 'Active', value: 0 },
      { label: 'Inactive', value: 1 },
    ],
  },
  { id: 'ownerid', label: 'Owner', dataType: 'lookup' },
];

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const dataTypeFromAttribute = (attribute: any): QueryBuilderField['dataType'] => {
  const type = String(attribute?.AttributeType || attribute?.Type || '').toLowerCase();
  if (['picklist', 'state', 'status'].includes(type)) return 'optionset';
  if (['lookup', 'customer', 'owner', 'partylist', 'uniqueidentifier'].includes(type)) return 'lookup';
  if (['datetime'].includes(type)) return 'datetime';
  if (['boolean'].includes(type)) return 'boolean';
  if (['integer', 'decimal', 'double', 'money', 'bigint', 'int'].includes(type)) return 'number';
  return 'string';
};

const getOperatorsForType = (dataType: QueryBuilderField['dataType']): Array<{ value: string; label: string }> => {
  const common = [
    { value: 'eq', label: 'Equals' },
    { value: 'ne', label: 'Not Equals' },
    { value: 'null', label: 'Is Empty' },
    { value: 'notnull', label: 'Has Value' },
  ];

  if (dataType === 'string') {
    return [
      { value: 'contains', label: 'Contains' },
      { value: 'notcontains', label: 'Does Not Contain' },
      { value: 'startswith', label: 'Starts With' },
      { value: 'endswith', label: 'Ends With' },
      ...common,
    ];
  }

  if (dataType === 'number' || dataType === 'datetime') {
    return [
      { value: 'gt', label: 'Greater Than' },
      { value: 'ge', label: 'Greater Than Or Equal' },
      { value: 'lt', label: 'Less Than' },
      { value: 'le', label: 'Less Than Or Equal' },
      { value: 'between', label: 'Between' },
      ...common,
    ];
  }

  return common;
};

const createCondition = (defaultField: QueryBuilderField): QueryBuilderCondition => ({
  id: `cond_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
  kind: 'field',
  fieldId: defaultField.id,
  operator: getOperatorsForType(defaultField.dataType)[0]?.value as any,
  value: '',
  value2: '',
});

const createRelatedCondition = (relatedEntityName?: string): QueryBuilderCondition => ({
  id: `rel_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
  kind: 'relatedEntity',
  fieldId: '__related_entity__',
  operator: 'containsdata',
  value: '',
  value2: '',
  relatedEntityName,
});

const createGroup = (defaultField: QueryBuilderField): QueryBuilderGroup => ({
  id: `grp_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
  logic: 'and',
  conditions: [createCondition(defaultField)],
});

const cloneState = (state: QueryBuilderState | undefined, defaultField: QueryBuilderField): QueryBuilderState => {
  if (!state?.groups?.length) {
    return { groups: [createGroup(defaultField)] };
  }

  return {
    groups: state.groups.map((group) => ({
      id: group.id || `grp_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      logic: group.logic || 'and',
      conditions: (group.conditions || []).map((condition) => ({
        id: condition.id || `cond_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        kind: condition.kind || 'field',
        fieldId: condition.fieldId || defaultField.id,
        operator: (condition.operator || 'eq') as any,
        value: condition.value ?? '',
        value2: condition.value2 ?? '',
        relatedEntityName: condition.relatedEntityName,
      })),
    })),
  };
};

export const serializeQueryBuilderState = (
  state: QueryBuilderState,
  fields: QueryBuilderField[],
  entityName: string,
): QueryBuilderApplyResult => {
  const defaultField = fields[0] || FALLBACK_FIELDS[0];

  const conditionToFetchXml = (condition: QueryBuilderCondition, field: QueryBuilderField): string => {
    if (condition.kind === 'relatedEntity') {
      const alias = escapeXml(condition.relatedEntityName || 'related');
      return `<condition entityname="${alias}" attribute="${alias}id" operator="not-null" />`;
    }

    const attr = escapeXml(condition.fieldId);
    const operatorMap: Record<string, string> = {
      eq: 'eq',
      ne: 'ne',
      gt: 'gt',
      ge: 'ge',
      lt: 'lt',
      le: 'le',
      null: 'null',
      notnull: 'not-null',
      contains: 'like',
      notcontains: 'not-like',
      startswith: 'like',
      endswith: 'like',
    };

    const operator = operatorMap[condition.operator] || 'eq';

    if (condition.operator === 'null' || condition.operator === 'notnull') {
      return `<condition attribute="${attr}" operator="${operator}" />`;
    }

    if (condition.operator === 'between') {
      return [
        `<condition attribute="${attr}" operator="ge" value="${escapeXml(String(condition.value ?? ''))}" />`,
        `<condition attribute="${attr}" operator="le" value="${escapeXml(String(condition.value2 ?? ''))}" />`,
      ].join('');
    }

    let value = condition.value;
    if (field.dataType === 'boolean') {
      value = value === true || value === 'true' || value === 1 || value === '1' ? '1' : '0';
    }

    if (condition.operator === 'contains' || condition.operator === 'notcontains') value = `%${value}%`;
    if (condition.operator === 'startswith') value = `${value}%`;
    if (condition.operator === 'endswith') value = `%${value}`;

    return `<condition attribute="${attr}" operator="${operator}" value="${escapeXml(String(value ?? ''))}" />`;
  };

  const conditionToOData = (condition: QueryBuilderCondition, field: QueryBuilderField): string => {
    if (condition.kind === 'relatedEntity') {
      return `${condition.relatedEntityName || 'related'} ne null`;
    }

    const quote = (val: any): string => {
      if (field.dataType === 'number') return String(val ?? 0);
      if (field.dataType === 'boolean') return (val === true || val === 'true' || val === 1 || val === '1') ? 'true' : 'false';
      return `'${String(val ?? '').replace(/'/g, "''")}'`;
    };

    switch (condition.operator) {
      case 'eq': return `${condition.fieldId} eq ${quote(condition.value)}`;
      case 'ne': return `${condition.fieldId} ne ${quote(condition.value)}`;
      case 'gt': return `${condition.fieldId} gt ${quote(condition.value)}`;
      case 'ge': return `${condition.fieldId} ge ${quote(condition.value)}`;
      case 'lt': return `${condition.fieldId} lt ${quote(condition.value)}`;
      case 'le': return `${condition.fieldId} le ${quote(condition.value)}`;
      case 'null': return `${condition.fieldId} eq null`;
      case 'notnull': return `${condition.fieldId} ne null`;
      case 'contains': return `contains(${condition.fieldId}, ${quote(condition.value)})`;
      case 'notcontains': return `not contains(${condition.fieldId}, ${quote(condition.value)})`;
      case 'startswith': return `startswith(${condition.fieldId}, ${quote(condition.value)})`;
      case 'endswith': return `endswith(${condition.fieldId}, ${quote(condition.value)})`;
      case 'between': return `(${condition.fieldId} ge ${quote(condition.value)} and ${condition.fieldId} le ${quote(condition.value2)})`;
      default: return `${condition.fieldId} eq ${quote(condition.value)}`;
    }
  };

  const filterParts = state.groups.map((group) => {
    const conditionsXml = group.conditions
      .map((condition) => {
        const field = fields.find((candidate) => candidate.id === condition.fieldId) || defaultField;
        return conditionToFetchXml(condition, field);
      })
      .join('');

    return `<filter type="${group.logic}">${conditionsXml}</filter>`;
  });

  const fetchXmlFilter = filterParts.length > 1
    ? `<filter type="and">${filterParts.join('')}</filter>`
    : (filterParts[0] || '<filter type="and"></filter>');

  const fetchXml = `<fetch version="1.0"><entity name="${escapeXml(entityName)}">${fetchXmlFilter}</entity></fetch>`;

  const odataFilter = state.groups
    .map((group) => {
      const rowFilters = group.conditions
        .map((condition) => {
          const field = fields.find((candidate) => candidate.id === condition.fieldId) || defaultField;
          return conditionToOData(condition, field);
        })
        .filter(Boolean);

      return rowFilters.length > 1 ? `(${rowFilters.join(` ${group.logic} `)})` : (rowFilters[0] || '');
    })
    .filter(Boolean)
    .join(' and ');

  return {
    state: JSON.parse(JSON.stringify(state)),
    fetchXmlFilter,
    fetchXml,
    odataFilter,
  };
};

export const QueryBuilderFluentUi: React.FC<QueryBuilderFluentUiProps> = (props) => {
  const styles = useStyles();
  const [loading, setLoading] = React.useState(false);
  const [availableFields, setAvailableFields] = React.useState<QueryBuilderField[]>(props.fields && props.fields.length ? props.fields : FALLBACK_FIELDS);
  const [dataSource, setDataSource] = React.useState<'live' | 'retained'>(props.initialDataSource || 'live');
  const [addAction, setAddAction] = React.useState<'row' | 'group' | 'related'>('row');

  const defaultField = availableFields[0] || FALLBACK_FIELDS[0];

  const [builderState, setBuilderState] = React.useState<QueryBuilderState>(() =>
    cloneState(props.initialState, defaultField)
  );

  React.useEffect(() => {
    if (props.fields && props.fields.length > 0) {
      setAvailableFields(props.fields);
    }
  }, [props.fields]);

  React.useEffect(() => {
    let disposed = false;

    const loadFields = async () => {
      if (props.fields && props.fields.length > 0) return;

      setLoading(true);
      try {
        const xrm = (window as any).Xrm;
        if (xrm?.Utility?.getEntityMetadata) {
          const metadata = await xrm.Utility.getEntityMetadata(props.entityName);
          const attributesCollection = metadata?.Attributes?._collection || metadata?.Attributes || {};
          const attributesArray = Array.isArray(attributesCollection)
            ? attributesCollection
            : Object.keys(attributesCollection).map((key) => attributesCollection[key]);

          const resolvedFields: QueryBuilderField[] = attributesArray
            .filter((attribute: any) => attribute?.LogicalName && attribute?.IsValidForAdvancedFind !== false)
            .slice(0, 100)
            .map((attribute: any) => {
              const dataType = dataTypeFromAttribute(attribute);
              const optionSet = attribute?.OptionSet?.Options;
              const options = dataType === 'optionset' && Array.isArray(optionSet)
                ? optionSet
                    .map((option: any) => ({
                      label: option?.Label?.UserLocalizedLabel?.Label || option?.Label || String(option?.Value),
                      value: option?.Value,
                    }))
                    .filter((option: any) => option.value !== undefined && option.value !== null)
                : undefined;

              return {
                id: attribute.LogicalName,
                label: attribute.DisplayName?.UserLocalizedLabel?.Label || attribute.DisplayName || attribute.SchemaName || attribute.LogicalName,
                dataType,
                options,
              };
            })
            .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }));

          if (!disposed && resolvedFields.length > 0) {
            setAvailableFields(resolvedFields);
          }
        }
      } catch (error) {
        console.warn(...UILIB, '[QueryBuilderFluentUi] Falling back to local fields', error);
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    loadFields();
    return () => {
      disposed = true;
    };
  }, [props.entityName, props.fields]);

  React.useEffect(() => {
    if (!builderState.groups.length && defaultField) {
      setBuilderState({ groups: [createGroup(defaultField)] });
    }
  }, [builderState.groups.length, defaultField]);

  React.useEffect(() => {
    props.onStateChange?.(builderState);
    props.onSerializedChange?.(serializeQueryBuilderState(builderState, availableFields, props.entityName));
  }, [builderState, availableFields, props]);

  const updateGroup = React.useCallback((groupId: string, updater: (group: QueryBuilderGroup) => QueryBuilderGroup) => {
    setBuilderState((previous) => ({
      groups: previous.groups.map((group) => (group.id === groupId ? updater(group) : group)),
    }));
  }, []);

  const removeCondition = React.useCallback((groupId: string, conditionId: string) => {
    updateGroup(groupId, (group) => {
      const remaining = group.conditions.filter((condition) => condition.id !== conditionId);
      return {
        ...group,
        conditions: remaining.length > 0 ? remaining : [createCondition(defaultField)],
      };
    });
  }, [defaultField, updateGroup]);

  const addItem = React.useCallback(() => {
    setBuilderState((previous) => {
      if (addAction === 'group') {
        if (props.allowGroups === false) return previous;
        return { groups: [...previous.groups, createGroup(defaultField)] };
      }

      if (addAction === 'related') {
        if (props.allowRelatedEntity === false) return previous;
        const firstGroup = previous.groups[0] || createGroup(defaultField);
        const relatedName = props.relatedEntities?.[0]?.id;
        const updatedFirst = {
          ...firstGroup,
          conditions: [...firstGroup.conditions, createRelatedCondition(relatedName)],
        };

        return {
          groups: previous.groups.length
            ? [updatedFirst, ...previous.groups.slice(1)]
            : [updatedFirst],
        };
      }

      const firstGroup = previous.groups[0] || createGroup(defaultField);
      const updatedFirst = {
        ...firstGroup,
        conditions: [...firstGroup.conditions, createCondition(defaultField)],
      };

      return {
        groups: previous.groups.length
          ? [updatedFirst, ...previous.groups.slice(1)]
          : [updatedFirst],
      };
    });
  }, [addAction, defaultField, props.allowGroups, props.allowRelatedEntity, props.relatedEntities]);

  const onReset = React.useCallback(() => {
    const nextState = cloneState(props.defaultState, defaultField);
    setBuilderState(nextState);
    props.onResetToDefault?.(nextState);
  }, [defaultField, props]);

  const onDeleteAll = React.useCallback(() => {
    setBuilderState({ groups: [createGroup(defaultField)] });
    props.onDeleteAllFilters?.();
  }, [defaultField, props]);

  const onDownloadFetchXml = React.useCallback(() => {
    const payload = serializeQueryBuilderState(builderState, availableFields, props.entityName);
    const blob = new Blob([payload.fetchXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${props.entityName}-filters.xml`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [availableFields, builderState, props.entityName]);

  const toggleDataSource = React.useCallback(() => {
    const nextSource = dataSource === 'live' ? 'retained' : 'live';
    setDataSource(nextSource);
    props.onDataSourceChange?.(nextSource);
  }, [dataSource, props]);

  const serialized = serializeQueryBuilderState(builderState, availableFields, props.entityName);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          {props.showResetToDefaultButton !== false && (
            <Button size="small" appearance="secondary" onClick={onReset}>Reset to default</Button>
          )}
          {props.showDownloadFetchXmlButton !== false && (
            <Button size="small" appearance="secondary" onClick={onDownloadFetchXml}>Download FetchXML</Button>
          )}
          {props.showDeleteAllFiltersButton !== false && (
            <Button size="small" appearance="secondary" onClick={onDeleteAll}>Delete all filters</Button>
          )}
        </div>

        <div className={styles.toolbarGroup}>
          {props.showDataSourceToggle && (
            <>
              <Text size={200} className={styles.caption}>
                {dataSource === 'retained'
                  ? (props.retainedDataLabel || 'Showing retained data')
                  : (props.liveDataLabel || 'Showing live data')}
              </Text>
              <Button size="small" appearance="secondary" onClick={toggleDataSource}>
                {dataSource === 'retained'
                  ? (props.changeToLiveDataLabel || 'Change to live data')
                  : (props.changeToRetainedDataLabel || 'Change to retained data')}
              </Button>
            </>
          )}
          <Text size={200} className={styles.caption}>Edit filters: {props.entityDisplayName || props.entityName}</Text>
        </div>
      </div>

      <div className={styles.addRow}>
        <Button appearance="secondary" onClick={addItem}>+ Add</Button>
        <Select value={addAction} onChange={(_, data) => setAddAction(data.value as any)}>
          <Option value="row">Add row</Option>
          {props.allowGroups !== false && <Option value="group">Add group</Option>}
          {props.allowRelatedEntity !== false && <Option value="related">Add related entity</Option>}
        </Select>
      </div>

      {loading ? (
        <div className={styles.loadingWrap}>
          <Spinner label="Loading fields..." />
        </div>
      ) : (
        <div className={styles.groupsContainer}>
          {builderState.groups.map((group, groupIndex) => (
            <div className={styles.groupCard} key={group.id}>
              <div className={styles.groupHeader}>
                <div className={styles.groupHeaderLeft}>
                  <Text weight="semibold">Group {groupIndex + 1}</Text>
                  <Select
                    value={group.logic}
                    onChange={(_, data) => updateGroup(group.id, (current) => ({ ...current, logic: data.value as 'and' | 'or' }))}
                  >
                    <Option value="and">AND</Option>
                    <Option value="or">OR</Option>
                  </Select>
                </div>

                <div className={styles.groupHeaderRight}>
                  <Button
                    size="small"
                    appearance="secondary"
                    onClick={() => updateGroup(group.id, (current) => ({ ...current, conditions: [...current.conditions, createCondition(defaultField)] }))}
                  >
                    + Add row
                  </Button>
                  {props.allowGroups !== false && builderState.groups.length > 1 && (
                    <Button
                      size="small"
                      appearance="secondary"
                      onClick={() => setBuilderState((previous) => ({
                        groups: previous.groups.filter((candidate) => candidate.id !== group.id),
                      }))}
                    >
                      Remove Group
                    </Button>
                  )}
                </div>
              </div>

              {group.conditions.map((condition) => {
                if (condition.kind === 'relatedEntity') {
                  return (
                    <div className={styles.rowGrid} key={condition.id}>
                      <Select
                        value={condition.relatedEntityName || ''}
                        onChange={(_, data) => updateGroup(group.id, (current) => ({
                          ...current,
                          conditions: current.conditions.map((row) => row.id === condition.id ? { ...row, relatedEntityName: data.value } : row),
                        }))}
                      >
                        {props.relatedEntities && props.relatedEntities.length > 0 ? (
                          props.relatedEntities.map((related) => (
                            <Option key={related.id} value={related.id}>{related.label}</Option>
                          ))
                        ) : (
                          <Option value="">Choose a related entity...</Option>
                        )}
                      </Select>

                      <Text className={styles.staticLabel}>Contains data</Text>
                      <div />
                      <div />

                      <Button size="small" appearance="secondary" onClick={() => removeCondition(group.id, condition.id)}>✕</Button>
                    </div>
                  );
                }

                const selectedField = availableFields.find((field) => field.id === condition.fieldId) || defaultField;
                const operators = getOperatorsForType(selectedField.dataType);
                const isNullOperator = condition.operator === 'null' || condition.operator === 'notnull';
                const isBetween = condition.operator === 'between';

                return (
                  <div className={styles.rowGrid} key={condition.id}>
                    <Select
                      value={condition.fieldId}
                      onChange={(_, data) => {
                        const nextField = availableFields.find((field) => field.id === data.value) || defaultField;
                        updateGroup(group.id, (current) => ({
                          ...current,
                          conditions: current.conditions.map((row) => row.id === condition.id
                            ? {
                                ...row,
                                fieldId: nextField.id,
                                operator: (getOperatorsForType(nextField.dataType)[0]?.value || 'eq') as any,
                                value: '',
                                value2: '',
                              }
                            : row),
                        }));
                      }}
                    >
                      {availableFields.map((field) => (
                        <Option key={field.id} value={field.id}>{field.label}</Option>
                      ))}
                    </Select>

                    <Select
                      value={condition.operator}
                      onChange={(_, data) => updateGroup(group.id, (current) => ({
                        ...current,
                        conditions: current.conditions.map((row) => row.id === condition.id ? { ...row, operator: data.value as any } : row),
                      }))}
                    >
                      {operators.map((operator) => (
                        <Option key={operator.value} value={operator.value}>{operator.label}</Option>
                      ))}
                    </Select>

                    {selectedField.dataType === 'optionset' && selectedField.options ? (
                      <Select
                        value={String(condition.value ?? '')}
                        disabled={isNullOperator}
                        onChange={(_, data) => updateGroup(group.id, (current) => ({
                          ...current,
                          conditions: current.conditions.map((row) => row.id === condition.id ? { ...row, value: data.value } : row),
                        }))}
                      >
                        {selectedField.options.map((option) => (
                          <Option key={String(option.value)} value={String(option.value)}>{option.label}</Option>
                        ))}
                      </Select>
                    ) : (
                      <Field label="" style={{ visibility: isNullOperator ? 'hidden' : 'visible' }}>
                        <Input
                          type={selectedField.dataType === 'datetime' ? 'date' : selectedField.dataType === 'number' ? 'number' : 'text'}
                          value={String(condition.value ?? '')}
                          onChange={(_, data) => updateGroup(group.id, (current) => ({
                            ...current,
                            conditions: current.conditions.map((row) => row.id === condition.id ? { ...row, value: data.value } : row),
                          }))}
                          placeholder={selectedField.dataType === 'boolean' ? 'true/false' : 'Value'}
                        />
                      </Field>
                    )}

                    {isBetween ? (
                      <Input
                        type={selectedField.dataType === 'datetime' ? 'date' : selectedField.dataType === 'number' ? 'number' : 'text'}
                        value={String(condition.value2 ?? '')}
                        onChange={(_, data) => updateGroup(group.id, (current) => ({
                          ...current,
                          conditions: current.conditions.map((row) => row.id === condition.id ? { ...row, value2: data.value } : row),
                        }))}
                        placeholder="And"
                      />
                    ) : (
                      <div />
                    )}

                    <Button size="small" appearance="secondary" onClick={() => removeCondition(group.id, condition.id)}>✕</Button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {props.showODataPreview && (
        <div className={styles.previewCard}>
          <Text weight="semibold">OData Preview</Text>
          <Text className={styles.previewCode}>{serialized.odataFilter || '(empty)'}</Text>
        </div>
      )}
    </div>
  );
};
