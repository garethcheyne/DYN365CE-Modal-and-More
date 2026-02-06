/**
 * Lookup Field Component using Fluent UI
 * Inline dropdown lookup that matches D365 native UI
 * Displays search results in a dropdown below the field with expandable details
 */

import React from 'react';
import { Input, Field, Popover, PopoverSurface, PopoverTrigger, Spinner, Button, mergeClasses } from '@fluentui/react-components';
import { Search20Regular } from '@fluentui/react-icons';
import { useSharedStyles, useLookupStyles } from './sharedStyles';

interface LookupColumn {
    attribute: string;
    label?: string;
    visible?: boolean;  // Show by default or only on expand
}

interface LookupOption {
    id: string;
    name: string;
    columns: { [key: string]: string };  // All column values
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
    entityDisplayName?: string;  // Display name for the entity (e.g., "Accounts")
    lookupColumns?: (string | LookupColumn)[];  // Array of column configs
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
    const lookupStyles = useLookupStyles();

    const [searchValue, setSearchValue] = React.useState('');
    const [options, setOptions] = React.useState<LookupOption[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedOption, setSelectedOption] = React.useState<LookupOption | null>(value || null);
    const [entityIcon, setEntityIcon] = React.useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [dropdownWidth, setDropdownWidth] = React.useState<number>(400);
    const [displayName, setDisplayName] = React.useState<string>(entityDisplayName || '');
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

    // Parse lookup columns configuration
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

    const visibleColumns = columnConfigs.filter(c => c.visible);

    // Fetch entity icon
    React.useEffect(() => {
        const fetchEntityIcon = async () => {
            try {
                // Try to get actual D365 entity icon from metadata
                if (typeof window !== 'undefined' && (window as any).Xrm?.Utility?.getEntityMetadata) {
                    const metadata = await (window as any).Xrm.Utility.getEntityMetadata(entityName);

                    if (metadata?.IconSmallName) {
                        // D365 entity icons are typically in web resources
                        const iconName = metadata.IconSmallName.replace('.png', '').replace('.svg', '');
                        const iconUrl = `/$web/Icons/${iconName}_16.svg`;
                        setEntityIcon(iconUrl);
                    } else {
                        console.log('[Lookup] No IconSmallName in metadata, using fallback');
                        setEntityIcon(getGenericEntityIcon(entityName));
                    }

                    // Get display name if not provided
                    if (!entityDisplayName && metadata?.DisplayName?.UserLocalizedLabel?.Label) {
                        setDisplayName(metadata.DisplayName.UserLocalizedLabel.Label);
                    }
                    return; // Exit early if we got the real icon
                }

                console.log('[Lookup] Xrm not available, using generic icon');
                // Fallback to generic icon only for mock/testing when Xrm is not available
                setEntityIcon(getGenericEntityIcon(entityName));
                if (!entityDisplayName) {
                    setDisplayName(entityName.charAt(0).toUpperCase() + entityName.slice(1) + 's');
                }
            } catch (error) {
                console.warn('[Lookup] Failed to fetch entity icon from D365 metadata, using fallback:', error);
                setEntityIcon(getGenericEntityIcon(entityName));
                if (!entityDisplayName) {
                    setDisplayName(entityName.charAt(0).toUpperCase() + entityName.slice(1) + 's');
                }
            }
        };

        fetchEntityIcon();
    }, [entityName, entityDisplayName]);

    // Fetch records from D365 or generate mock data
    const fetchRecords = React.useCallback(async (searchTerm: string) => {
        setLoading(true);
        setError(null); // Clear previous errors

        try {
            // Check if running in D365 with Xrm available
            if (typeof window !== 'undefined' && (window as any).Xrm?.WebApi) {
                const xrmWebApi = (window as any).Xrm.WebApi;

                // Get entity metadata to find valid primary key and fields
                let primaryId = `${entityName}id`; // Default convention
                let validColumns: string[] = [];

                try {
                    // Try to get entity metadata to validate fields exist
                    if ((window as any).Xrm?.Utility?.getEntityMetadata) {
                        const metadata = await (window as any).Xrm.Utility.getEntityMetadata(entityName, ['Attributes', 'PrimaryIdAttribute']);

                        // Use actual primary ID attribute
                        if (metadata?.PrimaryIdAttribute) {
                            primaryId = metadata.PrimaryIdAttribute;
                        }

                        // Validate which columns actually exist
                        if (metadata?.Attributes && Array.isArray(metadata.Attributes)) {
                            const existingAttributes = metadata.Attributes.map((attr: any) => attr.LogicalName);
                            validColumns = columnConfigs
                                .map(c => c.attribute)
                                .filter(attr => existingAttributes.includes(attr));

                            // If no valid columns, try common fallbacks
                            if (validColumns.length === 0) {
                                const fallbacks = ['name', 'fullname', 'title', 'subject'];
                                validColumns = fallbacks.filter(attr => existingAttributes.includes(attr));

                                // If still no valid columns, use first text attribute
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
                    console.warn(`Could not fetch metadata for ${entityName}, using provided columns:`, metaError);
                }

                // If metadata fetch failed or returned no valid columns, use provided columns
                const selectColumns = validColumns.length > 0
                    ? validColumns
                    : columnConfigs.map(c => c.attribute);

                // Check if filters is FetchXML (contains <filter or <condition tags)
                const isFetchXml = filters && (filters.includes('<filter') || filters.includes('<condition'));

                let result;
                if (isFetchXml) {
                    // Build FetchXML query - omit attribute tags to return ALL fields
                    let fetchXml = `
                        <fetch top="25">
                            <entity name="${entityName}">
                                ${filters || ''}
                                ${searchTerm ? `
                                <filter type="or">
                                    ${selectColumns.map(col => `<condition attribute="${col}" operator="like" value="%${searchTerm}%" />`).join('')}
                                </filter>
                                ` : ''}
                                <order attribute="${selectColumns[0]}" descending="false" />
                            </entity>
                        </fetch>
                    `.trim();

                    // Use fetchXml method
                    result = await xrmWebApi.retrieveMultipleRecords(entityName, `?fetchXml=${encodeURIComponent(fetchXml)}`);
                } else {
                    // Build OData filter query - omit $select to return ALL fields
                    let filterQuery = filters || '';
                    if (searchTerm) {
                        const searchFilters = selectColumns
                            .map(col => `contains(${col}, '${searchTerm}')`)
                            .join(' or ');
                        filterQuery = filterQuery
                            ? `(${filterQuery}) and (${searchFilters})`
                            : searchFilters;
                    }

                    // Build full query without $select to get all fields
                    const query = `?${filterQuery ? `$filter=${filterQuery}&` : ''}$top=25&$orderby=${selectColumns[0]} asc`;

                    // Fetch records
                    result = await xrmWebApi.retrieveMultipleRecords(entityName, query);
                }

                // Map to lookup options
                const lookupOptions: LookupOption[] = result.entities.map((record: any) => {
                    const columns: { [key: string]: string } = {};
                    columnConfigs.forEach(col => {
                        columns[col.attribute] = record[col.attribute] || '';
                    });

                    return {
                        id: record[primaryId],
                        name: record[selectColumns[0]] || 'Unnamed',
                        columns: columns,
                        entityType: entityName,
                        iconUrl: entityIcon,
                        record: record
                    };
                });

                setOptions(lookupOptions);
            } else {
                // Generate mock data when Xrm is not available
                const mockData = generateMockLookupData(entityName, searchTerm, columnConfigs, entityIcon);
                setOptions(mockData);
            }
        } catch (error: any) {
            console.error('Failed to fetch lookup records:', error);

            // Provide helpful error messages based on error type
            let errorMessage = 'Failed to load records';

            if (error?.message?.includes('does not exist')) {
                errorMessage = `Invalid field in lookupColumns for entity '${entityName}'. Check column names match D365 schema.`;
                console.error(`Attempted columns: ${columnConfigs.map(c => c.attribute).join(', ')}`);
                console.error(`Tip: Common column names are 'name', 'fullname', 'subject', 'title'. Use browser DevTools to inspect actual D365 entity metadata.`);
            } else if (error?.message?.includes('Invalid Query')) {
                errorMessage = `Invalid query for entity '${entityName}'. Check filters or column names.`;

                const isFetchXml = filters && (filters.includes('<filter') || filters.includes('<condition'));
                if (isFetchXml) {
                    console.error('Invalid FetchXML query. Verify your filters configuration.');
                } else {
                    console.error('Invalid OData query. Verify lookupColumns match entity schema.');
                }
            }

            setError(errorMessage);
            setOptions([]);

            // Log detailed configuration for debugging
            console.error('Lookup configuration:', {
                entityName,
                lookupColumns: columnConfigs,
                filters
            });
        } finally {
            setLoading(false);
        }
    }, [entityName, columnConfigs, filters, entityIcon]);

    // Debounced search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue.length >= 0) {
                fetchRecords(searchValue);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchValue, fetchRecords]);

    // Initial load
    React.useEffect(() => {
        fetchRecords('');
    }, []);

    // Update dropdown width when it opens
    React.useEffect(() => {
        if (isDropdownOpen && containerRef.current) {
            setDropdownWidth(containerRef.current.offsetWidth);
        }
    }, [isDropdownOpen]);

    const handleOptionClick = (option: LookupOption) => {
        setSelectedOption(option);
        setSearchValue(option.name);
        onChange(option);
        setIsDropdownOpen(false);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value || '';
        setSearchValue(value);
        setIsDropdownOpen(true);

        // Clear selection when user types
        if (value === '') {
            setSelectedOption(null);
            onChange(null);
        }
    };

    const handleInputFocus = () => {
        setIsDropdownOpen(true);
        // Update dropdown width to match input container (input + button)
        if (containerRef.current) {
            setDropdownWidth(containerRef.current.offsetWidth);
        }
    };

    const handleInputClick = (e: React.MouseEvent) => {
        // Prevent PopoverTrigger from toggling when clicking input
        e.stopPropagation();
        setIsDropdownOpen(true);
    };

    return (
        <Field
            label={label}
            hint={tooltip}
            orientation={orientation}
            required={required}
            className={sharedStyles.field}
        >
            <Popover
                open={isDropdownOpen && !disabled}
                onOpenChange={(_, data) => setIsDropdownOpen(data.open)}
                positioning="below-start"
                withArrow={false}
            >
                <PopoverTrigger disableButtonEnhancement>
                    <div ref={containerRef} className={sharedStyles.inputWithButton}>
                        <Input
                            ref={inputRef}
                            id={id}
                            type="text"
                            placeholder={placeholder}
                            value={searchValue}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            onClick={handleInputClick}
                            disabled={disabled}
                            appearance="filled-darker"
                            role="combobox"
                            aria-expanded={isDropdownOpen}
                            aria-haspopup="listbox"
                            aria-autocomplete="list"
                            className={lookupStyles.inputNoRightBorder}
                        />
                        {/* Clear button when value is selected */}
                        {selectedOption && (
                            <Button
                                icon={<svg width="16" height="16" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" fill="currentColor" /></svg>}
                                appearance="subtle"
                                disabled={disabled}
                                onClick={() => {
                                    setSelectedOption(null);
                                    setSearchValue('');
                                    onChange(null);
                                }}
                                className={lookupStyles.buttonNoRightRadius}
                                aria-label="Clear selection"
                            />
                        )}
                        <Button
                            icon={<Search20Regular />}
                            appearance="outline"
                            disabled={disabled}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={lookupStyles.buttonNoLeftRadius}
                            aria-label="Search records"
                        />
                    </div>
                </PopoverTrigger>
                <PopoverSurface
                    className={lookupStyles.popoverSurface}
                    style={{ width: `${dropdownWidth}px` }}
                >
                    {/* Header with entity type */}
                    <div className={lookupStyles.dropdownHeader}>
                        <span>{searchValue ? `Search ${displayName.toLowerCase()}...` : displayName}</span>
                        {/* Expand All button - only show if there are items with additional columns */}
                        {options.length > 0 && visibleColumns.length > 2 && (
                            <Button
                                size="small"
                                appearance="subtle"
                                onClick={() => {
                                    const allExpanded = expandedItems.size === options.length;
                                    if (allExpanded) {
                                        setExpandedItems(new Set());
                                    } else {
                                        setExpandedItems(new Set(options.map(opt => opt.id)));
                                    }
                                }}
                                className={lookupStyles.expandAllButton}
                            >
                                {expandedItems.size === options.length ? 'Collapse All' : 'Expand All'}
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <div className={lookupStyles.stateContainer}>
                            <Spinner size="small" label="Loading..." />
                        </div>
                    ) : error ? (
                        <div className={lookupStyles.errorState}>
                            <div style={{ marginBottom: '4px' }}>Invalid Query</div>
                            <div className={lookupStyles.errorMessage}>
                                {error}
                            </div>
                        </div>
                    ) : options.length === 0 ? (
                        <div className={mergeClasses(lookupStyles.stateContainer, lookupStyles.noResults)}>
                            No results found
                        </div>
                    ) : (
                        <div>
                            {options.map((option) => {
                                const isSelected = selectedOption?.id === option.id;
                                const primaryColumn = visibleColumns[0];
                                const secondaryColumn = visibleColumns[1];
                                const additionalColumns = visibleColumns.slice(2);
                                const isExpanded = expandedItems.has(option.id);
                                const hasAdditionalColumns = additionalColumns.length > 0 && additionalColumns.some(col => option.columns[col.attribute]);

                                return (
                                    <div
                                        key={option.id}
                                        className={mergeClasses(
                                            lookupStyles.optionRow,
                                            isSelected && lookupStyles.optionRowSelected
                                        )}
                                    >
                                        {/* Main row with first 2 columns */}
                                        <div
                                            onClick={() => handleOptionClick(option)}
                                            className={lookupStyles.optionRowContent}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) {
                                                    (e.currentTarget.parentElement as HTMLElement).style.backgroundColor = '#faf9f8';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) {
                                                    (e.currentTarget.parentElement as HTMLElement).style.backgroundColor = 'transparent';
                                                }
                                            }}
                                        >
                                            {/* Entity Icon */}
                                            {option.iconUrl && (
                                                <div className={lookupStyles.entityIcon}>
                                                    <img
                                                        src={option.iconUrl}
                                                        alt={option.entityType}
                                                        style={{ width: '16px', height: '16px' }}
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                    />
                                                </div>
                                            )}

                                            {/* Content - Two line layout */}
                                            <div className={lookupStyles.optionContent}>
                                                {/* Primary text */}
                                                <div className={lookupStyles.primaryText}>
                                                    {primaryColumn?.label ? (
                                                        <>
                                                            <span className={lookupStyles.primaryTextLabel}>{primaryColumn.label}: </span>
                                                            {primaryColumn ? option.columns[primaryColumn.attribute] : option.name}
                                                        </>
                                                    ) : (
                                                        primaryColumn ? option.columns[primaryColumn.attribute] : option.name
                                                    )}
                                                </div>

                                                {/* Secondary text */}
                                                {secondaryColumn && option.columns[secondaryColumn.attribute] && (
                                                    <div className={lookupStyles.secondaryText}>
                                                        {secondaryColumn?.label ? (
                                                            <>
                                                                <span className={lookupStyles.secondaryTextLabel}>{secondaryColumn.label}: </span>
                                                                {option.columns[secondaryColumn.attribute]}
                                                            </>
                                                        ) : (
                                                            option.columns[secondaryColumn.attribute]
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Expand/Collapse chevron */}
                                            {hasAdditionalColumns && (
                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedItems(prev => {
                                                            const newSet = new Set(prev);
                                                            if (newSet.has(option.id)) {
                                                                newSet.delete(option.id);
                                                            } else {
                                                                newSet.add(option.id);
                                                            }
                                                            return newSet;
                                                        });
                                                    }}
                                                    className={lookupStyles.chevronContainer}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#edebe9';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 12 12" style={{
                                                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s ease'
                                                    }}>
                                                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Expanded additional columns */}
                                        {hasAdditionalColumns && isExpanded && (
                                            <div className={mergeClasses(
                                                lookupStyles.expandedColumns,
                                                isSelected ? lookupStyles.expandedColumnsSelected : lookupStyles.expandedColumnsDefault
                                            )}>
                                                {additionalColumns.map((col, idx) => {
                                                    const value = option.columns[col.attribute];
                                                    if (!value) return null;

                                                    return (
                                                        <div key={idx} className={lookupStyles.additionalColumn}>
                                                            {col.label && (
                                                                <span className={lookupStyles.additionalColumnLabel}>{col.label}:</span>
                                                            )}
                                                            <span style={{ flex: 1 }}>{value}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </PopoverSurface>
            </Popover>
        </Field>
    );
};

// FALLBACK ONLY: Generic entity icons for mock/testing when D365 is not available
// Real D365 entity icons are fetched from Xrm.Utility.getEntityMetadata() above
function getGenericEntityIcon(entityName: string): string {
    // Map of common entities to generic icons (data URIs for fallback)
    const iconMap: { [key: string]: string } = {
        account: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOCA4QTMgMyAwIDEwOCAyYTMgMyAwIDAwMCA2em0wIDFjLTIgMC00IDEtNCAzdjFoOHYtMWMwLTItMi0zLTQtM3oiIGZpbGw9IiMwMDc4ZDQiLz48L3N2Zz4=',
        contact: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI4IiBjeT0iNSIgcj0iMi41IiBmaWxsPSIjMDA3OGQ0Ii8+PHBhdGggZD0iTTQgMTFjMC0yIDItMyA0LTNzNCAxIDQgM3YxSDR2LTF6IiBmaWxsPSIjMDA3OGQ0Ii8+PC9zdmc+',
        lead: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOCA4QTMgMyAwIDEwOCAyYTMgMyAwIDAwMCA2em0wIDFjLTIgMC00IDEtNCAzdjFoOHYtMWMwLTItMi0zLTQtM3oiIGZpbGw9IiNmZmI5MDAiLz48L3N2Zz4=',
        opportunity: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTQgNmwtNiA2LTQtNCAyLTIgMiAyIDQtNCAyIDJ6IiBmaWxsPSIjMTA3YzEwIi8+PC9zdmc+'
    };

    return iconMap[entityName] || iconMap.account;
}

// Generate mock lookup data for testing
function generateMockLookupData(
    entityName: string,
    searchTerm: string,
    columnConfigs: { attribute: string; visible?: boolean }[],
    iconUrl: string
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
            if (!searchTerm ||
                acc.name.toLowerCase().includes(searchLower) ||
                acc.accountnumber.toLowerCase().includes(searchLower)) {

                const columns: { [key: string]: string } = {};
                columnConfigs.forEach(col => {
                    columns[col.attribute] = (acc as any)[col.attribute] || '';
                });

                mockRecords.push({
                    id: `${idx + 1}`.padStart(8, '0') + '-0000-0000-0000-000000000001',
                    name: acc.name,
                    columns: columns,
                    entityType: 'account',
                    iconUrl: iconUrl,
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
            if (!searchTerm ||
                contact.fullname.toLowerCase().includes(searchLower) ||
                contact.emailaddress1.toLowerCase().includes(searchLower)) {

                const columns: { [key: string]: string } = {};
                columnConfigs.forEach(col => {
                    columns[col.attribute] = (contact as any)[col.attribute] || '';
                });

                mockRecords.push({
                    id: `${idx + 1}`.padStart(8, '0') + '-0000-0000-0000-000000000002',
                    name: contact.fullname,
                    columns: columns,
                    entityType: 'contact',
                    iconUrl: iconUrl,
                    record: contact
                });
            }
        });
    }

    return mockRecords;
}
