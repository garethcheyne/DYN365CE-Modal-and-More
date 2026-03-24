/**
 * Lookup Field Component using fluentui-extended Lookup
 * Keeps existing props and D365 data mapping for compatibility with Modal field type='lookup'
 */

import React from 'react';
import { Field, Tooltip } from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';
import { Lookup } from 'fluentui-extended';
import { useSharedStyles } from './sharedStyles';
import { UILIB } from '../Logger/Logger';
import { getD365ApiMode } from '../../utils/dom';
import { fetchEntityMetadata, retrieveMultipleRecords as directRetrieve, type D365EntityMeta } from '../../utils/d365-web-api';

interface LookupColumn {
    attribute: string;
    label?: string;
    visible?: boolean;
}

interface LookupOption {
    id: string;
    name: string;
    columns: { [key: string]: string };
    entityType: string;
    iconUrl?: string;
    record?: any;
}

interface LookupFluentUiProps {
    id?: string;
    label?: string;
    placeholder?: string;
    tooltip?: string;
    orientation?: 'horizontal' | 'vertical';
    entityName: string;
    entityDisplayName?: string;
    lookupColumns?: (string | LookupColumn)[];
    filters?: string;
    value?: LookupOption | null;
    onChange: (selected: LookupOption | null) => void;
    disabled?: boolean;
    required?: boolean;
}

export const LookupFluentUi: React.FC<LookupFluentUiProps> = ({
    id,
    label,
    placeholder = 'Search...',
    tooltip,
    orientation = 'horizontal',
    entityName,
    entityDisplayName,
    lookupColumns = [],
    filters = '',
    value,
    onChange,
    disabled = false,
    required = false
}) => {
    const sharedStyles = useSharedStyles();

    const [options, setOptions] = React.useState<LookupOption[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [selectedOption, setSelectedOption] = React.useState<LookupOption | null>(value || null);
    const [searchText, setSearchText] = React.useState('');
    const [resolvedDisplayName, setResolvedDisplayName] = React.useState<string | null>(null);

    React.useEffect(() => {
        setSelectedOption(value || null);
    }, [value]);

    const columnConfigs = React.useMemo(() => {
        if (lookupColumns.length === 0) {
            return [{ attribute: 'name', visible: true }];
        }

        return lookupColumns.map(col => {
            if (typeof col === 'string') {
                return { attribute: col, visible: true };
            }
            return { ...col, visible: col.visible !== false };
        });
    }, [lookupColumns]);

    const visibleColumns = React.useMemo(
        () => columnConfigs.filter(c => c.visible),
        [columnConfigs]
    );

    const toExtendedOption = React.useCallback((option: LookupOption) => ({
        key: option.id,
        text: visibleColumns[0]?.attribute ? (option.columns[visibleColumns[0].attribute] || option.name) : option.name,
        secondaryText: visibleColumns[1]?.attribute ? option.columns[visibleColumns[1].attribute] : undefined,
        details: visibleColumns
            .slice(2)
            .filter(col => option.columns[col.attribute])
            .map(col => ({
                label: col.label,
                value: option.columns[col.attribute]
            })),
        data: option
    }), [visibleColumns]);

    const selectedExtendedOption = React.useMemo(() => {
        if (!selectedOption) return null;
        return toExtendedOption(selectedOption);
    }, [selectedOption, toExtendedOption]);

    const headerContent = React.useMemo(() => {
        return entityDisplayName || resolvedDisplayName || entityName;
    }, [entityDisplayName, resolvedDisplayName, entityName]);

    const footerContent = React.useMemo(() => {
        if (loading) {
            return 'Searching...';
        }

        if (!searchText) {
            return `${options.length} available`;
        }

        return `${options.length} result${options.length === 1 ? '' : 's'}`;
    }, [loading, options.length, searchText]);

    const fetchRecords = React.useCallback(async (term: string) => {
        setLoading(true);

        try {
            const apiMode = await getD365ApiMode();

            if (apiMode === 'xrm') {
                // ---- Xrm SDK path (normal D365 context) ----
                const xrmWebApi = (window as any).Xrm.WebApi;
                let primaryId = `${entityName}id`;
                let validColumns: string[] = [];

                try {
                    if ((window as any).Xrm?.Utility?.getEntityMetadata) {
                        const metadata = await (window as any).Xrm.Utility.getEntityMetadata(entityName, ['Attributes', 'PrimaryIdAttribute', 'DisplayName']);

                        if (metadata?.PrimaryIdAttribute) {
                            primaryId = metadata.PrimaryIdAttribute;
                        }

                        if (metadata?.DisplayName?.UserLocalizedLabel?.Label) {
                            setResolvedDisplayName(metadata.DisplayName.UserLocalizedLabel.Label);
                        } else if (metadata?.DisplayName?.LocalizedLabels?.length > 0) {
                            setResolvedDisplayName(metadata.DisplayName.LocalizedLabels[0].Label);
                        }

                        if (metadata?.Attributes && Array.isArray(metadata.Attributes)) {
                            const existingAttributes = metadata.Attributes.map((attr: any) => attr.LogicalName);
                            validColumns = columnConfigs
                                .map(c => c.attribute)
                                .filter(attr => existingAttributes.includes(attr));

                            if (validColumns.length === 0) {
                                const fallbacks = ['name', 'fullname', 'title', 'subject'];
                                validColumns = fallbacks.filter(attr => existingAttributes.includes(attr));

                                if (validColumns.length === 0) {
                                    const firstTextAttr = metadata.Attributes.find((attr: any) =>
                                        attr.AttributeType === 'String' || attr.AttributeType === 'Memo'
                                    );
                                    if (firstTextAttr) {
                                        validColumns = [firstTextAttr.LogicalName];
                                    }
                                }
                            }
                        }
                    }
                } catch (metaError) {
                    console.warn(...UILIB, `[Lookup] Could not fetch metadata for ${entityName}, using provided columns`, metaError);
                }

                const selectColumns = validColumns.length > 0
                    ? validColumns
                    : columnConfigs.map(c => c.attribute);

                const isFetchXml = filters && (filters.includes('<filter') || filters.includes('<condition'));

                let result;
                if (isFetchXml) {
                    const fetchXml = `
                        <fetch top="25">
                            <entity name="${entityName}">
                                ${filters || ''}
                                ${term ? `
                                <filter type="or">
                                    ${selectColumns.map(col => `<condition attribute="${col}" operator="like" value="%${term}%" />`).join('')}
                                </filter>
                                ` : ''}
                                <order attribute="${selectColumns[0]}" descending="false" />
                            </entity>
                        </fetch>
                    `.trim();

                    result = await xrmWebApi.retrieveMultipleRecords(entityName, `?fetchXml=${encodeURIComponent(fetchXml)}`);
                } else {
                    let filterQuery = filters || '';
                    if (term) {
                        const searchFilters = selectColumns
                            .map(col => `contains(${col}, '${term}')`)
                            .join(' or ');
                        filterQuery = filterQuery
                            ? `(${filterQuery}) and (${searchFilters})`
                            : searchFilters;
                    }

                    const query = `?${filterQuery ? `$filter=${filterQuery}&` : ''}$top=25&$orderby=${selectColumns[0]} asc`;
                    result = await xrmWebApi.retrieveMultipleRecords(entityName, query);
                }

                const lookupOptions: LookupOption[] = result.entities.map((record: any) => {
                    const columns: { [key: string]: string } = {};
                    columnConfigs.forEach(col => {
                        columns[col.attribute] = record[col.attribute] || '';
                    });

                    return {
                        id: record[primaryId],
                        name: record[selectColumns[0]] || 'Unnamed',
                        columns,
                        entityType: entityName,
                        record
                    };
                });

                setOptions(lookupOptions);

            } else if (apiMode === 'direct') {
                // ---- Direct REST API path (pop-out / broken Xrm) ----
                console.debug(...UILIB, `[Lookup] Using direct Web API for ${entityName}`);

                let meta: D365EntityMeta | null = null;
                let primaryId = `${entityName}id`;
                let entitySetName = `${entityName}s`;
                let validColumns: string[] = columnConfigs.map(c => c.attribute);

                try {
                    meta = await fetchEntityMetadata(entityName);
                    primaryId = meta.PrimaryIdAttribute;
                    entitySetName = meta.EntitySetName;

                    // Resolve display name
                    const dn = meta.DisplayName?.UserLocalizedLabel?.Label
                        ?? meta.DisplayName?.LocalizedLabels?.[0]?.Label;
                    if (dn) setResolvedDisplayName(dn);

                    // Validate columns against metadata
                    if (meta.Attributes?.length) {
                        const existing = new Set(meta.Attributes.map(a => a.LogicalName));
                        const checked = validColumns.filter(c => existing.has(c));
                        if (checked.length > 0) {
                            validColumns = checked;
                        } else {
                            const fallbacks = ['name', 'fullname', 'title', 'subject'];
                            validColumns = fallbacks.filter(c => existing.has(c));
                            if (validColumns.length === 0) {
                                validColumns = [meta.PrimaryNameAttribute];
                            }
                        }
                    }
                } catch (metaError) {
                    console.warn(...UILIB, `[Lookup] Could not fetch metadata via direct API for ${entityName}`, metaError);
                }

                const selectColumns = validColumns;

                // Build OData query
                let filterQuery = (filters && !filters.includes('<filter') && !filters.includes('<condition')) ? filters : '';
                if (term) {
                    const searchFilters = selectColumns
                        .map(col => `contains(${col}, '${term}')`)
                        .join(' or ');
                    filterQuery = filterQuery
                        ? `(${filterQuery}) and (${searchFilters})`
                        : searchFilters;
                }

                const query = `?$select=${selectColumns.join(',')}`
                    + `${filterQuery ? `&$filter=${filterQuery}` : ''}`
                    + `&$top=25&$orderby=${selectColumns[0]} asc`;

                const result = await directRetrieve(entitySetName, query);

                const lookupOptions: LookupOption[] = result.entities.map((record: any) => {
                    const columns: { [key: string]: string } = {};
                    columnConfigs.forEach(col => {
                        columns[col.attribute] = record[col.attribute] || '';
                    });

                    return {
                        id: record[primaryId],
                        name: record[selectColumns[0]] || 'Unnamed',
                        columns,
                        entityType: entityName,
                        record
                    };
                });

                setOptions(lookupOptions);

            } else {
                // ---- No D365 API available (standalone / dev) ----
                const mockData = generateMockLookupData(entityName, term, columnConfigs);
                setOptions(mockData);
            }
        } catch (error) {
            console.warn(...UILIB, `[Lookup] API call failed for ${entityName}, falling back to mock data`, error);
            const mockData = generateMockLookupData(entityName, term, columnConfigs);
            setOptions(mockData);
        } finally {
            setLoading(false);
        }
    }, [entityName, columnConfigs, filters]);

    React.useEffect(() => {
        fetchRecords(searchText);
    }, [fetchRecords, searchText]);

    const effectiveOrientation = !label ? 'vertical' : orientation;

    const labelContent = label && tooltip ? (
        <span className={sharedStyles.labelWithTooltip}>
            <span>{label}</span>
            <Tooltip content={tooltip} relationship="label">
                <Info16Regular className={sharedStyles.tooltipIcon} />
            </Tooltip>
        </span>
    ) : label;

    return (
        <Field
            label={labelContent}
            required={required}
            orientation={effectiveOrientation}
            className={sharedStyles.field}
        >
            <Lookup
                id={id}
                selectedOption={selectedExtendedOption}
                options={options.map(toExtendedOption)}
                header={headerContent}
                footer={footerContent}
                placeholder={placeholder || `Search ${entityDisplayName || resolvedDisplayName || entityName}...`}
                loading={loading}
                clearable
                disabled={disabled}
                appearance="filled-darker"
                onSearchChange={(text: string) => {
                    setSearchText(text || '');
                    if (!text) {
                        setSelectedOption(null);
                        onChange(null);
                    }
                }}
                onOptionSelect={(option: any) => {
                    const selected = (option?.data as LookupOption) || null;
                    setSelectedOption(selected);
                    onChange(selected);
                }}
            />
        </Field>
    );
};

function generateMockLookupData(
    entityName: string,
    searchTerm: string,
    columnConfigs: { attribute: string; visible?: boolean }[]
): LookupOption[] {
    const mockRecords: LookupOption[] = [];
    const searchLower = searchTerm.toLowerCase();

    if (entityName === 'account') {
        const accounts = [
            { name: 'Contoso Ltd', accountnumber: 'ACC-1001', telephone1: '555-123-4567', emailaddress1: 'info@contoso.com', address1_city: 'Seattle', address1_stateorprovince: 'WA' },
            { name: 'Fabrikam Inc', accountnumber: 'ACC-1002', telephone1: '555-234-5678', emailaddress1: 'contact@fabrikam.com', address1_city: 'New York', address1_stateorprovince: 'NY' },
            { name: 'Adventure Works', accountnumber: 'ACC-1003', telephone1: '555-345-6789', emailaddress1: 'sales@adventure.com', address1_city: 'Chicago', address1_stateorprovince: 'IL' },
            { name: 'Northwind Traders', accountnumber: 'ACC-1004', telephone1: '555-456-7890', emailaddress1: 'info@northwind.com', address1_city: 'Boston', address1_stateorprovince: 'MA' },
            { name: 'Wide World Importers', accountnumber: 'ACC-1005', telephone1: '555-567-8901', emailaddress1: 'contact@worldwide.com', address1_city: 'San Francisco', address1_stateorprovince: 'CA' }
        ];

        accounts.forEach((acc, idx) => {
            if (!searchTerm || acc.name.toLowerCase().includes(searchLower) || acc.accountnumber.toLowerCase().includes(searchLower)) {
                const columns: { [key: string]: string } = {};
                columnConfigs.forEach(col => {
                    columns[col.attribute] = (acc as any)[col.attribute] || '';
                });

                mockRecords.push({
                    id: `${idx + 1}`.padStart(8, '0') + '-0000-0000-0000-000000000001',
                    name: acc.name,
                    columns,
                    entityType: 'account',
                    record: acc
                });
            }
        });
    } else if (entityName === 'contact') {
        const contacts = [
            { fullname: 'John Smith', emailaddress1: 'john@contoso.com', telephone1: '555-111-2222', jobtitle: 'Sales Manager', parentcustomerid: 'Contoso Ltd' },
            { fullname: 'Jane Doe', emailaddress1: 'jane@fabrikam.com', telephone1: '555-222-3333', jobtitle: 'Marketing Director', parentcustomerid: 'Fabrikam Inc' },
            { fullname: 'Michael Johnson', emailaddress1: 'michael@adventure.com', telephone1: '555-333-4444', jobtitle: 'CEO', parentcustomerid: 'Adventure Works' },
            { fullname: 'Sarah Williams', emailaddress1: 'sarah@northwind.com', telephone1: '555-444-5555', jobtitle: 'VP Sales', parentcustomerid: 'Northwind Traders' }
        ];

        contacts.forEach((contact, idx) => {
            if (!searchTerm || contact.fullname.toLowerCase().includes(searchLower) || contact.emailaddress1.toLowerCase().includes(searchLower)) {
                const columns: { [key: string]: string } = {};
                columnConfigs.forEach(col => {
                    columns[col.attribute] = (contact as any)[col.attribute] || '';
                });

                mockRecords.push({
                    id: `${idx + 1}`.padStart(8, '0') + '-0000-0000-0000-000000000002',
                    name: contact.fullname,
                    columns,
                    entityType: 'contact',
                    record: contact
                });
            }
        });
    }

    return mockRecords;
}
