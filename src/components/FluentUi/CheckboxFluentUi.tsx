/**
 * Checkbox component using Fluent UI
 * Uses @fluentui/react-components Checkbox
 */

import React from 'react';
import { Checkbox } from '@fluentui/react-components';

interface CheckboxFluentUiProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const CheckboxFluentUi: React.FC<CheckboxFluentUiProps> = ({ 
  checked, 
  onChange, 
  label 
}) => {
  return (
    <Checkbox
      checked={checked}
      onChange={(_, data) => onChange(data.checked === true)}
      label={label}
    />
  );
};
