/**
 * DatePicker component using Fluent UI
 * Uses @fluentui/react-datepicker-compat for Fluent UI v9 date picking
 */

import React from 'react';
import { DatePicker } from '@fluentui/react-datepicker-compat';

interface DatePickerFluentUiProps {
  id?: string;
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  label?: string;
  tooltip?: string;
  required?: boolean;
  disabled?: boolean;
}

export const DatePickerFluentUi: React.FC<DatePickerFluentUiProps> = ({ 
  id,
  value, 
  onChange, 
  placeholder,
  label,
  tooltip,
  required,
  disabled
}) => {
  const datePickerContent = (
    <DatePicker
      id={id}
      value={value || null}
      onSelectDate={(date: Date | null | undefined) => onChange(date ?? null)}
      placeholder={placeholder || 'Select a date...'}
      aria-label={label || 'Date picker'}
      disabled={disabled}
    />
  );

  // If no label, render DatePicker directly without grid wrapper
  if (!label) {
    return (
      <div style={{ marginBottom: '16px' }}>
        {datePickerContent}
      </div>
    );
  }

  // With label, use grid layout for alignment
  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: '150px 1fr',
      alignItems: 'center',
      width: '100%',
      marginBottom: '16px'
    }}>
      <label 
        htmlFor={id}
        title={tooltip}
        style={{ 
          paddingInlineEnd: '12px',
          fontWeight: 600,
          fontSize: '14px',
          cursor: tooltip ? 'help' : 'default'
        }}
      >
        {label}
        {required && <span style={{ color: '#d13438' }}>*</span>}
      </label>
      {datePickerContent}
    </div>
  );
};
