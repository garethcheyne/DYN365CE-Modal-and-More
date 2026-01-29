/**
 * TableSkeleton Component
 * Shows a loading skeleton that represents a table structure
 */

import React from 'react';
import { Skeleton, SkeletonItem, makeStyles, tokens } from '@fluentui/react-components';

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  columnWidths?: string[];
}

const useStyles = makeStyles({
  container: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '8px',
    borderRadius: '4px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  headerRow: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  headerCell: {
    padding: '12px',
    height: '42px',
  },
  bodyRow: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  bodyCell: {
    padding: '12px',
    height: '42px',
  },
  skeletonHeader: {
    height: '14px',
    width: '80%',
  },
  skeletonCell: {
    height: '12px',
  },
});

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns = 3,
  rows = 5,
  columnWidths,
}) => {
  const styles = useStyles();

  // Generate varying widths for cells to look more natural
  const getCellWidth = (colIndex: number, isHeader: boolean): string => {
    if (columnWidths && columnWidths[colIndex]) {
      return columnWidths[colIndex];
    }
    // Vary widths for visual interest
    const widths = isHeader
      ? ['70%', '80%', '60%', '75%', '65%']
      : ['90%', '70%', '85%', '60%', '75%', '80%', '65%'];
    return widths[colIndex % widths.length];
  };

  return (
    <Skeleton aria-label="Loading table...">
      <div className={styles.container}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <th
                  key={`header-${colIndex}`}
                  className={styles.headerCell}
                  style={{ width: columnWidths?.[colIndex] }}
                >
                  <SkeletonItem
                    shape="rectangle"
                    style={{ width: getCellWidth(colIndex, true), height: '14px' }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={`row-${rowIndex}`} className={styles.bodyRow}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={`cell-${rowIndex}-${colIndex}`} className={styles.bodyCell}>
                    <SkeletonItem
                      shape="rectangle"
                      style={{ width: getCellWidth(colIndex + rowIndex, false), height: '12px' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Skeleton>
  );
};
