/**
 * Lookup Field Component using Fluent UI
 * Inline dropdown lookup that matches D365 native UI
 * Displays search results in a dropdown below the field with expandable details
 */

import React from 'react';
import { Input, Field, Popover, PopoverSurface, PopoverTrigger, Spinner, Button } from '@fluentui/react-components';
import { Search20Regular } from '@fluentui/react-icons';

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
    const [searchValue, setSearchValue] = React.useState('');
    const [options, setOptions] = React.useState<LookupOption[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [selectedOption, setSelectedOption] = React.useState<LookupOption | null>(value || null);
    const [entityIcon, setEntityIcon] = React.useState<string>('');
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [dropdownWidth, setDropdownWidth] = React.useState<number>(400);
    const [displayName, setDisplayName] = React.useState<string>(entityDisplayName || '');

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
                        setEntityIcon(`/$web/Icons/${iconName}_16.svg`);
                    }
                    // Get display name if not provided
                    if (!entityDisplayName && metadata?.DisplayName?.UserLocalizedLabel?.Label) {
                        setDisplayName(metadata.DisplayName.UserLocalizedLabel.Label);
                    }
                    return; // Exit early if we got the real icon
                }
                
                // Fallback to generic icon only for mock/testing when Xrm is not available
                setEntityIcon(getGenericEntityIcon(entityName));
                if (!entityDisplayName) {
                    setDisplayName(entityName.charAt(0).toUpperCase() + entityName.slice(1) + 's');
                }
            } catch (error) {
                console.warn('Failed to fetch entity icon from D365 metadata, using fallback:', error);
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

        try {
            // Check if running in D365 with Xrm available
            if (typeof window !== 'undefined' && (window as any).Xrm?.WebApi) {
                const xrmWebApi = (window as any).Xrm.WebApi;

                // Build select query
                const selectColumns = columnConfigs.map(c => c.attribute);
                const primaryId = `${entityName}id`;
                const select = [primaryId, ...selectColumns].join(',');

                // Build filter query
                let filterQuery = filters || '';
                if (searchTerm) {
                    const searchFilters = selectColumns
                        .map(col => `contains(${col}, '${searchTerm}')`)
                        .join(' or ');
                    filterQuery = filterQuery
                        ? `(${filterQuery}) and (${searchFilters})`
                        : searchFilters;
                }

                // Build full query
                const query = `?$select=${select}${filterQuery ? `&$filter=${filterQuery}` : ''}&$top=25&$orderby=${selectColumns[0]} asc`;

                // Fetch records
                const result = await xrmWebApi.retrieveMultipleRecords(entityName, query);

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
        } catch (error) {
            console.error('Failed to fetch lookup records:', error);
            // Fallback to mock data
            const mockData = generateMockLookupData(entityName, searchTerm, columnConfigs, entityIcon);
            setOptions(mockData);
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

    return (
        <Field
            label={label}
            hint={tooltip}
            orientation={orientation}
            required={required}
            style={{ marginBottom: '8px' }}
        >
            <Popover
                open={isDropdownOpen && !disabled}
                onOpenChange={(_, data) => setIsDropdownOpen(data.open)}
                positioning="below-start"
                withArrow={false}
            >
                <PopoverTrigger disableButtonEnhancement>
                    <div ref={containerRef} style={{ display: 'flex', gap: 0, width: '100%' }}>
                        <Input
                            ref={inputRef}
                            id={id}
                            type="text"
                            placeholder={placeholder}
                            value={searchValue}
                            onChange={handleInputChange}
                            onFocus={handleInputFocus}
                            disabled={disabled}
                            appearance="filled-darker"
                            role="combobox"
                            aria-expanded={isDropdownOpen}
                            aria-haspopup="listbox"
                            aria-autocomplete="list"
                            style={{ 
                                width: '100%',
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                                borderRight: 'none'
                            }}
                        />
                        <Button
                            icon={<Search20Regular />}
                            appearance="outline"
                            disabled={disabled}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0,
                                minWidth: '32px',
                                backgroundColor: '#f3f2f1',
                                borderColor: 'transparent'
                            }}
                            aria-label="Search records"
                        />
                    </div>
                </PopoverTrigger>
                <PopoverSurface
                    style={{
                        width: `${dropdownWidth}px`,
                        maxHeight: '400px',
                        overflowY: 'auto',
                        padding: 0,
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #d2d0ce',
                    }}
                >
                    {/* Header with entity type */}
                    <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#faf9f8',
                        borderBottom: '1px solid #edebe9',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#605e5c',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1
                    }}>
                        {searchValue ? `Search ${displayName.toLowerCase()}...` : displayName}
                    </div>

                    {loading ? (
                        <div style={{ padding: '16px', textAlign: 'center' }}>
                            <Spinner size="small" label="Loading..." />
                        </div>
                    ) : options.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#605e5c' }}>
                            No results found
                        </div>
                    ) : (
                        <div>
                            {options.map((option) => {
                                const isSelected = selectedOption?.id === option.id;
                                const primaryColumn = visibleColumns[0];
                                const secondaryColumn = visibleColumns[1];

                                return (
                                    <div
                                        key={option.id}
                                        onClick={() => handleOptionClick(option)}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? '#f3f2f1' : 'transparent',
                                            borderBottom: '1px solid #edebe9',
                                            display: 'flex',
                                            gap: '8px',
                                            alignItems: 'center',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.backgroundColor = '#faf9f8';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        {/* Entity Icon */}
                                        {option.iconUrl && (
                                            <div style={{ flexShrink: 0 }}>
                                                <img
                                                    src={option.iconUrl}
                                                    alt={option.entityType}
                                                    style={{ width: '16px', height: '16px' }}
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            </div>
                                        )}

                                        {/* Content - Two line layout */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                            {/* Primary text */}
                                            <div style={{
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: '#242424',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {primaryColumn ? option.columns[primaryColumn.attribute] : option.name}
                                            </div>
                                            
                                            {/* Secondary text */}
                                            {secondaryColumn && option.columns[secondaryColumn.attribute] && (
                                                <div style={{
                                                    fontSize: '12px',
                                                    fontWeight: 400,
                                                    color: '#605e5c',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {option.columns[secondaryColumn.attribute]}
                                                </div>
                                            )}
                                        </div>
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
            { name: 'Contoso Ltd', accountnumber: 'ACC-1001', telephone1: '555-123-4567', emailaddress1: 'info@contoso.com', address1_city: 'Seattle' },
            { name: 'Fabrikam Inc', accountnumber: 'ACC-1002', telephone1: '555-234-5678', emailaddress1: 'contact@fabrikam.com', address1_city: 'New York' },
            { name: 'Adventure Works', accountnumber: 'ACC-1003', telephone1: '555-345-6789', emailaddress1: 'sales@adventure.com', address1_city: 'Chicago' },
            { name: 'Northwind Traders', accountnumber: 'ACC-1004', telephone1: '555-456-7890', emailaddress1: 'info@northwind.com', address1_city: 'Boston' },
            { name: 'Wide World Importers', accountnumber: 'ACC-1005', telephone1: '555-567-8901', emailaddress1: 'contact@worldwide.com', address1_city: 'San Francisco' }
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
