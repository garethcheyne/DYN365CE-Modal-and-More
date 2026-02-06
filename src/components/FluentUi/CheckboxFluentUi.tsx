/**
 * Checkbox component using Fluent UI
 * Uses Field component for consistent layout
 */

import React from 'react';
import { Checkbox, Field, Tooltip } from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';
import { useSharedStyles } from './sharedStyles';

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
      orientation={effectiveOrientation}
      className={sharedStyles.field}
    >
      <Checkbox
        id={id}
        checked={checked}
        onChange={(_, data) => onChange(data.checked === true)}
      />
    </Field>
  );
};
