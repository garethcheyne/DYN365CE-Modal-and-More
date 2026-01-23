/**
 * Switch component using Fluent UI
 * Uses Field component for consistent layout
 */

import React from 'react';
import { Switch, Field } from '@fluentui/react-components';

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
  return (
    <Field
      label={label}
      hint={tooltip}
      orientation={orientation}
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
