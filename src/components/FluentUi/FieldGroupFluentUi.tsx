/**
 * Field Group component using Fluent UI
 * Groups related fields together with optional title, description, and border
 */

import React from 'react';
import {
  Text,
  Divider,
  tokens
} from '@fluentui/react-components';
import {
  ChevronDown20Regular,
  ChevronRight20Regular
} from '@fluentui/react-icons';

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
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
    ...(border && {
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: tokens.colorNeutralBackground1
    })
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    ...(collapsible && {
      cursor: 'pointer',
      userSelect: 'none'
    })
  };

  const titleRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const hasHeader = label || content;

  return (
    <div id={id} style={containerStyle} data-field-group={id}>
      {hasHeader && (
        <div style={headerStyle} onClick={handleToggle}>
          <div style={titleRowStyle}>
            {collapsible && (
              isCollapsed
                ? <ChevronRight20Regular style={{ color: tokens.colorNeutralForeground2 }} />
                : <ChevronDown20Regular style={{ color: tokens.colorNeutralForeground2 }} />
            )}
            {label && (
              <Text
                weight="semibold"
                size={400}
                style={{ color: tokens.colorNeutralForeground1 }}
              >
                {label}
              </Text>
            )}
          </div>
          {content && !isCollapsed && (
            <Text
              size={300}
              style={{
                color: tokens.colorNeutralForeground2,
                marginLeft: collapsible ? '28px' : '0'
              }}
            >
              {content}
            </Text>
          )}
        </div>
      )}

      {hasHeader && !isCollapsed && !border && (
        <Divider style={{ margin: '4px 0' }} />
      )}

      {!isCollapsed && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginLeft: collapsible && !border ? '28px' : '0'
        }}>
          {children}
        </div>
      )}
    </div>
  );
};
