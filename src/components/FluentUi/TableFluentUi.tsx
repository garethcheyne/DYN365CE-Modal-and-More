import React, { useState, useCallback, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import {
  DataGrid,
  DataGridBody,
  DataGridRow,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  TableCellLayout,
  makeStyles,
  tokens,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  Input,
  Popover,
  PopoverSurface,
  Select,
} from '@fluentui/react-components';
import {
  ChevronDown20Regular,
  GroupList20Regular,
  Filter20Regular,
  ColumnTriple20Regular,
  ArrowLeft20Regular,
  ArrowRight20Regular,
  ArrowSortUp20Regular,
  ArrowSortDown20Regular,
} from '@fluentui/react-icons';
import { FieldConfig } from '../Modal/Modal.types';
import { UILIB } from '../Logger/Logger';

// Define local types for table columns (simplified version)
type TableColumnId = string;
interface TableColumnDefinition<T> {
  columnId: TableColumnId;
  renderHeaderCell: () => React.ReactNode;
  renderCell: (item: T) => React.ReactNode;
  compare?: (a: T, b: T) => number;
}
function createTableColumn<T>(def: TableColumnDefinition<T>): TableColumnDefinition<T> {
  return def;
}

interface TableFluentUiProps {
  config: FieldConfig;
  onSelectionChange?: (selectedRows: any[]) => void;
}

interface TableRow {
  [key: string]: any;
  _index: number;
}

// Fluent UI styles using design tokens
const useStyles = makeStyles({
  container: {
    maxHeight: '400px',
    width: '100%',               // Fill available space
    overflow: 'auto',            // Allow both horizontal and vertical scroll
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '0',                // No padding - maximize table space
    boxSizing: 'border-box',
    position: 'relative',        // Establish positioning context
  },
  dataGrid: {
    width: 'fit-content',        // Size based on column widths - no stretching
    tableLayout: 'fixed',        // Fixed layout respects column widths strictly
    backgroundColor: tokens.colorNeutralBackground1,
    '& .fui-DataGridHeader': {
      backgroundColor: 'transparent',
      borderBottom: `1px solid rgba(0, 0, 0, 0.54)`,  // Darker border for header (D365 style)
    },
    '& .fui-DataGridHeaderCell': {
      backgroundColor: 'transparent',
      fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
      WebkitFontSmoothing: 'antialiased',
      fontSize: '14px',  // D365 header font size
      fontWeight: 600,
      color: 'rgb(36, 36, 36)',  // D365 header text color
      padding: '0 12px',  // 12px left and right padding
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '42px',  // D365 row height
      borderRight: 'none',
      textTransform: 'none',
      letterSpacing: 'normal',
      border: `2px solid transparent`,  // Transparent border by default (prevents size shift)
      whiteSpace: 'nowrap',      // Prevent header text wrapping
      '&:hover': {
        backgroundColor: 'transparent',  // No background change
        border: '2px solid #0078d4',  // Change border color only (D365 style)
      },
      '&:active, &:focus': {
        backgroundColor: 'transparent',  // No background change
        border: '2px solid #0078d4',  // Change border color only (D365 style)
      },
    },
    '& .fui-DataGridCell': {
      fontSize: '14px',
      color: '#323130',
      padding: '0 12px',  // 12px left and right padding
      height: '42px',  // D365 row height
      borderRight: 'none',
      borderBottom: '1px solid #edebe9',  // Horizontal separator between rows (D365 style)
      overflow: 'hidden',
      whiteSpace: 'nowrap',      // Prevent cell content wrapping
    },
  },
  truncatedCell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',            // Use maxWidth instead of width to allow shrinking
    display: 'inline-block',
  },
  emptyState: {
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
  },
  radioButton: {
    cursor: 'pointer',
    accentColor: tokens.colorBrandBackground,
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: '8px',
  },
  columnHeaderContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
  },
  columnHeaderButton: {
    minWidth: 'auto',
    padding: '4px',
    height: '24px',
    color: '#605e5c',
    '&:hover': {
      backgroundColor: '#edebe9',
    },
  },
  filterInput: {
    width: '200px',
  },
});

export const TableFluentUi: React.FC<TableFluentUiProps> = ({ config, onSelectionChange }) => {
  const styles = useStyles();

  // Container ref for measuring available width
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Measure container width using ResizeObserver
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial measurement
    setContainerWidth(container.clientWidth);

    // Watch for resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setContainerWidth(width);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Safety check: Ensure config has required properties
  if (!config || !config.tableColumns || config.tableColumns.length === 0) {
    console.error('[TableFluentUi] Missing or empty tableColumns in config:', config);
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#a4262c' }}>
        Error: Table configuration is missing column definitions
      </div>
    );
  }

  const [data, setData] = useState<TableRow[]>(
    (config.data || []).map((row, index) => ({ ...row, _index: index }))
  );
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Column configuration state
  const [columnOrder, setColumnOrder] = useState<string[]>(
    (config.tableColumns || []).filter(col => col.visible !== false).map(col => col.id)
  );
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: { operator: string; value: string } }>({});
  const [filterInputs, setFilterInputs] = useState<{ [key: string]: string }>({});
  const [filterOperators, setFilterOperators] = useState<{ [key: string]: string }>({});
  const [groupByColumn, setGroupByColumn] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Detect column data type based on first non-null value
  const getColumnDataType = useCallback((columnId: string): 'string' | 'number' | 'boolean' | 'date' => {
    for (const row of data) {
      const value = row[columnId];
      if (value != null) {
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'number') return 'number';
        if (value instanceof Date) return 'date';
        // Check if string looks like a date
        if (typeof value === 'string' && !isNaN(Date.parse(value)) && /\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
        return 'string';
      }
    }
    return 'string'; // Default to string
  }, [data]);

  // Get filter operators based on data type
  const getFilterOperators = useCallback((dataType: 'string' | 'number' | 'boolean' | 'date'): string[] => {
    switch (dataType) {
      case 'boolean':
        return ['Equals', 'Does not equal', 'Contains data', 'Does not contain data'];
      case 'number':
        return ['Equals', 'Does not equal', 'Greater than', 'Greater than or equal', 'Less than', 'Less than or equal', 'Contains data', 'Does not contain data'];
      case 'date':
        return ['Equals', 'Does not equal', 'On or after', 'On or before', 'Contains data', 'Does not contain data'];
      case 'string':
      default:
        return ['Equals', 'Does not equal', 'Contains', 'Does not contain', 'Begins with', 'Does not begin with', 'Ends with', 'Does not end with', 'Contains data', 'Does not contain data'];
    }
  }, []);

  // Update data when config.data changes (e.g., from setFieldValue)
  useEffect(() => {
    const newData = (config.data || []).map((row, index) => ({ ...row, _index: index }));
    setData(newData);
    // Clear selection when data changes
    setSelectedRows(new Set());
  }, [config.data]);

  // Update columnOrder when config.tableColumns changes
  useEffect(() => {
    const newOrder = (config.tableColumns || []).filter(col => col.visible !== false).map(col => col.id);
    setColumnOrder(newOrder);
  }, [config.tableColumns]);

  // Column menu handlers (sorting now handled by DataGrid)

  const handleMoveLeft = useCallback((columnId: string) => {
    setColumnOrder(prev => {
      const index = prev.indexOf(columnId);
      if (index <= 0) return prev;
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      return newOrder;
    });
  }, []);

  const handleMoveRight = useCallback((columnId: string) => {
    setColumnOrder(prev => {
      const index = prev.indexOf(columnId);
      if (index >= prev.length - 1) return prev;
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
    });
  }, []);

  const handleApplyFilter = useCallback((columnId: string) => {
    const filterValue = filterInputs[columnId] || '';
    const operator = filterOperators[columnId] || 'Equals';
    setColumnFilters(prev => ({
      ...prev,
      [columnId]: { operator, value: filterValue },
    }));
  }, [filterInputs, filterOperators]);

  const handleClearFilter = useCallback((columnId: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[columnId];
      return newFilters;
    });
    setFilterInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[columnId];
      return newInputs;
    });
    setFilterOperators(prev => {
      const newOperators = { ...prev };
      delete newOperators[columnId];
      return newOperators;
    });
  }, []);

  const handleGroupBy = useCallback((columnId: string) => {
    setGroupByColumn(prev => {
      const newGroupBy = prev === columnId ? null : columnId;
      // If grouping by a column, expand all groups by default
      if (newGroupBy) {
        // We'll populate this after groups are created
        // For now just clear it, the useMemo will handle expansion
      }
      return newGroupBy;
    });
  }, []);

  const toggleGroupExpansion = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  // Handle row selection
  const handleRowSelect = useCallback((rowIndex: number, checked: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (config.selectionMode === 'single') {
        newSet.clear();
      }
      if (checked) {
        newSet.add(rowIndex);
      } else {
        newSet.delete(rowIndex);
      }

      // Trigger callback
      if (onSelectionChange) {
        const selectedData = Array.from(newSet).map(idx => data[idx]);
        onSelectionChange(selectedData);
      }

      return newSet;
    });
  }, [config.selectionMode, data, onSelectionChange]);

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedRows(() => {
      const newSet = checked ? new Set(data.map((_, idx) => idx)) : new Set<number>();

      if (onSelectionChange) {
        const selectedData = Array.from(newSet).map(idx => data[idx]);
        onSelectionChange(selectedData);
      }

      return newSet;
    });
  }, [data, onSelectionChange]);



  // Apply filters only (DataGrid handles sorting)
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply filters
    Object.entries(columnFilters).forEach(([columnId, { operator, value: filterValue }]) => {
      filtered = filtered.filter(row => {
        const cellValue = row[columnId];
        const cellStr = cellValue != null ? String(cellValue).toLowerCase() : '';
        const filterStr = filterValue.toLowerCase();

        switch (operator) {
          case 'Equals':
            return cellStr === filterStr;
          case 'Does not equal':
            return cellStr !== filterStr;
          case 'Contains':
            return cellStr.includes(filterStr);
          case 'Does not contain':
            return !cellStr.includes(filterStr);
          case 'Begins with':
            return cellStr.startsWith(filterStr);
          case 'Does not begin with':
            return !cellStr.startsWith(filterStr);
          case 'Ends with':
            return cellStr.endsWith(filterStr);
          case 'Does not end with':
            return !cellStr.endsWith(filterStr);
          case 'Contains data':
            return cellValue != null && cellStr !== '';
          case 'Does not contain data':
            return cellValue == null || cellStr === '';
          case 'Greater than':
            return cellValue != null && Number(cellValue) > Number(filterValue);
          case 'Greater than or equal':
            return cellValue != null && Number(cellValue) >= Number(filterValue);
          case 'Less than':
            return cellValue != null && Number(cellValue) < Number(filterValue);
          case 'Less than or equal':
            return cellValue != null && Number(cellValue) <= Number(filterValue);
          case 'On or after':
            return cellValue != null && new Date(cellValue) >= new Date(filterValue);
          case 'On or before':
            return cellValue != null && new Date(cellValue) <= new Date(filterValue);
          default:
            return true;
        }
      });
    });

    return filtered;
  }, [data, columnFilters]);

  // Helper function to strip HTML tags from a string
  const stripHtmlTags = (html: string): string => {
    if (!html) return html;
    // Create a temporary div element to parse HTML
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Group data if groupByColumn is set
  const displayData = useMemo(() => {
    if (!groupByColumn) return filteredData;

    // Group rows by the selected column
    const groups = new Map<string, TableRow[]>();
    filteredData.forEach(row => {
      const groupValue = row[groupByColumn];
      let groupKey = groupValue != null ? String(groupValue) : '(Blank)';
      
      // Strip HTML tags from group key to group by actual text content
      if (groupKey !== '(Blank)' && groupKey.includes('<')) {
        groupKey = stripHtmlTags(groupKey);
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    });

    // Auto-expand all groups if expandedGroups is empty (first time grouping)
    const groupKeys = Array.from(groups.keys());
    let currentExpandedGroups = expandedGroups;
    if (expandedGroups.size === 0 && groupKeys.length > 0) {
      currentExpandedGroups = new Set(groupKeys);
      setExpandedGroups(currentExpandedGroups);
    }

    // Convert to flat array with group headers
    const result: TableRow[] = [];
    Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([groupKey, rows]) => {
        // Add group header row
        result.push({
          _index: -1,
          _isGroupHeader: true,
          _groupKey: groupKey,
          _groupCount: rows.length,
          _isExpanded: currentExpandedGroups.has(groupKey),
        } as any);

        // Add data rows if expanded
        if (currentExpandedGroups.has(groupKey)) {
          result.push(...rows);
        }
      });

    return result;
  }, [filteredData, groupByColumn, expandedGroups]);

  // Column header menu component (sorting handled by DataGrid natively)
  const ColumnHeaderMenu: React.FC<{ columnId: string; columnIndex: number }> = ({
    columnId,
    columnIndex,
  }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
    const [isWidthDialogOpen, setIsWidthDialogOpen] = useState(false);
    const [filterValue, setFilterValue] = useState(filterInputs[columnId] || '');
    const [selectedOperator, setSelectedOperator] = useState(filterOperators[columnId] || 'Equals');
    const [columnWidth, setColumnWidth] = useState('');
    const menuButtonRef = React.useRef<HTMLButtonElement>(null);
    const canMoveLeft = columnIndex > 0;
    const canMoveRight = columnIndex < columnOrder.length - 1;
    const dataType = getColumnDataType(columnId);
    const operators = getFilterOperators(dataType);

    return (
      <>
        <Menu open={isMenuOpen} onOpenChange={(_, data) => setIsMenuOpen(data.open)}>
          <MenuTrigger disableButtonEnhancement>
            <Button
              ref={menuButtonRef}
              appearance="subtle"
              icon={<ChevronDown20Regular />}
              className={styles.columnHeaderButton}
              aria-label="Column options"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<ArrowSortUp20Regular />}>
                A to Z
              </MenuItem>
              <MenuItem icon={<ArrowSortDown20Regular />}>
                Z to A
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={<GroupList20Regular />}
                onClick={() => {
                  handleGroupBy(columnId);
                  setIsMenuOpen(false);
                }}
              >
                {groupByColumn === columnId ? 'Ungroup' : 'Group by'}
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={<Filter20Regular />}
                onClick={() => {
                  setFilterValue(filterInputs[columnId] || '');
                  setSelectedOperator(filterOperators[columnId] || 'Equals');
                  setIsFilterDialogOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                Filter by
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={<ColumnTriple20Regular />}
                onClick={() => {
                  setIsWidthDialogOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                Column width
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={<ArrowLeft20Regular />}
                onClick={() => {
                  handleMoveLeft(columnId);
                  setIsMenuOpen(false);
                }}
                disabled={!canMoveLeft}
              >
                Move left
              </MenuItem>
              <MenuItem
                icon={<ArrowRight20Regular />}
                onClick={() => {
                  handleMoveRight(columnId);
                  setIsMenuOpen(false);
                }}
                disabled={!canMoveRight}
              >
                Move right
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        {/* Filter Callout */}
        <Popover
          open={isFilterDialogOpen}
          onOpenChange={(_, data) => setIsFilterDialogOpen(data.open)}
          positioning={{ target: menuButtonRef.current, position: 'below', align: 'start' }}
        >
          <PopoverSurface style={{ padding: '16px', width: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Filter by</span>
              <Button
                appearance="subtle"
                icon={<span style={{ fontSize: '12px' }}>✕</span>}
                onClick={() => setIsFilterDialogOpen(false)}
                size="small"
                style={{ minWidth: 'auto', padding: '4px' }}
              />
            </div>
            <label htmlFor={`filter-operator-${columnId}`} style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 600 }}>
              Operator
            </label>
            <Select
              id={`filter-operator-${columnId}`}
              value={selectedOperator}
              onChange={(_, data) => {
                const newOperator = data.value;
                setSelectedOperator(newOperator);
                setFilterOperators(prev => ({ ...prev, [columnId]: newOperator }));
              }}
              style={{ width: '100%', marginBottom: '8px' }}
            >
              {operators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </Select>
            <Input
              placeholder=""
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setFilterInputs(prev => ({ ...prev, [columnId]: filterValue }));
                  handleApplyFilter(columnId);
                  setIsFilterDialogOpen(false);
                }
              }}
              style={{ width: '100%', marginBottom: '12px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                appearance="primary"
                onClick={() => {
                  setFilterInputs(prev => ({ ...prev, [columnId]: filterValue }));
                  setFilterOperators(prev => ({ ...prev, [columnId]: selectedOperator }));
                  handleApplyFilter(columnId);
                  setIsFilterDialogOpen(false);
                }}
                style={{ flex: 1 }}
              >
                Apply
              </Button>
              <Button
                appearance="secondary"
                onClick={() => {
                  handleClearFilter(columnId);
                  setFilterValue('');
                  setSelectedOperator('Equals');
                  setIsFilterDialogOpen(false);
                }}
                style={{ flex: 1 }}
              >
                Clear
              </Button>
            </div>
          </PopoverSurface>
        </Popover>

        {/* Column Width Callout */}
        <Popover
          open={isWidthDialogOpen}
          onOpenChange={(_, data) => setIsWidthDialogOpen(data.open)}
          positioning={{ target: menuButtonRef.current, position: 'below', align: 'start' }}
        >
          <PopoverSurface style={{ padding: '16px', width: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Column width</span>
              <Button
                appearance="subtle"
                icon={<span style={{ fontSize: '12px' }}>✕</span>}
                onClick={() => setIsWidthDialogOpen(false)}
                size="small"
                style={{ minWidth: 'auto', padding: '4px' }}
              />
            </div>
            <Input
              placeholder="e.g., 200px or 20%"
              value={columnWidth}
              onChange={(e) => setColumnWidth(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Column width adjustment would be implemented here
                  setIsWidthDialogOpen(false);
                }
              }}
              style={{ width: '100%', marginBottom: '12px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                appearance="primary"
                onClick={() => {
                  // Column width adjustment would be implemented here
                  setIsWidthDialogOpen(false);
                }}
                style={{ flex: 1 }}
              >
                Apply
              </Button>
              <Button
                appearance="secondary"
                onClick={() => setIsWidthDialogOpen(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
            </div>
          </PopoverSurface>
        </Popover>
      </>
    );
  };

  // Calculate column widths based on container width
  // - Fixed columns (width property): exact pixel width, won't change
  // - Flexible columns (minWidth property): expand to fill remaining space
  const { columnSizingOptions, calculatedTableWidth } = useMemo(() => {
    const visibleColumns = (config.tableColumns || []).filter(col => col.visible !== false);
    
    // Selection column takes space if enabled
    const selectionColumnWidth = (config.selectionMode && config.selectionMode !== 'none') ? 48 : 0;
    
    // Available width for data columns
    const availableWidth = containerWidth > 0 ? containerWidth - selectionColumnWidth : 0;
    
    // Separate fixed and flexible columns
    const fixedColumns: { id: string; width: number }[] = [];
    const flexibleColumns: { id: string; minWidth: number }[] = [];
    
    visibleColumns.forEach(col => {
      if (col.width) {
        const widthStr = String(col.width).toLowerCase();
        
        // 'auto' means flexible column that fills remaining space
        if (widthStr === 'auto') {
          flexibleColumns.push({ id: col.id, minWidth: 100 });
        } else {
          // Fixed width column
          const numericWidth = parseInt(widthStr);
          if (!isNaN(numericWidth) && !widthStr.includes('%')) {
            fixedColumns.push({ id: col.id, width: numericWidth });
          } else {
            // Percentage or invalid - treat as flexible with default minWidth
            flexibleColumns.push({ id: col.id, minWidth: 100 });
          }
        }
      } else if (col.minWidth) {
        // Flexible column with minimum width
        const minWidthStr = String(col.minWidth);
        const numericMinWidth = parseInt(minWidthStr);
        if (!isNaN(numericMinWidth) && !minWidthStr.includes('%')) {
          flexibleColumns.push({ id: col.id, minWidth: numericMinWidth });
        } else {
          flexibleColumns.push({ id: col.id, minWidth: 100 });
        }
      } else {
        // No width specified - flexible with default
        flexibleColumns.push({ id: col.id, minWidth: 100 });
      }
    });
    
    // Calculate total fixed width
    const totalFixedWidth = fixedColumns.reduce((sum, col) => sum + col.width, 0);
    
    // Calculate minimum width needed for flexible columns
    const totalFlexibleMinWidth = flexibleColumns.reduce((sum, col) => sum + col.minWidth, 0);
    
    // Calculate remaining space for flexible columns
    const remainingSpace = availableWidth - totalFixedWidth;
    
    // Distribute remaining space among flexible columns
    // If remaining space > total min width, expand flexible columns proportionally
    // If remaining space < total min width, use min widths (will cause horizontal scroll)
    const flexibleColumnWidths: { [id: string]: number } = {};
    
    if (flexibleColumns.length > 0 && remainingSpace > 0) {
      if (remainingSpace >= totalFlexibleMinWidth) {
        // We have extra space - distribute proportionally based on minWidth
        const extraSpace = remainingSpace - totalFlexibleMinWidth;
        flexibleColumns.forEach(col => {
          const proportion = col.minWidth / totalFlexibleMinWidth;
          flexibleColumnWidths[col.id] = Math.floor(col.minWidth + (extraSpace * proportion));
        });
      } else {
        // Not enough space - use minWidth (will scroll)
        flexibleColumns.forEach(col => {
          flexibleColumnWidths[col.id] = col.minWidth;
        });
      }
    } else {
      // No container width yet or no flexible columns - use minWidths
      flexibleColumns.forEach(col => {
        flexibleColumnWidths[col.id] = col.minWidth;
      });
    }
    
    // Build sizing options
    const sizing: { [key: string]: { minWidth?: number; defaultWidth?: number; idealWidth?: number } } = {};
    
    // Fixed columns
    fixedColumns.forEach(col => {
      sizing[col.id] = {
        minWidth: col.width,
        idealWidth: col.width,
        defaultWidth: col.width,
      };
    });
    
    // Flexible columns with calculated widths
    flexibleColumns.forEach(col => {
      const calculatedWidth = flexibleColumnWidths[col.id] || col.minWidth;
      sizing[col.id] = {
        minWidth: col.minWidth,        // Minimum they can be
        idealWidth: calculatedWidth,   // Calculated ideal
        defaultWidth: calculatedWidth, // Start at calculated
      };
    });
    
    // Calculate total table width
    const totalWidth = selectionColumnWidth + 
      fixedColumns.reduce((sum, col) => sum + col.width, 0) +
      flexibleColumns.reduce((sum, col) => sum + (flexibleColumnWidths[col.id] || col.minWidth), 0);
    
    console.log('[TableFluentUi] Column sizing calculation:', {
      containerWidth,
      availableWidth,
      fixedColumns,
      flexibleColumns,
      flexibleColumnWidths,
      totalWidth,
      sizing
    });
    
    return { columnSizingOptions: sizing, calculatedTableWidth: totalWidth };
  }, [config.tableColumns, config.selectionMode, containerWidth]);

  // Create a map of column IDs to their calculated widths for direct application
  const columnWidthMap = useMemo(() => {
    const widthMap: { [columnId: string]: number } = {};
    
    // Get calculated widths from columnSizingOptions
    Object.entries(columnSizingOptions).forEach(([colId, sizing]) => {
      widthMap[colId] = sizing.defaultWidth || sizing.idealWidth || sizing.minWidth || 100;
    });
    
    return widthMap;
  }, [columnSizingOptions]);

  // Define columns
  const columns: TableColumnDefinition<TableRow>[] = useMemo(() => {
    // Debug: Log what we're working with
    console.log('[TableFluentUi] Building columns from config:', {
      hasConfig: !!config,
      hasTableColumns: !!config?.tableColumns,
      isArray: Array.isArray(config?.tableColumns),
      length: config?.tableColumns?.length,
      tableColumns: config?.tableColumns
    });

    const cols: TableColumnDefinition<TableRow>[] = [];

    // Data columns
    const visibleColumns = (config.tableColumns || []).filter(col => col.visible !== false);

    // Debug: Log column configuration
    if (visibleColumns.length === 0) {
      console.debug(...UILIB, 'TableFluentUi: No visible columns found. tableColumns:', config.tableColumns);
    }

    // Sort columns by columnOrder
    const orderedCols = columnOrder
      .map(colId => visibleColumns.find(col => col.id === colId))
      .filter(col => col != null);

    orderedCols.forEach((column, index) => {
      cols.push(
        createTableColumn<TableRow>({
          columnId: column.id,
          renderHeaderCell: () => {
            const headerAlign = column.align || 'left';
            const justifyContent = headerAlign === 'right' ? 'flex-end' : headerAlign === 'center' ? 'center' : 'space-between';
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent, width: '100%', gap: '8px' }}>
                <span style={{ textAlign: headerAlign, flex: headerAlign === 'left' ? 1 : 'none' }}>{column.header}</span>
                <ColumnHeaderMenu
                  columnId={column.id}
                  columnIndex={index}
                />
              </div>
            );
          },
          renderCell: (item: TableRow) => {
            // Check if this is a group header row
            if ((item as any)._isGroupHeader) {
              // Only render content in first column
              if (index === 0) {
                const groupKey = (item as any)._groupKey;
                const groupCount = (item as any)._groupCount;
                const isExpanded = (item as any)._isExpanded;
                return (
                  <TableCellLayout>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleGroupExpansion(groupKey)}
                    >
                      <span style={{ fontSize: '16px' }}>{isExpanded ? '▼' : '▶'}</span>
                      <span>{groupKey} ({groupCount})</span>
                    </div>
                  </TableCellLayout>
                );
              }
              return <TableCellLayout></TableCellLayout>;
            }

            const cellValue = item[column.id];
            const textAlign = column.align || 'left';
            // Convert text-align to justify-content for flex layout
            const justifyContent = textAlign === 'right' ? 'flex-end' : textAlign === 'center' ? 'center' : 'flex-start';

            // If the value is a string that looks like HTML, render it as HTML
            if (typeof cellValue === 'string' && (cellValue.includes('<') || cellValue.includes('&'))) {
              return (
                <TableCellLayout truncate style={{ justifyContent }}>
                  <div className={styles.truncatedCell} style={{ textAlign, width: '100%' }} dangerouslySetInnerHTML={{ __html: cellValue }} />
                </TableCellLayout>
              );
            }

            // Otherwise render as text
            return (
              <TableCellLayout truncate title={cellValue != null ? String(cellValue) : ''} style={{ justifyContent }}>
                <span style={{ textAlign, width: textAlign === 'left' ? 'auto' : '100%' }}>
                  {cellValue != null ? String(cellValue) : ''}
                </span>
              </TableCellLayout>
            );
          },
          // ALWAYS provide compare function to avoid Fluent UI context errors
          // Even for non-sortable columns, DataGrid expects a compare function
          compare: (a: TableRow, b: TableRow) => {
            // If column is explicitly non-sortable, return 0 (no change in order)
            if (column.sortable === false) return 0;

            const aVal = a[column.id];
            const bVal = b[column.id];

            // Handle null/undefined
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return -1;
            if (bVal == null) return 1;

            // String comparison
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              return aVal.localeCompare(bVal);
            }

            // Number comparison
            return Number(aVal) - Number(bVal);
          },
        })
      );
    });

    console.log('[TableFluentUi] Built columns array:', {
      count: cols.length,
      columnIds: cols.map(c => c.columnId)
    });

    return cols;
  }, [config, data.length, selectedRows, handleSelectAll, handleRowSelect, styles.radioButton, columnOrder, columnFilters, filterInputs, handleMoveLeft, handleMoveRight, handleApplyFilter, handleClearFilter, groupByColumn, toggleGroupExpansion]);

  if (data.length === 0) {
    return (
      <div className={styles.emptyState}>
        No data available
      </div>
    );
  }

  // Safety check before rendering DataGrid
  console.log('[TableFluentUi] About to render DataGrid with:', {
    hasColumns: !!columns,
    columnsLength: columns?.length,
    isArray: Array.isArray(columns),
    columns: columns,
    hasSortableColumns: columns?.some(c => c.compare !== undefined)
  });

  if (!columns || columns.length === 0) {
    console.error('[TableFluentUi] Columns is empty or undefined before DataGrid render!');
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#a4262c' }}>
        Error: Table columns became undefined
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <DataGrid
        items={displayData}
        columns={columns as any}
        sortable={!groupByColumn}
        resizableColumns={false}  // Disable resizing to prevent space distribution
        columnSizingOptions={columnSizingOptions}
        selectionMode={config.selectionMode === 'none' ? undefined : config.selectionMode === 'multiple' ? 'multiselect' : 'single'}
        selectedItems={Array.from(selectedRows)}
        key={`datagrid-${config.tableColumns?.length || 0}-${data.length}-${containerWidth}`}
        onSelectionChange={(_, data) => {
          const newSelectedIndexes = new Set<number>();
          const selectedItemsArray = Array.from(data.selectedItems);
          selectedItemsArray.forEach((itemId: any) => {
            const idx = typeof itemId === 'number' ? itemId : parseInt(String(itemId));
            if (!isNaN(idx)) newSelectedIndexes.add(idx);
          });
          setSelectedRows(newSelectedIndexes);
          if (onSelectionChange) {
            const selectedData = Array.from(newSelectedIndexes)
              .map(idx => displayData[idx])
              .filter(item => !(item as any)._isGroupHeader); // Exclude group headers
            onSelectionChange(selectedData);
          }
        }}
        className={styles.dataGrid}
        style={{ 
          tableLayout: 'fixed', 
          width: containerWidth > 0 ? `${Math.min(calculatedTableWidth, containerWidth)}px` : '100%' 
        }}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell, columnId }) => {
              const colWidth = columnWidthMap[columnId as string];
              return (
                <DataGridHeaderCell style={colWidth ? { width: `${colWidth}px`, minWidth: `${colWidth}px`, maxWidth: `${colWidth}px` } : undefined}>
                  {renderHeaderCell()}
                </DataGridHeaderCell>
              );
            }}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<TableRow>>
          {({ item, rowId }) => (
            <DataGridRow<TableRow> key={rowId}>
              {({ renderCell, columnId }) => {
                const colWidth = columnWidthMap[columnId as string];
                return (
                  <DataGridCell style={colWidth ? { width: `${colWidth}px`, minWidth: `${colWidth}px`, maxWidth: `${colWidth}px` } : undefined}>
                    {renderCell(item)}
                  </DataGridCell>
                );
              }}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  );
};
