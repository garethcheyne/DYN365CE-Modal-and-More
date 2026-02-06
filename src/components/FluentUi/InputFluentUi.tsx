/**
 * Fluent UI Input Component Wrapper
 * Uses Field component for consistent layout
 */

import React, { useState, useEffect } from 'react';
import { Input, Textarea, Field, Tooltip } from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';
import type { InputProps, TextareaOnChangeData } from '@fluentui/react-components';
import { useSharedStyles } from './sharedStyles';

interface InputFluentUiProps {
    id?: string;
    label?: string;
    type?: 'text' | 'number' | 'email' | 'tel' | 'password' | 'url' | 'search' | 'textarea';
    value?: string | number;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    rows?: number;
    tooltip?: string;
    appearance?: 'outline' | 'underline' | 'filled-darker' | 'filled-lighter';
    orientation?: 'horizontal' | 'vertical';
    validationState?: 'error' | 'warning' | 'success' | 'none';
    validationMessage?: string;
    onChange?: (value: string | number) => void;
    onBlur?: () => void;
    onFocus?: () => void;
}

export const InputFluentUi: React.FC<InputFluentUiProps> = ({
    id,
    label,
    type = 'text',
    value: externalValue = '',
    placeholder = '',
    required = false,
    disabled = false,
    readOnly = false,
    rows = 3,
    tooltip,
    appearance = 'filled-darker',
    orientation = 'horizontal',
    validationState,
    validationMessage,
    onChange,
    onBlur,
    onFocus,
}) => {
    const sharedStyles = useSharedStyles();
    const [value, setValue] = useState<string | number>(externalValue);

    // Sync with external value changes (for setFieldValue support)
    useEffect(() => {
        setValue(externalValue);
    }, [externalValue]);

    const handleInputChange: InputProps['onChange'] = (_, data) => {
        const newValue = type === 'number' && data.value !== '' ? Number(data.value) : data.value;
        setValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    const handleTextareaChange = (_: React.ChangeEvent<HTMLTextAreaElement>, data: TextareaOnChangeData) => {
        const newValue = data.value;
        setValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    const fieldContent = type === 'textarea' ? (
        <Textarea
            id={id}
            value={String(value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            appearance={appearance === 'underline' ? 'outline' : appearance}
            onChange={handleTextareaChange}
            onBlur={onBlur}
            onFocus={onFocus}
            rows={rows}
            resize="vertical"
        />
    ) : (
        <Input
            id={id}
            value={String(value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            appearance={appearance}
            onChange={handleInputChange}
            onBlur={onBlur}
            onFocus={onFocus}
            type={type === 'text' ? undefined : type}
        />
    );

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
            validationState={validationState}
            validationMessage={validationMessage}
            className={sharedStyles.field}
        >
            {fieldContent}
        </Field>
    );
};
