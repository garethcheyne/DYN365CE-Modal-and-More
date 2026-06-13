/**
 * Fluent UI File Upload Component with Drag & Drop
 * D365-styled file upload with hot zone drag-drop functionality
 */

import React, { useState, useRef } from 'react';
import { Button, Field, Text, mergeClasses, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { ArrowUpload24Regular, Dismiss24Regular, Document24Regular } from '@fluentui/react-icons';

interface FileUploadFluentUiProps {
    id?: string;
    label?: string;
    accept?: string;
    maxFiles?: number;
    maxSize?: number;
    multiple?: boolean;
    showFileList?: boolean;
    required?: boolean;
    disabled?: boolean;
    tooltip?: string;
    orientation?: 'horizontal' | 'vertical';
    dragDropText?: string;
    browseText?: string;
    value?: File[];
    onChange?: (files: File[]) => void;
    onFilesSelected?: (files: File[]) => void;
}

const useStyles = makeStyles({
    dropZone: {
        ...shorthands.border(tokens.strokeWidthThick, 'dashed', tokens.colorNeutralStroke1),
        ...shorthands.borderRadius(tokens.borderRadiusMedium),
        ...shorthands.padding('32px', tokens.spacingHorizontalXXL),
        backgroundColor: tokens.colorNeutralBackground2,
        textAlign: 'center',
        cursor: 'pointer',
        ...shorthands.transition('all', '0.2s', 'ease'),
        position: 'relative',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ':hover': {
            ...shorthands.borderColor(tokens.colorBrandStroke1),
            backgroundColor: tokens.colorNeutralBackground3,
        },
    },
    dropZoneActive: {
        ...shorthands.borderColor(tokens.colorBrandStroke1),
        backgroundColor: tokens.colorBrandBackground2,
        ...shorthands.borderWidth(tokens.strokeWidthThicker),
    },
    dropZoneDisabled: {
        cursor: 'not-allowed',
        opacity: 0.6,
        ':hover': {
            ...shorthands.borderColor(tokens.colorNeutralStroke1),
            backgroundColor: tokens.colorNeutralBackground2,
        },
    },
    icon: {
        fontSize: '48px',
        color: tokens.colorBrandForeground1,
        marginBottom: tokens.spacingVerticalM,
    },
    dropText: {
        fontSize: tokens.fontSizeBase400,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground1,
        marginBottom: tokens.spacingVerticalXS,
    },
    browseText: {
        fontSize: tokens.fontSizeBase300,
        color: tokens.colorNeutralForeground2,
        marginBottom: tokens.spacingVerticalL,
    },
    browseButton: {
        marginTop: tokens.spacingVerticalS,
    },
    fileList: {
        marginTop: tokens.spacingVerticalL,
        ...shorthands.padding('0'),
        listStyle: 'none',
    },
    fileItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
        ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke2),
        ...shorthands.borderRadius(tokens.borderRadiusSmall),
        backgroundColor: tokens.colorNeutralBackground1,
        marginBottom: tokens.spacingVerticalS,
        ...shorthands.transition('all', '0.15s', 'ease'),
        '&:hover': {
            backgroundColor: tokens.colorNeutralBackground3,
        },
    },
    fileInfo: {
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
    },
    fileIcon: {
        fontSize: tokens.fontSizeBase500,
        color: tokens.colorBrandForeground1,
        marginRight: tokens.spacingHorizontalS,
        flexShrink: 0,
    },
    fileName: {
        fontSize: tokens.fontSizeBase300,
        fontWeight: tokens.fontWeightMedium,
        color: tokens.colorNeutralForeground1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        marginRight: tokens.spacingHorizontalS,
    },
    fileSize: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
        flexShrink: 0,
    },
    removeButton: {
        minWidth: 'auto',
        marginLeft: tokens.spacingHorizontalS,
    },
    errorText: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteRedForeground1,
        marginTop: tokens.spacingVerticalXS,
    },
    hiddenInput: {
        display: 'none',
    },
    field: {
        marginBottom: tokens.spacingVerticalS,
    },
});

export const FileUploadFluentUi: React.FC<FileUploadFluentUiProps> = ({
    label,
    accept = '*',
    maxFiles,
    maxSize,
    multiple = true,
    showFileList = true,
    required = false,
    disabled = false,
    tooltip,
    orientation = 'horizontal',
    dragDropText = 'Drag and drop files here',
    browseText = 'or browse to choose files',
    value: initialValue = [],
    onChange,
    onFilesSelected,
}) => {
    const styles = useStyles();
    const [files, setFiles] = useState<File[]>(initialValue);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounterRef = useRef(0);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const validateFiles = (filesToValidate: File[]): { valid: File[], errors: string[] } => {
        const errors: string[] = [];
        const valid: File[] = [];

        for (const file of filesToValidate) {
            // Check file size
            if (maxSize && file.size > maxSize) {
                errors.push(`${file.name}: exceeds maximum size of ${formatFileSize(maxSize)}`);
                continue;
            }

            // Check file type if accept is specified and not wildcard
            if (accept && accept !== '*') {
                const acceptedTypes = accept.split(',').map(t => t.trim());
                const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
                const mimeType = file.type;
                
                const isAccepted = acceptedTypes.some(type => {
                    if (type.startsWith('.')) {
                        return fileExtension === type.toLowerCase();
                    } else if (type.endsWith('/*')) {
                        const category = type.split('/')[0];
                        return mimeType.startsWith(category + '/');
                    } else {
                        return mimeType === type;
                    }
                });

                if (!isAccepted) {
                    errors.push(`${file.name}: file type not accepted`);
                    continue;
                }
            }

            valid.push(file);
        }

        // Check max files count
        if (maxFiles && (files.length + valid.length) > maxFiles) {
            const allowedCount = maxFiles - files.length;
            errors.push(`Maximum ${maxFiles} file(s) allowed. Only ${allowedCount} more can be added.`);
            valid.splice(allowedCount);
        }

        return { valid, errors };
    };

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles || newFiles.length === 0) return;

        const fileArray = Array.from(newFiles);
        const { valid, errors } = validateFiles(fileArray);

        if (errors.length > 0) {
            setError(errors.join('; '));
            setTimeout(() => setError(''), 5000);
        } else {
            setError('');
        }

        if (valid.length > 0) {
            const updatedFiles = multiple ? [...files, ...valid] : valid;
            setFiles(updatedFiles);
            onChange?.(updatedFiles);
            onFilesSelected?.(updatedFiles);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        dragCounterRef.current++;
        
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        dragCounterRef.current--;
        
        if (dragCounterRef.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsDragging(false);
        dragCounterRef.current = 0;

        if (disabled) return;

        const droppedFiles = e.dataTransfer.files;
        handleFiles(droppedFiles);
    };

    const handleClick = () => {
        if (!disabled) {
            fileInputRef.current?.click();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        // Reset input value to allow selecting the same file again
        e.target.value = '';
    };

    const handleRemoveFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        onChange?.(updatedFiles);
        onFilesSelected?.(updatedFiles);
    };

    const dropZoneClasses = mergeClasses(
        styles.dropZone,
        isDragging && styles.dropZoneActive,
        disabled && styles.dropZoneDisabled
    );

    return (
        <Field
            label={label}
            required={required}
            hint={tooltip}
            orientation={orientation}
            className={styles.field}
        >
            <div>
                <div
                    className={dropZoneClasses}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={handleClick}
                >
                    <ArrowUpload24Regular className={styles.icon} />
                    <div className={styles.dropText}>
                        {isDragging ? 'Drop files here' : dragDropText}
                    </div>
                    <div className={styles.browseText}>{browseText}</div>
                    <Button
                        appearance="primary"
                        className={styles.browseButton}
                        disabled={disabled}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClick();
                        }}
                    >
                        Browse Files
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className={styles.hiddenInput}
                        accept={accept}
                        multiple={multiple}
                        disabled={disabled}
                        onChange={handleInputChange}
                        aria-label={label || 'File upload'}
                    />
                </div>

                {error && (
                    <Text className={styles.errorText}>{error}</Text>
                )}

                {showFileList && files.length > 0 && (
                    <ul className={styles.fileList}>
                        {files.map((file, index) => (
                            <li key={`${file.name}-${index}`} className={styles.fileItem}>
                                <div className={styles.fileInfo}>
                                    <Document24Regular className={styles.fileIcon} />
                                    <span className={styles.fileName} title={file.name}>
                                        {file.name}
                                    </span>
                                    <span className={styles.fileSize}>
                                        ({formatFileSize(file.size)})
                                    </span>
                                </div>
                                <Button
                                    appearance="subtle"
                                    icon={<Dismiss24Regular />}
                                    className={styles.removeButton}
                                    onClick={() => handleRemoveFile(index)}
                                    disabled={disabled}
                                    title="Remove file"
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Field>
    );
};
