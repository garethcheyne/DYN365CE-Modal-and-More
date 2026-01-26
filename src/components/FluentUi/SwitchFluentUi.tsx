/**
 * Switch component using Fluent UI
 * Uses Field component for consistent layout
 */

import React from 'react';
import { Switch, Field, Tooltip } from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';

interface SwitchFluentUiProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  tooltip?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const SwitchFluentUi: React.FC<SwitchFluentUiProps> = ({ 
  id,
  checked, 
  onChange, 
  label,
  tooltip,
  orientation = 'horizontal'
}) => {
  // If no label, force vertical orientation for full width
  const effectiveOrientation = !label ? 'vertical' : orientation;
  
  // Create label with tooltip icon if tooltip is provided
  const labelContent = label && tooltip ? (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span>{label}</span>
      <Tooltip content={tooltip} relationship="label">
        <Info16Regular style={{ color: '#605e5c', cursor: 'help' }} />
      </Tooltip>
    </span>
  ) : label;
  
  return (
    <Field
      label={labelContent}
      orientation={effectiveOrientation}
      style={{ marginBottom: '8px' }}
    >
      <Switch
        id={id}
        checked={checked}
        onChange={(_, data) => onChange(data.checked)}
      />
    </Field>
  );
};
