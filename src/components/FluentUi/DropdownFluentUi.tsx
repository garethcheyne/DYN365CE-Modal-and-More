/**
 * Fluent UI Dropdown/Select Component Wrapper
 * Uses Field component for consistent layout
 * Supports dropdown and badge display modes
 */

import React, { useState } from 'react';
import { Dropdown, Option, Field, Button, Tooltip } from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';
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
    orientation?: 'horizontal' | 'vertical';
    displayMode?: 'dropdown' | 'badges';  // New: display as dropdown or badge buttons
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
    orientation = 'horizontal',
    displayMode = 'dropdown',
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

    const handleBadgeClick = (option: string) => {
        if (disabled) return;
        setSelectedValue(option);
        if (onChange) {
            onChange(option);
        }
    };

    // Badge display mode
    if (displayMode === 'badges') {
        // If no label, force vertical orientation for full width
        const effectiveOrientation = !label ? 'vertical' : orientation;
        
        // Create label with tooltip icon if tooltip is provided
        const labelContent = label && tooltip ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>{label}</span>
                <Tooltip content={tooltip} relationship="label">
                    <Info16Regular style={{ color: '#605e5c', cursor: 'help' }} />
                </Tooltip>
            </span>
        ) : label;
        
        return (
            <Field
                label={labelContent}
                required={required}
                orientation={effectiveOrientation}
                style={{ marginBottom: '8px' }}
            >
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center'
                }}>
                    {options.map((option, index) => {
                        const isSelected = selectedValue === option;
                        return (
                            <Button
                                key={index}
                                appearance={isSelected ? 'primary' : 'outline'}
                                disabled={disabled}
                                onClick={() => handleBadgeClick(option)}
                                style={{
                                    borderRadius: '16px',
                                    minWidth: 'auto',
                                    paddingLeft: '16px',
                                    paddingRight: '16px',
                                    fontSize: '14px',
                                    fontWeight: isSelected ? 600 : 400,
                                }}
                            >
                                {option}
                            </Button>
                        );
                    })}
                </div>
            </Field>
        );
    }

    // Default dropdown display mode
    // If no label, force vertical orientation for full width
    const effectiveOrientation = !label ? 'vertical' : orientation;
    
    // Create label with tooltip icon if tooltip is provided
    const labelContent = label && tooltip ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>{label}</span>
            <Tooltip content={tooltip} relationship="label">
                <Info16Regular style={{ color: '#605e5c', cursor: 'help' }} />
            </Tooltip>
        </span>
    ) : label;
    
    return (
        <Field
            label={labelContent}
            required={required}
            orientation={effectiveOrientation}
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
