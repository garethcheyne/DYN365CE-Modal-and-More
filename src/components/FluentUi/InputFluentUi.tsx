/**
 * Fluent UI Input Component Wrapper
 * Uses Field component for consistent layout
 */

import React, { useState, useEffect } from 'react';
import { Input, Textarea, Field } from '@fluentui/react-components';
import type { InputProps, TextareaOnChangeData } from '@fluentui/react-components';

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
    onChange,
    onBlur,
    onFocus,
}) => {
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

    return (
        <Field
            label={label}
            required={required}
            hint={tooltip}
            orientation={effectiveOrientation}
            style={{ marginBottom: '8px' }}
        >
            {fieldContent}
        </Field>
    );
};
