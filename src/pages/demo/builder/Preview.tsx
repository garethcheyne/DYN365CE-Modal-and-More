/**
 * Preview - Live preview and code output panel
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Tab,
  TabList,
  makeStyles,
  tokens,
  Text,
} from '@fluentui/react-components';
import { ModalConfig } from './types';
import { generateModalCode, copyToClipboard, downloadAsFile } from './CodeGenerator';
import { ToolbarIcons } from './icons';
import { Play24Regular, ArrowDownload24Regular, Image24Regular, Code24Regular } from '@fluentui/react-icons';
import * as uiLib from '../../../index';

const useStyles = makeStyles({
  preview: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: tokens.spacingHorizontalM,
  },
  mockModal: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow16,
    maxWidth: '500px',
    margin: '0 auto',
  },
  mockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  mockTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
  },
  mockClose: {
    cursor: 'pointer',
    color: tokens.colorNeutralForeground3,
    fontSize: '20px',
    lineHeight: 1,
  },
  mockMessage: {
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
  mockFields: {
    padding: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  mockEmpty: {
    padding: tokens.spacingVerticalXL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  mockField: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
  },
  mockFieldLabel: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  required: {
    color: tokens.colorPaletteRedForeground1,
    marginLeft: '2px',
  },
  mockFieldType: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
  },
  mockButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  wizardSteps: {
    display: 'flex',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  wizardStep: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  wizardStepNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  wizardStepLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
  },
  codeBlock: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingHorizontalM,
    overflow: 'auto',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: tokens.fontSizeBase200,
    lineHeight: 1.5,
  },
});

interface PreviewProps {
  config: ModalConfig;
}

export const Preview: React.FC<PreviewProps> = ({ config }) => {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copySuccess, setCopySuccess] = useState(false);
  const [code, setCode] = useState('');

  // Generate code when config changes
  useEffect(() => {
    const generatedCode = generateModalCode(config);
    setCode(generatedCode);
  }, [config]);

  // Show live preview modal
  const showPreview = useCallback(() => {
    try {
      // Build the modal config from builder config
      const modalConfig: any = {
        title: config.title,
        message: config.message,
        content: config.content,
        draggable: config.draggable,
        allowDismiss: config.allowDismiss,
        allowEscapeClose: config.allowEscapeClose,
        buttonAlignment: config.buttonAlignment,
      };

      // Handle size
      if (config.size === 'custom' && config.customWidth && config.customHeight) {
        modalConfig.size = { width: config.customWidth, height: config.customHeight };
      } else {
        modalConfig.size = config.size;
      }

      // Handle wizard mode
      if (config.isWizard && config.steps && config.steps.length > 0) {
        modalConfig.progress = {
          enabled: true,
          currentStep: 1,
          steps: config.steps.map(step => ({
            id: step.id,
            label: step.label,
            message: step.message,
            content: step.content,
            fields: step.fields.map(convertField),
          })),
        };
      } else {
        // Regular fields
        modalConfig.fields = config.fields.map(convertField);
      }

      // Handle buttons
      modalConfig.buttons = config.buttons.map(btn => 
        new uiLib.Button({
          label: btn.label,
          callback: () => {
            uiLib.Toast.success({ title: 'Button Clicked', message: `You clicked: ${btn.label}` });
            // Return void to close modal (or return false to keep open)
          },
          setFocus: btn.setFocus,
          isDestructive: btn.isDestructive,
          preventClose: btn.preventClose,
          requiresValidation: btn.requiresValidation,
          id: btn.id,
        })
      );

      const modal = new uiLib.Modal(modalConfig);
      modal.show();
    } catch (error) {
      uiLib.Toast.error({ title: 'Preview Error', message: String(error) });
    }
  }, [config]);

  // Convert builder field config to actual field config
  const convertField = (field: any): any => {
    const converted: any = {
      id: field.id,
      label: field.label,
      type: field.type,
    };

    if (field.placeholder) converted.placeholder = field.placeholder;
    if (field.required) converted.required = field.required;
    if (field.disabled) converted.disabled = field.disabled;
    if (field.tooltip) converted.tooltip = field.tooltip;
    if (field.rows) converted.rows = field.rows;
    if (field.options) converted.options = field.options;
    if (field.entityName) converted.entityName = field.entityName;
    if (field.lookupColumns) converted.lookupColumns = field.lookupColumns;
    if (field.html) converted.html = field.html;
    if (field.border) converted.border = field.border;
    if (field.collapsible) converted.collapsible = field.collapsible;
    if (field.defaultCollapsed) converted.defaultCollapsed = field.defaultCollapsed;
    if (field.visibleWhen) converted.visibleWhen = field.visibleWhen;
    if (field.requiredWhen) converted.requiredWhen = field.requiredWhen;
    if (field.fields) converted.fields = field.fields.map(convertField);

    return converted;
  };

  // Copy code to clipboard
  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Download code
  const handleDownload = () => {
    downloadAsFile(code, `${config.title.toLowerCase().replace(/\s+/g, '-')}-modal.js`);
  };

  // Syntax highlight the code
  const highlightCode = (code: string): string => {
    return code
      // Keywords
      .replace(/\b(const|new|true|false|null|undefined)\b/g, '<span class="code-keyword">$1</span>')
      // Strings
      .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '<span class="code-string">\'$1\'</span>')
      // Numbers
      .replace(/\b(\d+)\b/g, '<span class="code-number">$1</span>')
      // Properties
      .replace(/(\w+):/g, '<span class="code-property">$1</span>:')
      // Functions/constructors
      .replace(/\b(uiLib\.\w+|Button|Modal)\b/g, '<span class="code-function">$1</span>')
      // Comments (if any)
      .replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>');
  };

  return (
    <div className={styles.preview}>
      <div className={styles.header}>
        <TabList selectedValue={activeTab} onTabSelect={(e, data) => setActiveTab(data.value as 'preview' | 'code')}>
          <Tab value="preview" icon={<Image24Regular />}>Preview</Tab>
          <Tab value="code" icon={<Code24Regular />}>Code</Tab>
        </TabList>
        <div className={styles.actions}>
          {activeTab === 'preview' && (
            <Button appearance="primary" icon={<Play24Regular />} onClick={showPreview}>
              Show Modal
            </Button>
          )}
          {activeTab === 'code' && (
            <>
              <Button
                appearance={copySuccess ? 'primary' : 'subtle'}
                icon={copySuccess ? ToolbarIcons.copied : ToolbarIcons.copy}
                onClick={handleCopy}
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </Button>
              <Button appearance="subtle" icon={<ArrowDownload24Regular />} onClick={handleDownload}>
                Download
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {activeTab === 'preview' && (
          <div className={styles.mockModal}>
            <div className={styles.mockHeader}>
              <Text className={styles.mockTitle}>{config.title || 'Modal Title'}</Text>
              <span className={styles.mockClose}>×</span>
            </div>
            
            {config.message && (
              <Text className={styles.mockMessage}>{config.message}</Text>
            )}
            
            <div className={styles.mockFields}>
              {config.fields.length === 0 && !config.isWizard ? (
                <Text className={styles.mockEmpty}>Drag fields here from the palette</Text>
              ) : config.isWizard && config.steps ? (
                <>
                  <div className={styles.wizardSteps}>
                    {config.steps.map((step, index) => (
                      <div key={step.id} className={styles.wizardStep}>
                        <span className={styles.wizardStepNumber}>{index + 1}</span>
                        <span className={styles.wizardStepLabel}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                  {config.steps[0] && (
                    <div className={styles.mockFields}>
                      {config.steps[0].fields.map(field => (
                        <div key={field.id} className={styles.mockField}>
                          <Text className={styles.mockFieldLabel}>{field.label}</Text>
                          <Text className={styles.mockFieldType}>{field.type}</Text>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                config.fields.map(field => (
                  <div key={field.id} className={styles.mockField}>
                    <Text className={styles.mockFieldLabel}>
                      {field.label}
                      {field.required && <span className={styles.required}>*</span>}
                    </Text>
                    <Text className={styles.mockFieldType}>{field.type}</Text>
                  </div>
                ))
              )}
            </div>

            <div className={styles.mockButtons}>
              {config.buttons.map(btn => (
                <Button
                  key={btn.id}
                  appearance={btn.setFocus ? 'primary' : btn.isDestructive ? 'outline' : 'secondary'}
                  style={btn.isDestructive ? { color: tokens.colorPaletteRedForeground1 } : undefined}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className={styles.codeBlock}>
            <pre>
              <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Preview;
