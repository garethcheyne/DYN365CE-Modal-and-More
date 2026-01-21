/**
 * Switch component using Fluent UI
 * Replaces vanilla Switch.ts with React-based Fluent UI Switch
 */

import React from 'react';
import { Switch } from './index';

interface SwitchFluentUiProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  tooltip?: string;
}

export const SwitchFluentUi: React.FC<SwitchFluentUiProps> = ({ 
  id,
  checked, 
  onChange, 
  label,
  tooltip 
}) => {
  const switchContent = (
    <Switch
      id={id}
      checked={checked}
      onChange={(_, data) => onChange(data.checked)}
      label={label}
    />
  );

  // Switch component already has its label built-in
  // If tooltip is provided, wrap with grid layout
  if (!tooltip) {
    return (
      <div style={{ marginBottom: '16px' }}>
        {switchContent}
      </div>
    );
  }

  // With tooltip, add a label with tooltip support before the switch
  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: '150px 1fr',
      alignItems: 'center',
      width: '100%',
      marginBottom: '16px'
    }}>
      <label 
        title={tooltip}
        style={{ 
          paddingInlineEnd: '12px',
          fontWeight: 600,
          fontSize: '14px',
          cursor: 'help'
        }}
      >
        {label || ''}
      </label>
      <Switch
        id={id}
        checked={checked}
        onChange={(_, data) => onChange(data.checked)}
      />
    </div>
  );
};
