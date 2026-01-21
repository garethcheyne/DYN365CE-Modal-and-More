/**
 * Fluent UI Input Component Wrapper
 * Provides native Dynamics 365 styling with underline appearance
 */

import React, { useState } from 'react';
import { Input, Textarea } from '@fluentui/react-components';
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
    onChange?: (value: string | number) => void;
    onBlur?: () => void;
    onFocus?: () => void;
}

export const InputFluentUi: React.FC<InputFluentUiProps> = ({
    id,
    label,
    type = 'text',
    value: initialValue = '',
    placeholder = '',
    required = false,
    disabled = false,
    readOnly = false,
    rows = 3,
    tooltip,
    appearance = 'underline', // Default to underline for Dynamics look
    onChange,
    onBlur,
    onFocus,
}) => {
    const [value, setValue] = useState<string | number>(initialValue);

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

    const commonInputProps = {
        id,
        value: String(value),
        placeholder,
        required,
        disabled,
        readOnly,
        appearance,
        onChange: handleInputChange,
        onBlur,
        onFocus,
    };

    const commonTextareaProps = {
        id,
        value: String(value),
        placeholder,
        required,
        disabled,
        readOnly,
        appearance: (appearance === 'underline' ? 'outline' : appearance) as 'outline' | 'filled-darker' | 'filled-lighter',
        onChange: handleTextareaChange,
        onBlur,
        onFocus,
    };

    const fieldContent = type === 'textarea' ? (
        <Textarea
            {...commonTextareaProps}
            rows={rows}
            resize="vertical"
        />
    ) : (
        <Input
            {...commonInputProps}
            type={type === 'text' ? undefined : type}
        />
    );

    // If no label, render input directly without grid wrapper
    if (!label) {
        return (
            <div style={{ marginBottom: '16px' }}>
                {fieldContent}
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
            {fieldContent}
        </div>
    );
};
