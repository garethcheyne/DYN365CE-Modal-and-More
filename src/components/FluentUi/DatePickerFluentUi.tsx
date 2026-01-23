/**
 * DatePicker component using Fluent UI
 * Uses Field component for consistent layout
 */

import React from 'react';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import { Field } from '@fluentui/react-components';

interface DatePickerFluentUiProps {
  id?: string;
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  label?: string;
  tooltip?: string;
  required?: boolean;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export const DatePickerFluentUi: React.FC<DatePickerFluentUiProps> = ({ 
  id,
  value, 
  onChange, 
  placeholder,
  label,
  tooltip,
  required,
  disabled,
  orientation = 'horizontal'
}) => {
  return (
    <Field
      label={label}
      required={required}
      hint={tooltip}
      orientation={orientation}
      style={{ marginBottom: '8px' }}
    >
      <DatePicker
        id={id}
        value={value || null}
        onSelectDate={(date: Date | null | undefined) => onChange(date ?? null)}
        placeholder={placeholder || 'Select a date...'}
        aria-label={label || 'Date picker'}
        disabled={disabled}
        appearance="filled-darker"
      />
    </Field>
  );
};
