/**
 * Fluent UI Dropdown/Select Component Wrapper
 * Uses Field component for consistent layout
 */

import React, { useState } from 'react';
import { Dropdown, Option, Field } from '@fluentui/react-components';
import type { DropdownProps } from '@fluentui/react-components';

interface DropdownFluentUiProps {
    id?: string;
    label?: string;
    value?: string;
    options: string[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    tooltip?: string;
    appearance?: 'outline' | 'underline' | 'filled-darker' | 'filled-lighter';
    orientation?: 'horizontal' | 'vertical';
    onChange?: (value: string) => void;
}

export const DropdownFluentUi: React.FC<DropdownFluentUiProps> = ({
    id,
    label,
    value: initialValue = '',
    options = [],
    placeholder = 'Select an option',
    required = false,
    disabled = false,
    tooltip,
    appearance = 'filled-darker',
    orientation = 'horizontal',
    onChange,
}) => {
    const [selectedValue, setSelectedValue] = useState<string>(initialValue);

    const handleChange: DropdownProps['onOptionSelect'] = (_, data) => {
        const newValue = data.optionText || '';
        setSelectedValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <Field
            label={label}
            required={required}
            hint={tooltip}
            orientation={orientation}
            style={{ marginBottom: '8px' }}
        >
            <Dropdown
                id={id}
                value={selectedValue}
                placeholder={placeholder}
                disabled={disabled}
                appearance="filled-darker"
                onOptionSelect={handleChange}
                style={{ width: '100%' }}
            >
                {options.map((option, index) => (
                    <Option key={index} value={option}>
                        {option}
                    </Option>
                ))}
            </Dropdown>
        </Field>
    );
};
