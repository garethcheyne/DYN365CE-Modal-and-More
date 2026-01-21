/**
 * Table field component using Fluent UI DataGrid
 * Replaces vanilla Table.ts with React-based Fluent UI components
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  DataGrid,
  DataGridBody,
  DataGridRow,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  TableCellLayout,
  TableColumnDefinition,
  createTableColumn,
  TableColumnId,
  makeStyles,
  tokens,
  Switch,
  Checkbox,
} from '@fluentui/react-components';
import { FieldConfig } from '../Modal/Modal.types';

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
      backgroundColor: '#f3f2f1',
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    },
    '& .fui-DataGridHeaderCell': {
      backgroundColor: '#f3f2f1',
      fontWeight: 600,
      fontSize: '12px',
      color: '#323130',
      padding: '8px 12px',
      borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
      textTransform: 'none',
      letterSpacing: 'normal',
      '&:last-child': {
        borderRight: 'none',
      },
      '&:hover': {
        backgroundColor: '#edebe9',
      },
    },
    '& .fui-DataGridCell': {
      padding: '8px 12px',
      fontSize: '14px',
      color: '#323130',
      borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
      '&:last-child': {
        borderRight: 'none',
      },
    },
    '& .fui-DataGridRow': {
      borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
      '&:hover': {
        backgroundColor: '#f3f2f1',
      },
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
});

export const TableFluentUi: React.FC<TableFluentUiProps> = ({ config, onSelectionChange }) => {
  const styles = useStyles();
  
  const [data] = useState<TableRow[]>(
    (config.data || []).map((row, index) => ({ ...row, _index: index }))
  );
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortState, setSortState] = useState<{
    sortColumn: TableColumnId | undefined;
    sortDirection: 'ascending' | 'descending';
  }>({ sortColumn: undefined, sortDirection: 'ascending' });

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
  const handleSort = useCallback((columnId: TableColumnId) => {
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
    if (!sortState.sortColumn) return data;

    return [...data].sort((a, b) => {
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
  }, [data, sortState]);

  // Define columns
  const columns: TableColumnDefinition<TableRow>[] = useMemo(() => {
    const cols: TableColumnDefinition<TableRow>[] = [];

    // Selection column
    if (config.selectionMode !== 'none') {
      cols.push(
        createTableColumn<TableRow>({
          columnId: '_selection',
          renderHeaderCell: () => {
            if (config.selectionMode === 'multiple') {
              const allSelected = data.length > 0 && selectedRows.size === data.length;
              return (
                <Switch
                  checked={allSelected}
                  onChange={(_, data) => handleSelectAll(data.checked)}
                />
              );
            }
            return null;
          },
          renderCell: (item) => {
            const isSelected = selectedRows.has(item._index);
            if (config.selectionMode === 'single') {
              return (
                <Checkbox
                  // type="radio"
                  name={`${config.id}-selection`}
                  checked={isSelected}
                  onChange={(e) => handleRowSelect(item._index, e.target.checked)}
                  className={styles.radioButton}
                />
              );
            } else {
              return (
                <Switch
                  checked={isSelected}
                  onChange={(_, data) => handleRowSelect(item._index, data.checked)}
                />
              );
            }
          },
          compare: () => 0,
        })
      );
    }

    // Data columns
    const visibleColumns = (config.columns || []).filter(col => col.visible !== false);
    visibleColumns.forEach(column => {
      cols.push(
        createTableColumn<TableRow>({
          columnId: column.id,
          renderHeaderCell: () => column.header,
          renderCell: (item) => (
            <TableCellLayout>
              {item[column.id] != null ? String(item[column.id]) : ''}
            </TableCellLayout>
          ),
          compare: column.sortable ? (a, b) => {
            const aVal = a[column.id];
            const bVal = b[column.id];
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              return aVal - bVal;
            }
            return String(aVal).localeCompare(String(bVal));
          } : undefined,
        })
      );
    });

    return cols;
  }, [config, data.length, selectedRows, handleSelectAll, handleRowSelect, styles.radioButton]);

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
        columns={columns}
        sortable
        {...(sortOptions && {
          sortState: sortOptions,
          onSortChange: (_, data) => {
            if (data.sortColumn) {
              handleSort(data.sortColumn);
            }
          },
        })}
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
