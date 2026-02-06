/**
 * Fluent UI Dropdown/Select Component Wrapper
 * Uses Field component for consistent layout
 * Supports dropdown and badge display modes
 */

import React, { useState } from 'react';
import { Dropdown, Option, Field, Button, Tooltip, mergeClasses } from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';
import type { DropdownProps } from '@fluentui/react-components';
import { useSharedStyles } from './sharedStyles';

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
    const sharedStyles = useSharedStyles();
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

    // Badge display mode
    if (displayMode === 'badges') {
        return (
            <Field
                label={labelContent}
                required={required}
                orientation={effectiveOrientation}
                className={sharedStyles.field}
            >
                <div className={sharedStyles.badgeContainer}>
                    {options.map((option, index) => {
                        const isSelected = selectedValue === option;
                        return (
                            <Button
                                key={index}
                                appearance={isSelected ? 'primary' : 'outline'}
                                disabled={disabled}
                                onClick={() => handleBadgeClick(option)}
                                className={mergeClasses(
                                    sharedStyles.badgeButton,
                                    isSelected ? sharedStyles.badgeButtonSelected : sharedStyles.badgeButtonUnselected
                                )}
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
    return (
        <Field
            label={labelContent}
            required={required}
            orientation={effectiveOrientation}
            className={sharedStyles.field}
        >
            <Dropdown
                id={id}
                value={selectedValue}
                placeholder={placeholder}
                disabled={disabled}
                appearance="filled-darker"
                onOptionSelect={handleChange}
                className={sharedStyles.fullWidth}
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
