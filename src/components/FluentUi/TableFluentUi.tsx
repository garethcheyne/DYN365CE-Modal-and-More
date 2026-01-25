/**
 * Table field component using Fluent UI DataGrid
 * Replaces vanilla Table.ts with React-based Fluent UI components
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
} from '@fluentui/react-components';
import {
  ChevronDown20Regular,
  ArrowSortUp20Regular,
  ArrowSortDown20Regular,
  GroupList20Regular,
  Filter20Regular,
  ColumnTriple20Regular,
  ArrowLeft20Regular,
  ArrowRight20Regular,
} from '@fluentui/react-icons';
import { FieldConfig } from '../Modal/Modal.types';

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
    overflow: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  dataGrid: {
    minWidth: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    '& .fui-DataGridHeader': {
      backgroundColor: 'transparent',
      borderBottom: `2px solid ${tokens.colorNeutralStroke2}`,
    },
    '& .fui-DataGridHeaderCell': {
      backgroundColor: 'transparent',
      fontWeight: 600,
      fontSize: '12px',
      color: '#323130',
      padding: '8px 12px',
      borderRight: 'none',
      textTransform: 'none',
      letterSpacing: 'normal',
      '&:hover': {
        backgroundColor: '#f3f2f1',
      },
    },
    '& .fui-DataGridCell': {
      padding: '8px 12px',
      fontSize: '14px',
      color: '#323130',
      borderRight: 'none',
    },
    '& .fui-DataGridRow': {
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
      '&:hover': {
        backgroundColor: '#f3f2f1',
      },
    },
  },
  truncatedCell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    display: 'block',
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
    gap: '4px',
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
  
  const [data, setData] = useState<TableRow[]>(
    (config.data || []).map((row, index) => ({ ...row, _index: index }))
  );
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortState, setSortState] = useState<{
    sortColumn: TableColumnId | undefined;
    sortDirection: 'ascending' | 'descending';
  }>({ sortColumn: undefined, sortDirection: 'ascending' });
  
  // Column configuration state
  const [columnOrder, setColumnOrder] = useState<string[]>(
    (config.tableColumns || []).filter(col => col.visible !== false).map(col => col.id)
  );
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});
  const [filterInputs, setFilterInputs] = useState<{ [key: string]: string }>({});

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

  // Column menu handlers
  const handleSortAscending = useCallback((columnId: string) => {
    setSortState({ sortColumn: columnId, sortDirection: 'ascending' });
  }, []);

  const handleSortDescending = useCallback((columnId: string) => {
    setSortState({ sortColumn: columnId, sortDirection: 'descending' });
  }, []);

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
    setColumnFilters(prev => ({
      ...prev,
      [columnId]: filterValue,
    }));
  }, [filterInputs]);

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

  // Handle sorting
  const handleSort = useCallback((columnId: string) => {
    setSortState(prev => {
      const newDirection = 
        prev.sortColumn === columnId && prev.sortDirection === 'ascending'
          ? 'descending'
          : 'ascending';
      
      return { sortColumn: columnId, sortDirection: newDirection };
    });
  }, []);

  // Sort data
  const sortedData = useMemo(() => {
    let filtered = data;
    
    // Apply filters
    Object.entries(columnFilters).forEach(([columnId, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(row => {
          const cellValue = row[columnId];
          return cellValue != null && String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });
    
    // Apply sorting
    if (!sortState.sortColumn) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = a[sortState.sortColumn as string];
      const bVal = b[sortState.sortColumn as string];

      let comparison = 0;
      if (aVal == null && bVal == null) comparison = 0;
      else if (aVal == null) comparison = 1;
      else if (bVal == null) comparison = -1;
      else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortState.sortDirection === 'descending' ? -comparison : comparison;
    });
  }, [data, sortState, columnFilters]);

  // Column header menu component
  const ColumnHeaderMenu: React.FC<{ columnId: string; columnLabel: string; columnIndex: number }> = ({
    columnId,
    columnLabel,
    columnIndex,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const canMoveLeft = columnIndex > 0;
    const canMoveRight = columnIndex < columnOrder.length - 1;
    const hasFilter = columnFilters[columnId];

    return (
      <div className={styles.columnHeader}>
        <span>{columnLabel}</span>
        <Menu open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)}>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="subtle"
              icon={<ChevronDown20Regular />}
              className={styles.columnHeaderButton}
              aria-label="Column options"
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem
                icon={<ArrowSortUp20Regular />}
                onClick={() => {
                  handleSortAscending(columnId);
                  setIsOpen(false);
                }}
              >
                A to Z
              </MenuItem>
              <MenuItem
                icon={<ArrowSortDown20Regular />}
                onClick={() => {
                  handleSortDescending(columnId);
                  setIsOpen(false);
                }}
              >
                Z to A
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<GroupList20Regular />}>
                Group by this column
              </MenuItem>
              <MenuDivider />
              <div style={{ padding: '8px 12px' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Filter20Regular style={{ fontSize: '20px', color: '#605e5c' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Filter by</span>
                </div>
                <Input
                  className={styles.filterInput}
                  placeholder="Enter filter value..."
                  value={filterInputs[columnId] || ''}
                  onChange={(e) => setFilterInputs(prev => ({ ...prev, [columnId]: e.target.value }))}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      handleApplyFilter(columnId);
                      setIsOpen(false);
                    }
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <Button
                    size="small"
                    appearance="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyFilter(columnId);
                      setIsOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                  {hasFilter && (
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearFilter(columnId);
                        setIsOpen(false);
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <MenuDivider />
              <MenuItem icon={<ColumnTriple20Regular />} disabled>
                Column width
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={<ArrowLeft20Regular />}
                onClick={() => {
                  handleMoveLeft(columnId);
                  setIsOpen(false);
                }}
                disabled={!canMoveLeft}
              >
                Move left
              </MenuItem>
              <MenuItem
                icon={<ArrowRight20Regular />}
                onClick={() => {
                  handleMoveRight(columnId);
                  setIsOpen(false);
                }}
                disabled={!canMoveRight}
              >
                Move right
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    );
  };

  // Define columns
  const columns: TableColumnDefinition<TableRow>[] = useMemo(() => {
    const cols: TableColumnDefinition<TableRow>[] = [];

    // Data columns
    const visibleColumns = (config.tableColumns || []).filter(col => col.visible !== false);
    
    // Debug: Log column configuration
    if (visibleColumns.length === 0) {
      console.warn('TableFluentUi: No visible columns found. tableColumns:', config.tableColumns);
    }
    
    // Sort columns by columnOrder
    const orderedColumns = columnOrder
      .map(colId => visibleColumns.find(col => col.id === colId))
      .filter(col => col != null);
    
    orderedColumns.forEach((column, index) => {
      cols.push(
        createTableColumn<TableRow>({
          columnId: column.id,
          renderHeaderCell: () => (
            <ColumnHeaderMenu
              columnId={column.id}
              columnLabel={column.header}
              columnIndex={index}
            />
          ),
          renderCell: (item: TableRow) => {
            const cellValue = item[column.id];
            
            // If the value is a string that looks like HTML, render it as HTML
            if (typeof cellValue === 'string' && (cellValue.includes('<') || cellValue.includes('&'))) {
              return (
                <TableCellLayout>
                  <span className={styles.truncatedCell} dangerouslySetInnerHTML={{ __html: cellValue }} />
                </TableCellLayout>
              );
            }
            
            // Otherwise render as text
            return (
              <TableCellLayout>
                <span className={styles.truncatedCell} title={cellValue != null ? String(cellValue) : ''}>
                  {cellValue != null ? String(cellValue) : ''}
                </span>
              </TableCellLayout>
            );
          },
          compare: column.sortable !== false ? (a: TableRow, b: TableRow) => {
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
          } : undefined,
        })
      );
    });

    return cols;
  }, [config, data.length, selectedRows, handleSelectAll, handleRowSelect, styles.radioButton, columnOrder, columnFilters, filterInputs, handleSortAscending, handleSortDescending, handleMoveLeft, handleMoveRight, handleApplyFilter, handleClearFilter]);

  // Prepare sort options for DataGrid
  const sortOptions = sortState.sortColumn
    ? { sortColumn: sortState.sortColumn, sortDirection: sortState.sortDirection }
    : undefined;

  if (data.length === 0) {
    return (
      <div className={styles.emptyState}>
        No data available
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <DataGrid
        items={sortedData}
        columns={columns as any}
        sortable
        {...(sortOptions && {
          sortState: sortOptions,
          onSortChange: (_, data) => {
            if (data.sortColumn) {
              handleSort(String(data.sortColumn));
            }
          },
        })}
        selectionMode={config.selectionMode === 'none' ? undefined : config.selectionMode === 'multiple' ? 'multiselect' : 'single'}
        selectedItems={Array.from(selectedRows)}
        onSelectionChange={(_, data) => {
          const newSelectedIndexes = new Set<number>();
          const selectedItemsArray = Array.from(data.selectedItems);
          selectedItemsArray.forEach((itemId: any) => {
            const idx = typeof itemId === 'number' ? itemId : parseInt(String(itemId));
            if (!isNaN(idx)) newSelectedIndexes.add(idx);
          });
          setSelectedRows(newSelectedIndexes);
          if (onSelectionChange) {
            const selectedData = Array.from(newSelectedIndexes).map(idx => sortedData[idx]);
            onSelectionChange(selectedData);
          }
        }}
        className={styles.dataGrid}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<TableRow>>
          {({ item, rowId }) => (
            <DataGridRow<TableRow> key={rowId}>
              {({ renderCell }) => (
                <DataGridCell>{renderCell(item)}</DataGridCell>
              )}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  );
};
