/**
 * Field Group component using Fluent UI
 * Groups related fields together with optional title, description, and border
 */

import React from 'react';
import {
  Text,
  Divider,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';
import {
  ChevronDown20Regular,
  ChevronRight20Regular
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
  },
  containerBordered: {
    borderTopWidth: tokens.strokeWidthThin,
    borderRightWidth: tokens.strokeWidthThin,
    borderBottomWidth: tokens.strokeWidthThin,
    borderLeftWidth: tokens.strokeWidthThin,
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRadius: tokens.borderRadiusMedium,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  headerCollapsible: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  chevronIcon: {
    color: tokens.colorNeutralForeground2,
  },
  labelText: {
    color: tokens.colorNeutralForeground1,
  },
  contentText: {
    color: tokens.colorNeutralForeground2,
  },
  contentIndented: {
    marginLeft: tokens.spacingHorizontalXXL,
  },
  divider: {
    marginTop: tokens.spacingVerticalXS,
    marginBottom: tokens.spacingVerticalXS,
  },
  childrenContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  childrenIndented: {
    marginLeft: tokens.spacingHorizontalXXL,
  },
});

interface FieldGroupFluentUiProps {
  id?: string;
  label?: string;
  content?: string;
  border?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

export const FieldGroupFluentUi: React.FC<FieldGroupFluentUiProps> = ({
  id,
  label,
  content,
  border = false,
  collapsible = false,
  defaultCollapsed = false,
  children
}) => {
  const styles = useStyles();
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const hasHeader = label || content;

  return (
    <div
      id={id}
      className={mergeClasses(styles.container, border && styles.containerBordered)}
      data-field-group={id}
    >
      {hasHeader && (
        <div
          className={mergeClasses(styles.header, collapsible && styles.headerCollapsible)}
          onClick={handleToggle}
        >
          <div className={styles.titleRow}>
            {collapsible && (
              isCollapsed
                ? <ChevronRight20Regular className={styles.chevronIcon} />
                : <ChevronDown20Regular className={styles.chevronIcon} />
            )}
            {label && (
              <Text weight="semibold" size={400} className={styles.labelText}>
                {label}
              </Text>
            )}
          </div>
          {content && !isCollapsed && (
            <Text
              size={300}
              className={mergeClasses(styles.contentText, collapsible && styles.contentIndented)}
            >
              {content}
            </Text>
          )}
        </div>
      )}

      {hasHeader && !isCollapsed && !border && (
        <Divider className={styles.divider} />
      )}

      {!isCollapsed && (
        <div className={mergeClasses(
          styles.childrenContainer,
          collapsible && !border && styles.childrenIndented
        )}>
          {children}
        </div>
      )}
    </div>
  );
};
