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
  Switch,
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
  Checkmark20Filled,
  Subtract20Regular,
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
    flex: 1,
    width: '100%',               // Fill available space
    minWidth: 0,                 // Allow flex parent to shrink us
    minHeight: 0,                // Allow flex child to shrink so inner body can scroll
    // Horizontal scroll lives on the outer container so the header scrolls
    // sideways with the body. Vertical scroll lives on the DataGridBody (see
    // below) so the scrollbar starts at the rows, not next to the header.
    overflowX: 'auto',
    overflowY: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '0',                // No padding - maximize table space
    boxSizing: 'border-box',
    position: 'relative',        // Establish positioning context
    // Thin scrollbars (Firefox + WebKit). Applied here so the horizontal
    // scrollbar (when it does appear) matches the vertical one on the body.
    scrollbarWidth: 'thin' as any,
    scrollbarColor: `${tokens.colorNeutralStroke1} transparent`,
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: tokens.colorNeutralStroke1,
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: tokens.colorNeutralStroke1Hover,
    },
  },
  dataGrid: {
    width: '100%',               // Fill container exactly
    minWidth: 0,                 // CRITICAL: do NOT use fit-content here — it forces the
                                  // grid to be at least as wide as the sum of column widths,
                                  // which beats `width: 100%` and triggers a phantom
                                  // horizontal scrollbar from sub-pixel rounding.
    // No tableLayout: 'fixed' — Fluent's resizableColumns manages column
    // sizing internally. Fixed layout would prevent drag-resize from working.
    backgroundColor: tokens.colorNeutralBackground1,
    // Make the DataGrid itself a flex column so the body can take the
    // remaining height after the (auto-sized) header.
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    '& .fui-DataGridHeader': {
      backgroundColor: tokens.colorNeutralBackground1,
      flex: '0 0 auto',
    },
    // The body — not the outer container — is the vertical scroll surface.
    // This puts the scrollbar alongside the rows only, leaving the header
    // pinned cleanly above with no scrollbar gutter next to it.
    '& .fui-DataGridBody': {
      flex: '1 1 auto',
      minHeight: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
      // Thin scrollbars matching the outer container.
      scrollbarWidth: 'thin' as any,
      scrollbarColor: `${tokens.colorNeutralStroke1} transparent`,
      '&::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: tokens.colorNeutralStroke1,
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: tokens.colorNeutralStroke1Hover,
      },
    },
    '& .fui-DataGridHeader .fui-DataGridRow': {
      borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,  // Darker border for header row
    },
    '& .fui-DataGridHeaderCell': {
      backgroundColor: 'transparent',
      fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
      WebkitFontSmoothing: 'antialiased',
      fontSize: tokens.fontSizeBase300,
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground1,
      padding: '0 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '42px',
      borderRight: 'none',
      textTransform: 'none',
      letterSpacing: 'normal',
      whiteSpace: 'nowrap',
      // No hover/focus outline — the user found the brand-blue ring around
      // headers visually noisy. The header still highlights via the underlying
      // Fluent DataGrid hover background, which is enough affordance for sort.
      '&:hover, &:active, &:focus, &:focus-visible': {
        backgroundColor: 'transparent',
        outline: 'none',
      },
    },
    '& .fui-DataGridRow': {
      borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,  // Row-level border
    },
    '& .fui-DataGridCell': {
      fontSize: tokens.fontSizeBase300,
      color: tokens.colorNeutralForeground1,
      padding: '0 12px',
      height: '42px',
      borderRight: 'none',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    },
  },
  truncatedCell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    display: 'inline-block',
    color: tokens.colorNeutralForeground1,
    textDecoration: 'none',
    '& *': {
      color: 'inherit !important',
      textDecoration: 'inherit',
    },
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
  disabledRow: {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  disabledCheckbox: {
    cursor: 'not-allowed',
    opacity: 0.5,
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
    color: tokens.colorNeutralForeground2,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  columnHeaderButtonFiltered: {
    minWidth: 'auto',
    padding: '4px',
    height: '24px',
    color: tokens.colorBrandForeground1,
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  clearFilterButton: {
    minWidth: 'auto',
    padding: '2px',
    height: '20px',
    width: '20px',
    color: tokens.colorBrandForeground1,
    borderRadius: '50%',
    '&:hover': {
      backgroundColor: tokens.colorPaletteRedBackground2,
      color: tokens.colorPaletteRedForeground1,
    },
  },
  filterInput: {
    width: '200px',
  },
  // Static one-shot styles lifted out of inline JSX style props so the
  // "no inline styles" lint rule stops firing on every render site.
  errorFallback: {
    padding: '20px',
    textAlign: 'center',
    color: tokens.colorPaletteRedForeground1,
  },
  clearFilterIcon: {
    fontSize: '10px',
    lineHeight: 1,
  },
  popoverHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  popoverTitle: {
    fontWeight: 600,
    fontSize: '14px',
  },
  popoverCloseIcon: {
    fontSize: '12px',
  },
  popoverFieldLabel: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '12px',
    fontWeight: 600,
  },
  popoverButtonRow: {
    display: 'flex',
    gap: '8px',
  },
  groupHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  groupExpandIcon: {
    fontSize: '16px',
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
    console.error(...UILIB, '[TableFluentUi] Missing or empty tableColumns in config:', config);
    return (
      <div className={styles.errorFallback}>
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

  // User-applied column width overrides from the "Column width" popover.
  // Keyed by column ID, value is width in pixels. Merged into columnSizingOptions.
  const [columnWidthOverrides, setColumnWidthOverrides] = useState<Record<string, number>>({});

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

  // ── Unified cell formatter ──────────────────────────────────────────
  // Single source of truth for both Modal `type: 'table'` and `uiLib.Lookup`.
  // Returns either a plain string OR an HTML string (check for '<' prefix to
  // decide whether to use dangerouslySetInnerHTML in the cell renderer).
  const formatCellValue = useCallback((value: any, format?: string): string => {
    const toNum = (v: any): number | null => {
      if (typeof v === 'number') return v;
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };
    // Colour helper: positive → green, negative → red, zero/null → muted grey.
    const numColor = (n: number | null): string =>
      n == null ? '#a19f9d' : n < 0 ? '#d13438' : n > 0 ? '#107c10' : '#a19f9d';

    // Null / undefined → em-dash placeholder for numeric/date formats, empty for others.
    if (value == null || value === '') {
      const numericFormats = ['currency', 'percent', 'number', 'decimal', 'integer', 'date', 'datetime'];
      if (format && numericFormats.indexOf(format) !== -1) {
        return '<span style="color:#a19f9d">\u2014</span>';
      }
      return '';
    }

    switch (format) {
      case 'currency': {
        const n = toNum(value);
        if (n == null) return String(value);
        // narrowSymbol → '$' instead of 'US$' in non-US locales.
        const display = new Intl.NumberFormat(undefined, {
          style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol',
          minimumFractionDigits: 2, maximumFractionDigits: 2
        } as any).format(n);
        return `<span style="color:${numColor(n)}">${display}</span>`;
      }

      case 'percent': {
        const n = toNum(value);
        if (n == null) return String(value);
        // Auto-detect: |n| < 1 treated as fraction (0.25 → 25.00%), else as-is.
        const pct = Math.abs(n) < 1 ? n * 100 : n;
        const display = `${pct.toFixed(2)}%`;
        return `<span style="color:${numColor(n)}">${display}</span>`;
      }

      case 'number': {
        const n = toNum(value);
        if (n == null) return String(value);
        return n.toLocaleString();
      }

      case 'decimal': {
        const n = toNum(value);
        if (n == null) return String(value);
        return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }

      case 'integer': {
        const n = toNum(value);
        if (n == null) return String(value);
        return Math.round(n).toLocaleString();
      }

      case 'date': {
        try {
          return new Date(value).toLocaleDateString();
        } catch { return String(value); }
      }

      case 'datetime': {
        try {
          const d = new Date(value);
          return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
        } catch { return String(value); }
      }

      case 'badge': {
        const label = String(value);
        return `<span style="background:#f0f0f0;color:#242424;padding:2px 10px;border-radius:12px;font-size:12px">${label}</span>`;
      }

      case 'text':
        return String(value);

      default:
        return String(value);
    }
  }, []);

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

  const handleApplyFilter = useCallback((columnId: string, directValue?: string, directOperator?: string) => {
    const filterValue = directValue ?? filterInputs[columnId] ?? '';
    const operator = directOperator ?? filterOperators[columnId] ?? 'Equals';
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

  // Check if a row is selectable
  const isRowSelectableCheck = useCallback((rowIndex: number): boolean => {
    if (!config.isRowSelectable) return true; // All rows selectable if not specified
    const row = data[rowIndex];
    return config.isRowSelectable(row);
  }, [config, data]);

  // Handle row selection
  const handleRowSelect = useCallback((rowIndex: number, checked: boolean) => {
    // Check if row is selectable
    if (!isRowSelectableCheck(rowIndex)) {
      return; // Don't allow selection of disabled rows
    }

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
  }, [config.selectionMode, data, onSelectionChange, isRowSelectableCheck]);

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedRows(() => {
      // Only select rows that are selectable
      const newSet = checked 
        ? new Set(data.map((_, idx) => idx).filter(idx => isRowSelectableCheck(idx))) 
        : new Set<number>();

      if (onSelectionChange) {
        const selectedData = Array.from(newSet).map(idx => data[idx]);
        onSelectionChange(selectedData);
      }

      return newSet;
    });
  }, [data, onSelectionChange, isRowSelectableCheck]);



  // Apply filters only (DataGrid handles sorting)
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply filters
    Object.entries(columnFilters).forEach(([columnId, { operator, value: filterValue }]) => {
      filtered = filtered.filter(row => {
        const cellValue = row[columnId];
        // Strip HTML tags so filters compare against display text, not markup
        const rawStr = cellValue != null ? String(cellValue) : '';
        const cellStr = (rawStr.includes('<') ? rawStr.replace(/<[^>]*>/g, '') : rawStr).toLowerCase();
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
  // Callback for the column width popover — parses the user's input and
  // stores an override that is merged into columnSizingOptions.
  const applyColumnWidth = useCallback((columnId: string, widthInput: string) => {
    const parsed = parseInt(widthInput, 10);
    if (isNaN(parsed) || parsed < 20) return; // Ignore junk / too-small values
    setColumnWidthOverrides(prev => ({ ...prev, [columnId]: parsed }));
  }, []);

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
    const isFiltered = !!columnFilters[columnId];

    return (
      <>
        {isFiltered && (
          <Button
            appearance="subtle"
            icon={<span className={styles.clearFilterIcon}>✕</span>}
            className={styles.clearFilterButton}
            aria-label="Clear filter"
            title={`Filtered: ${columnFilters[columnId].operator} '${columnFilters[columnId].value}'`}
            onClick={(e) => {
              e.stopPropagation();
              handleClearFilter(columnId);
              setFilterValue('');
              setSelectedOperator('Equals');
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        )}
        <Menu open={isMenuOpen} onOpenChange={(_, data) => setIsMenuOpen(data.open)}>
          <MenuTrigger disableButtonEnhancement>
            <Button
              ref={menuButtonRef}
              appearance="subtle"
              icon={isFiltered ? <Filter20Regular /> : <ChevronDown20Regular />}
              className={isFiltered ? styles.columnHeaderButtonFiltered : styles.columnHeaderButton}
              aria-label={isFiltered ? 'Column options (filtered)' : 'Column options'}
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
          <PopoverSurface
            style={{ padding: '16px', width: '240px' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className={styles.popoverHeader}>
              <span className={styles.popoverTitle}>Filter by</span>
              <Button
                appearance="subtle"
                icon={<span className={styles.popoverCloseIcon}>✕</span>}
                onClick={() => setIsFilterDialogOpen(false)}
                size="small"
                style={{ minWidth: 'auto', padding: '4px' }}
              />
            </div>
            <label htmlFor={`filter-operator-${columnId}`} className={styles.popoverFieldLabel}>
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
                  setFilterOperators(prev => ({ ...prev, [columnId]: selectedOperator }));
                  handleApplyFilter(columnId, filterValue, selectedOperator);
                  setIsFilterDialogOpen(false);
                }
              }}
              style={{ width: '100%', marginBottom: '12px', boxSizing: 'border-box' }}
            />
            <div className={styles.popoverButtonRow}>
              <Button
                appearance="primary"
                onClick={() => {
                  setFilterInputs(prev => ({ ...prev, [columnId]: filterValue }));
                  setFilterOperators(prev => ({ ...prev, [columnId]: selectedOperator }));
                  handleApplyFilter(columnId, filterValue, selectedOperator);
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
          <PopoverSurface
            style={{ padding: '16px', width: '240px' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className={styles.popoverHeader}>
              <span className={styles.popoverTitle}>Column width</span>
              <Button
                appearance="subtle"
                icon={<span className={styles.popoverCloseIcon}>✕</span>}
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
                  applyColumnWidth(columnId, columnWidth);
                  setIsWidthDialogOpen(false);
                }
              }}
              style={{ width: '100%', marginBottom: '12px', boxSizing: 'border-box' }}
            />
            <div className={styles.popoverButtonRow}>
              <Button
                appearance="primary"
                onClick={() => {
                  applyColumnWidth(columnId, columnWidth);
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
  const { columnSizingOptions } = useMemo(() => {
    const visibleColumns = (config.tableColumns || []).filter(col => col.visible !== false);
    
    // Selection column takes space if enabled
    const selectionColumnWidth = (config.selectionMode && config.selectionMode !== 'none') ? 48 : 0;
    
    // Available width for data columns
    const availableWidth = containerWidth > 0 ? containerWidth - selectionColumnWidth : 0;
    
    // Find the elastic column (only one allowed — first one wins)
    const elasticCol = visibleColumns.find(col => col.elastic);

    // Separate fixed and flexible columns
    const fixedColumns: { id: string; width: number }[] = [];
    const flexibleColumns: { id: string; minWidth: number }[] = [];

    visibleColumns.forEach(col => {
      // The elastic column is always flexible — skip any explicit width on it
      if (col.elastic) {
        const minW = col.minWidth ? parseInt(String(col.minWidth)) || 100 : 100;
        flexibleColumns.push({ id: col.id, minWidth: minW });
        return;
      }

      if (col.width) {
        const widthStr = String(col.width).toLowerCase();

        if (widthStr === 'auto') {
          flexibleColumns.push({ id: col.id, minWidth: 100 });
        } else {
          const numericWidth = parseInt(widthStr);
          if (!isNaN(numericWidth) && !widthStr.includes('%')) {
            fixedColumns.push({ id: col.id, width: numericWidth });
          } else {
            flexibleColumns.push({ id: col.id, minWidth: 100 });
          }
        }
      } else if (col.minWidth) {
        const minWidthStr = String(col.minWidth);
        const numericMinWidth = parseInt(minWidthStr);
        if (!isNaN(numericMinWidth) && !minWidthStr.includes('%')) {
          // When an elastic column exists, treat non-elastic flexible columns
          // as fixed at their minWidth so only the elastic one grows.
          if (elasticCol) {
            fixedColumns.push({ id: col.id, width: numericMinWidth });
          } else {
            flexibleColumns.push({ id: col.id, minWidth: numericMinWidth });
          }
        } else {
          flexibleColumns.push({ id: col.id, minWidth: 100 });
        }
      } else {
        // No width specified
        if (elasticCol) {
          fixedColumns.push({ id: col.id, width: 100 });
        } else {
          flexibleColumns.push({ id: col.id, minWidth: 100 });
        }
      }
    });

    // Calculate total fixed width
    const totalFixedWidth = fixedColumns.reduce((sum, col) => sum + col.width, 0);

    // Calculate minimum width needed for flexible columns
    const totalFlexibleMinWidth = flexibleColumns.reduce((sum, col) => sum + col.minWidth, 0);

    // Calculate remaining space for flexible columns
    const remainingSpace = availableWidth - totalFixedWidth;

    // Distribute remaining space among flexible columns.
    // When an elastic column is set, it gets ALL the remaining space (minus
    // other flexible columns' minimums). Otherwise distribute proportionally.
    const flexibleColumnWidths: { [id: string]: number } = {};

    if (flexibleColumns.length > 0 && remainingSpace > 0) {
      if (elasticCol && remainingSpace >= totalFlexibleMinWidth) {
        // Elastic mode: non-elastic flexibles get their minWidth,
        // the elastic column absorbs everything else.
        let elasticWidth = remainingSpace;
        flexibleColumns.forEach(col => {
          if (col.id === elasticCol.id) return; // handle last
          flexibleColumnWidths[col.id] = col.minWidth;
          elasticWidth -= col.minWidth;
        });
        flexibleColumnWidths[elasticCol.id] = Math.max(
          flexibleColumns.find(c => c.id === elasticCol.id)!.minWidth,
          elasticWidth
        );
      } else if (remainingSpace >= totalFlexibleMinWidth) {
        // No elastic column — distribute proportionally.
        const extraSpace = remainingSpace - totalFlexibleMinWidth;
        let allocated = 0;
        flexibleColumns.forEach((col) => {
          const proportion = col.minWidth / totalFlexibleMinWidth;
          const w = Math.floor(col.minWidth + (extraSpace * proportion));
          flexibleColumnWidths[col.id] = w;
          allocated += w;
        });
        // Rounding remainder goes to the first flexible column.
        const remainder = remainingSpace - allocated;
        if (remainder > 0 && flexibleColumns.length > 0) {
          flexibleColumnWidths[flexibleColumns[0].id] += remainder;
        }
      } else {
        // Not enough space - use minWidth (will scroll)
        flexibleColumns.forEach(col => {
          flexibleColumnWidths[col.id] = col.minWidth;
        });
      }
    } else if (flexibleColumns.length > 0 && elasticCol) {
      // No container width yet but we have an elastic column. We can't
      // calculate the real remaining space yet, so just give each flexible
      // column its minWidth. The grid uses width: '100%' on first render
      // (see below), so CSS will stretch the table to fill the container
      // naturally. Once the ResizeObserver fires with a real containerWidth,
      // this useMemo re-runs and calculates exact pixel widths.
      flexibleColumns.forEach(col => {
        flexibleColumnWidths[col.id] = col.minWidth;
      });
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
    
    return { columnSizingOptions: sizing, calculatedTableWidth: totalWidth };
  }, [config.tableColumns, config.selectionMode, containerWidth]);

  // Merge user-applied width overrides (from the "Column width" popover) into
  // the auto-calculated sizing. Overrides replace all three sizing fields so
  // the column becomes fixed at the user-specified width.
  const mergedSizingOptions = useMemo(() => {
    const merged = { ...columnSizingOptions };
    for (const [colId, widthPx] of Object.entries(columnWidthOverrides)) {
      merged[colId] = {
        minWidth: widthPx,
        idealWidth: widthPx,
        defaultWidth: widthPx,
      };
    }
    return merged;
  }, [columnSizingOptions, columnWidthOverrides]);

  // Build a map of column ID → calculated pixel width for inline cell styles.
  // Fluent's resizableColumns doesn't strictly honour columnSizingOptions —
  // it treats them as hints and redistributes space (dumping slack on the last
  // column). Applying width + minWidth directly on cells enforces our layout
  // while still allowing the user to drag-resize (no maxWidth lock).
  const columnWidthMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [colId, sizing] of Object.entries(mergedSizingOptions)) {
      map[colId] = sizing.defaultWidth || sizing.idealWidth || sizing.minWidth || 100;
    }
    return map;
  }, [mergedSizingOptions]);

  // Recalculate total table width including overrides.
  const mergedTableWidth = useMemo(() => {
    let total = Object.values(columnWidthMap).reduce((sum, w) => sum + w, 0);
    if (config.selectionMode && config.selectionMode !== 'none') {
      total += 48;
    }
    return total;
  }, [columnWidthMap, config.selectionMode]);

  // Define columns
  const columns: TableColumnDefinition<TableRow>[] = useMemo(() => {
    const cols: TableColumnDefinition<TableRow>[] = [];

    // Data columns
    const visibleColumns = (config.tableColumns || []).filter(col => col.visible !== false);

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
                      className={styles.groupHeaderRow}
                      onClick={() => toggleGroupExpansion(groupKey)}
                    >
                      <span className={styles.groupExpandIcon}>{isExpanded ? '▼' : '▶'}</span>
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

            // Boolean columns: render as disabled Switch
            if ((column as any).format === 'boolean') {
              const isChecked = cellValue === true || cellValue === 1 || cellValue === 'true';
              return (
                <TableCellLayout style={{ justifyContent }}>
                  <Switch
                    checked={isChecked}
                    disabled
                    style={{ pointerEvents: 'none' }}
                  />
                </TableCellLayout>
              );
            }

            // Boolean (check) columns: Fluent check icon when true, Fluent subtract (em-dash) when false
            if ((column as any).format === 'boolean-check') {
              const isChecked = cellValue === true || cellValue === 1 || cellValue === 'true';
              return (
                <TableCellLayout style={{ justifyContent }}>
                  {isChecked ? (
                    <Checkmark20Filled
                      aria-label="true"
                      primaryFill={tokens.colorPaletteGreenForeground1}
                    />
                  ) : (
                    <Subtract20Regular
                      aria-label="false"
                      primaryFill={tokens.colorNeutralForeground3}
                    />
                  )}
                </TableCellLayout>
              );
            }

            // Apply formatting if column has format property
            const displayValue = (column as any).format ? formatCellValue(cellValue, (column as any).format) : cellValue;

            // If the value is a string that looks like HTML, render it as HTML
            if (typeof displayValue === 'string' && (displayValue.includes('<') || displayValue.includes('&'))) {
              return (
                <TableCellLayout truncate style={{ justifyContent }}>
                  <div className={styles.truncatedCell} style={{ textAlign, width: '100%' }} dangerouslySetInnerHTML={{ __html: displayValue }} />
                </TableCellLayout>
              );
            }

            // Otherwise render as text
            return (
              <TableCellLayout truncate title={displayValue != null ? String(displayValue) : ''} style={{ justifyContent }}>
                <span style={{ textAlign, width: textAlign === 'left' ? 'auto' : '100%' }}>
                  {displayValue != null ? String(displayValue) : ''}
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

    return cols;
  }, [config, data.length, selectedRows, handleSelectAll, handleRowSelect, styles.radioButton, columnOrder, columnFilters, filterInputs, handleMoveLeft, handleMoveRight, handleApplyFilter, handleClearFilter, groupByColumn, toggleGroupExpansion]);

  if (data.length === 0) {
    return (
      <div className={styles.emptyState}>
        No data available
      </div>
    );
  }

  if (!columns || columns.length === 0) {
    console.error(...UILIB, '[TableFluentUi] Columns is empty or undefined before DataGrid render!');
    return (
      <div className={styles.errorFallback}>
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
        resizableColumns  // Allow user to drag column borders to resize
        columnSizingOptions={mergedSizingOptions}
        selectionMode={config.selectionMode === 'none' ? undefined : config.selectionMode === 'multiple' ? 'multiselect' : 'single'}
        selectedItems={Array.from(selectedRows)}
        key={`datagrid-${config.tableColumns?.length || 0}-${data.length}-${containerWidth}-${Object.keys(columnWidthOverrides).length}`}
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
          // When containerWidth is known, use the exact calculated total so
          // there's no unclaimed space for the DataGrid to redistribute.
          // On initial render (containerWidth=0), use 100% so the table fills
          // the container and the ResizeObserver can measure it.
          width: containerWidth > 0 ? `${mergedTableWidth}px` : '100%'
        }}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell, columnId }) => {
              const w = columnWidthMap[columnId as string];
              return (
                <DataGridHeaderCell style={w ? { minWidth: `${w}px` } : undefined}>
                  {renderHeaderCell()}
                </DataGridHeaderCell>
              );
            }}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<TableRow>>
          {({ item, rowId }) => {
            const rowIndex = item._index;
            const isSelectable = rowIndex >= 0 ? isRowSelectableCheck(rowIndex) : true;
            const isGroupHeader = (item as any)._isGroupHeader;

            return (
              <DataGridRow<TableRow>
                key={rowId}
                className={!isSelectable && !isGroupHeader ? styles.disabledRow : undefined}
                onDoubleClick={() => {
                  if (!isGroupHeader && config.onRowDoubleClick) {
                    config.onRowDoubleClick(item);
                  }
                }}
                style={config.onRowDoubleClick && !isGroupHeader ? { cursor: 'pointer' } : undefined}
              >
                {({ renderCell, columnId }) => {
                  const w = columnWidthMap[columnId as string];
                  return (
                    <DataGridCell style={w ? { minWidth: `${w}px` } : undefined}>
                      {renderCell(item)}
                    </DataGridCell>
                  );
                }}
              </DataGridRow>
            );
          }}
        </DataGridBody>
      </DataGrid>
    </div>
  );
};
