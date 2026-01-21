/**
 * Fluent UI Dropdown/Select Component Wrapper
 * Provides native Dynamics 365 styling for option sets
 */

import React, { useState } from 'react';
import { Dropdown, Option } from '@fluentui/react-components';
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
    appearance = 'underline', // Default to underline for Dynamics look
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

    // If no label, render dropdown directly without grid wrapper
    if (!label) {
        return (
            <div style={{ marginBottom: '16px' }}>
                <Dropdown
                    id={id}
                    value={selectedValue}
                    placeholder={placeholder}
                    disabled={disabled}
                    appearance={appearance}
                    onOptionSelect={handleChange}
                    style={{ width: '100%' }}
                >
                    {options.map((option, index) => (
                        <Option key={index} value={option}>
                            {option}
                        </Option>
                    ))}
                </Dropdown>
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
            <Dropdown
                id={id}
                value={selectedValue}
                placeholder={placeholder}
                disabled={disabled}
                appearance={appearance}
                onOptionSelect={handleChange}
                style={{ width: '100%' }}
            >
                {options.map((option, index) => (
                    <Option key={index} value={option}>
                        {option}
                    </Option>
                ))}
            </Dropdown>
        </div>
    );
};
