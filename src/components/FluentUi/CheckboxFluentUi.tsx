/**
 * Checkbox component using Fluent UI
 * Uses Field component for consistent layout
 */

import React from 'react';
import { Checkbox, Field } from '@fluentui/react-components';

interface CheckboxFluentUiProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  tooltip?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const CheckboxFluentUi: React.FC<CheckboxFluentUiProps> = ({ 
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
      <Checkbox
        id={id}
        checked={checked}
        onChange={(_, data) => onChange(data.checked === true)}
      />
    </Field>
  );
};
