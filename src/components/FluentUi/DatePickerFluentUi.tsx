/**
 * DatePicker component using Fluent UI
 * Uses Field component for consistent layout
 */

import React from 'react';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import { Field, Tooltip } from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';
import { useSharedStyles } from './sharedStyles';

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
  const sharedStyles = useSharedStyles();

  // If no label, force vertical orientation for full width
  const effectiveOrientation = !label ? 'vertical' : orientation;

  // Create label with tooltip icon if tooltip is provided
  const labelContent = label && tooltip ? (
    <span className={sharedStyles.labelWithTooltip}>
      <span>{label}</span>
      <Tooltip content={tooltip} relationship="label">
        <Info16Regular className={sharedStyles.tooltipIcon} />
      </Tooltip>
    </span>
  ) : label;

  return (
    <Field
      label={labelContent}
      required={required}
      orientation={effectiveOrientation}
      className={sharedStyles.field}
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
