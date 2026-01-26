/**
 * Demo Page - Interactive showcase of err403 UI Library components
 */
import React, { useState } from 'react';
import { Layout } from '../shared/Layout';
import * as err403Module from '../../index';

// Use the module exports directly (works in both dev and production)
const err403 = err403Module;
declare const PACKAGE_VERSION: string;

// Helper function to format JSON with syntax highlighting
const formatJsonWithStyle = (obj: any): string => {
  const json = JSON.stringify(obj, null, 2);
  
  // Apply syntax highlighting (no HTML escaping needed since we control the input)
  const highlighted = json
    .replace(/"([^"]+)":/g, '<span style="color: #0078d4; font-weight: bold;">"$1"</span>:') // Property names (blue)
    .replace(/: "([^"]*)"/g, ': <span style="color: #107c10;">"$1"</span>') // String values (green)
    .replace(/: (-?\d+\.?\d*)/g, ': <span style="color: #ca5010;">$1</span>') // Numbers (orange)
    .replace(/: (true|false)/g, ': <span style="color: #8764b8;">$1</span>') // Booleans (purple)
    .replace(/: null/g, ': <span style="color: #605e5c;">null</span>'); // Null (gray)
  
  return `<pre style="background: #f3f2f1; padding: 20px; border-radius: 6px; overflow: auto; max-height: 500px; text-align: left; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.6; border: 1px solid #e1dfdd;">${highlighted}</pre>`;
};

// Code Viewer Component
interface CodeViewerProps {
  code: string;
  language?: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ code, language = 'typescript' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'relative',
      marginTop: '12px',
      borderRadius: '6px',
      border: '1px solid #e1dfdd',
      backgroundColor: '#f9f9f9',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: '#f3f2f1',
        borderBottom: '1px solid #e1dfdd',
        fontSize: '12px',
        color: '#605e5c'
      }}>
        <span>{language}</span>
        <button
          onClick={handleCopy}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            backgroundColor: copied ? '#107c10' : '#0078d4',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: '16px',
        fontSize: '13px',
        lineHeight: '1.6',
        overflowX: 'auto',
        fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace"
      }}>
        <code style={{ color: '#323130' }}>{code}</code>
      </pre>
    </div>
  );
};

// Component Card wrapper with code viewer
interface CardProps {
  title: string;
  badge?: 'ready' | 'beta';
  description: string;
  children: React.ReactNode;
  code?: string;
}

const Card: React.FC<CardProps> = ({ title, badge, description, children, code }) => {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="d365-card">
      <div className="d365-card__header">
        <h2 className="d365-card__title">
          {title}
          {badge && (
            <span className={`d365-card__badge d365-card__badge--${badge}`}>
              {badge}
            </span>
          )}
        </h2>
      </div>
      <div className="d365-card__body">
        <p className="d365-card__description">{description}</p>
        {children}
        {code && (
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={() => setShowCode(!showCode)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: showCode ? '#edebe9' : '#f3f2f1',
                color: '#323130',
                border: '1px solid #d2d0ce',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              {showCode ? '▼ Hide Code' : '▶ Show Code'}
            </button>
            {showCode && <CodeViewer code={code} />}
          </div>
        )}
      </div>
    </div>
  );
};

// Section with title
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div className="d365-section">
    <h3 className="d365-section__title">{title}</h3>
    {children}
  </div>
);

export const Demo: React.FC = () => {
  // Toast handlers
  const showSuccessToast = () => {
    err403.Toast.success({
      title: 'Account Saved',
      message: 'The account has been updated successfully.',
      duration: 5000
    });
  };

  const showErrorToast = () => {
    err403.Toast.error({
      title: 'Operation Failed',
      message: 'Unable to save the record. Please try again.',
      duration: 6000
    });
  };

  const showWarnToast = () => {
    err403.Toast.warn({
      title: 'Warning',
      message: 'Some fields are missing. Please review your input.',
      duration: 5000
    });
  };

  const showInfoToast = () => {
    err403.Toast.info({
      title: 'Information',
      message: 'System maintenance scheduled for tonight at 10 PM.',
      duration: 7000
    });
  };

  const showToastWithSound = () => {
    err403.Toast.success({
      title: 'Payment Received',
      message: '$500 payment processed successfully.',
      duration: 5000,
      sound: true
    });
  };

  // Logger handlers
  const logTrace = () => console.debug(...err403.TRACE, 'Debug message', { userId: 123 });
  const logWarning = () => console.debug(...err403.WAR, 'Warning message');
  const logError = () => console.error(...err403.ERR, 'Error message', new Error('Sample'));

  // Modal handlers
  const showAlertModal = () => {
    err403.ModalHelpers.alert('Success', 'Your changes have been saved successfully.');
  };

  const showConfirmModal = async () => {
    const confirmed = await err403.ModalHelpers.confirm(
      'Delete Record?',
      'Are you sure you want to delete this record? This action cannot be undone.'
    );
    if (confirmed) {
      err403.Toast.success({ title: 'Confirmed', message: 'Record deleted.' });
    } else {
      err403.Toast.info({ title: 'Cancelled', message: 'Action cancelled.' });
    }
  };

  const showSimpleForm = () => {
    const modal = new err403.Modal({
      title: 'Create Contact',
      message: 'Enter the contact details below.',
      fields: [
        new err403.Input({ id: 'firstname', label: 'First Name', type: 'text', required: true, placeholder: 'Enter first name' }),
        new err403.Input({ id: 'lastname', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter last name' }),
        new err403.Input({ id: 'email', label: 'Email', type: 'text', placeholder: 'example@company.com' })
      ],
      buttons: [
        new err403.Button('Cancel', () => {}),
        new err403.Button('Create', () => {
          const data = modal.getFieldValues();
          err403.ModalHelpers.alert(
            'Form Data Submitted',
            formatJsonWithStyle(data)
          );
          err403.Toast.success({ title: 'Contact Created', message: `${data.firstname} ${data.lastname} has been created.` });
        }, true)
      ]
    });
    modal.show();
  };

  const showAllFieldTypes = () => {
    const modal = new err403.Modal({
      title: 'All Field Types Demo',
      size: 'large',
      fields: [
        { id: 'textInput', label: 'Text Input', type: 'text', placeholder: 'Enter text' },
        { id: 'numberInput', label: 'Number Input', type: 'number', value: 42 },
        { id: 'dateInput', label: 'Date', type: 'date' },
        { 
          id: 'accountLookup', 
          label: 'Account (with expand)', 
          type: 'lookup', 
          entityName: 'account', 
          lookupColumns: [
            'name',                                        // Always visible
            { attribute: 'accountnumber', visible: true }, // Always visible
            { attribute: 'telephone1', label: 'Phone', visible: false },      // Shown on expand
            { attribute: 'emailaddress1', label: 'Email', visible: false },   // Shown on expand
            { attribute: 'address1_city', label: 'City', visible: false }     // Shown on expand
          ],
          placeholder: 'Search accounts...' 
        },
        { 
          id: 'contactLookup', 
          label: 'Contact (simple)',
          type: 'lookup',
          entityName: 'contact',
          lookupColumns: [
            'fullname',
            { attribute: 'emailaddress1', visible: true }
          ],
          placeholder: 'Search contacts...'
        },
        { id: 'checkboxInput', label: 'Accept Terms', type: 'checkbox', value: false, tooltip: 'D365-style checkbox' },
        { id: 'switchInput', label: 'Enable Notifications', type: 'switch', value: true, tooltip: 'Modern toggle switch' },
        { id: 'rangeInput', label: 'Range Slider', type: 'range', value: 50, showValue: true, extraAttributes: { min: 0, max: 100, step: 5 } },
        { id: 'textarea', label: 'Multi-line Text', type: 'textarea', rows: 3, placeholder: 'Enter notes' },
        { id: 'optionset', label: 'Status (Dropdown)', type: 'select', options: ['Draft', 'Active', 'Inactive'], value: 'Active', displayMode: 'dropdown' },
        { id: 'priority', label: 'Priority (Badges)', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'], value: 'Medium', displayMode: 'badges' },
        { 
          id: 'fileUpload', 
          label: 'File Upload (Drag & Drop)', 
          type: 'file',
          fileUpload: {
            accept: '.pdf,.doc,.docx,.xls,.xlsx,image/*',
            maxFiles: 5,
            maxSize: 5242880, // 5MB
            multiple: true,
            showFileList: true,
            dragDropText: 'Drag and drop files here',
            browseText: 'or browse to choose files',
            onFilesSelected: (files) => {
              console.debug(...err403.UILIB, `${files.length} file(s) selected:`, files.map(f => f.name));
              err403.Toast.info({ title: 'Files Selected', message: `${files.length} file(s) ready to upload` });
            }
          }
        }
      ],
      buttons: [
        new err403.ModalButton('Close', () => {}),
        new err403.ModalButton('Submit', () => {
          const data = modal.getFieldValues();
          console.debug(...err403.UILIB, 'Form data:', data);
          err403.ModalHelpers.alert(
            'Form Data Submitted',
            formatJsonWithStyle(data)
          );
          err403.Toast.success({ title: 'Data Captured', message: 'All field values captured!' });
        }, true)
      ]
    });
    modal.show();
  };

  const showAddressLookupForm = () => {
    const modal = new err403.Modal({
      title: 'Create Contact with Address',
      size: 'large',
      fields: [
        new err403.Input({ id: 'firstname', label: 'First Name', type: 'text', required: true, placeholder: 'Enter first name' }),
        new err403.Input({ id: 'lastname', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter last name' }),
        new err403.Input({ id: 'email', label: 'Email', type: 'text', placeholder: 'example@company.com' }),
        
        // Address lookup field - using field config object
        { 
          id: 'addressLookup', 
          label: 'Search Address', 
          type: 'addressLookup',
          addressLookup: {
            provider: 'google',
            apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_API_KEY_HERE',
            placeholder: 'Start typing an address...',
            componentRestrictions: { country: ['nz', 'au'] }, // Restrict to New Zealand and Australia
            fields: {
              street: 'address1_line1',
              city: 'address1_city',
              state: 'address1_stateorprovince',
              postalCode: 'address1_postalcode',
              country: 'address1_country',
              latitude: 'address1_latitude',
              longitude: 'address1_longitude'
            },
            onSelect: (address) => {
              console.debug(...err403.UILIB, 'Selected address:', address);
              err403.Toast.success({ 
                title: 'Address Selected',
                message: `${address.formattedAddress}`,
                duration: 5000
              });
            }
          }
        },
        
        // These fields will be auto-populated
        new err403.Input({ id: 'address1_line1', label: 'Street', type: 'text' }),
        new err403.Input({ id: 'address1_city', label: 'City', type: 'text' }),
        new err403.Input({ id: 'address1_stateorprovince', label: 'State/Province', type: 'text' }),
        new err403.Input({ id: 'address1_postalcode', label: 'Postal Code', type: 'text' }),
        new err403.Input({ id: 'address1_country', label: 'Country', type: 'text' }),
        new err403.Input({ id: 'address1_latitude', label: 'Latitude', type: 'number' }),
        new err403.Input({ id: 'address1_longitude', label: 'Longitude', type: 'number' })
      ],
      buttons: [
        new err403.ModalButton('Cancel', () => {}),
        new err403.ModalButton('Create Contact', () => {
          const data = modal.getFieldValues();
          console.debug(...err403.UILIB, 'Contact data with address:', data);
          
          // Show result modal with formatted JSON
          err403.ModalHelpers.alert(
            'Form Data Submitted',
            formatJsonWithStyle(data)
          );
          
          err403.Toast.success({ 
            title: 'Contact Created', 
            message: `${data.firstname} ${data.lastname} created with address in ${data.address1_city || 'N/A'}` 
          });
          return true;
        }, true)
      ]
    });
    modal.show();
  };

  const showTabsModal = () => {
    const modal = new err403.Modal({
      title: 'Account Settings',
      size: 'large',
      fields: [{
        id: 'tabs',
        fields: [
          { label: 'Profile', fields: [
            { id: 'name', label: 'Name', type: 'text', value: 'John Doe' },
            { id: 'email', label: 'Email', type: 'text', value: 'john@example.com' }
          ]},
          { label: 'Preferences', fields: [
            { id: 'notifications', label: 'Email Notifications', type: 'toggle', value: true },
            { id: 'theme', label: 'Theme', options: ['Light', 'Dark', 'Auto'], value: 'Light' }
          ]},
          { label: 'Security', fields: [
            { id: '2fa', label: 'Two-Factor Auth', type: 'toggle', value: false }
          ]}
        ],
        asTabs: true
      }],
      buttons: [
        new err403.ModalButton('Cancel', () => {}),
        new err403.ModalButton('Save', () => {
          const data = modal.getFieldValues();
          err403.ModalHelpers.alert(
            'Settings Saved',
            formatJsonWithStyle(data)
          );
          err403.Toast.success({ title: 'Settings Saved', message: 'Your preferences have been updated.' });
        }, true)
      ]
    });
    modal.show();
  };

  const showDraggableModal = () => {
    const modal = new err403.Modal({
      title: 'Draggable Dialog',
      message: 'Try dragging this modal by clicking and holding the header!',
      draggable: true,
      size: 'small',
      buttons: [new err403.ModalButton('Close', () => {}, true)]
    });
    modal.show();
  };

  // Lookup handlers
  const showSimpleLookup = () => {
    err403.Lookup.open({
      entity: 'account',
      columns: ['name', 'accountnumber', 'telephone1', 'address1_city'],
      title: 'Select Account',
      onSelect: (records: any[]) => {
        err403.Toast.success({ title: 'Account Selected', message: `Selected: ${records.map((r: any) => r.name).join(', ')}` });
      }
    });
  };

  const showMultiSelectLookup = () => {
    err403.Lookup.open({
      entity: 'contact',
      columns: ['name', 'emailaddress1', 'telephone1'],
      multiSelect: true,
      title: 'Select Contacts (Multi-Select)',
      onSelect: (records: any[]) => {
        err403.Toast.success({ title: `${records.length} Contact(s) Selected`, message: `Selected: ${records.map((r: any) => r.name).join(', ')}` });
      }
    });
  };

  // Table handlers
  const showSimpleTable = () => {
    const sampleData = [
      { id: 1, name: 'Contoso Ltd', industry: 'Technology', revenue: 5000000, employees: 250, location: 'USA' },
      { id: 2, name: 'Fabrikam Inc', industry: 'Manufacturing', revenue: 8500000, employees: 450, location: 'USA' },
      { id: 3, name: 'Adventure Works', industry: 'Retail', revenue: 3200000, employees: 120, location: 'Canada' },
      { id: 4, name: 'Northwind Traders', industry: 'Distribution', revenue: 6700000, employees: 180, location: 'USA' },
      { id: 5, name: 'Wide World Importers', industry: 'Distribution', revenue: 7200000, employees: 220, location: 'Canada' },
      { id: 6, name: 'Tailspin Toys', industry: 'Retail', revenue: 4100000, employees: 95, location: 'UK' },
      { id: 7, name: 'Alpine Ski House', industry: 'Retail', revenue: 2800000, employees: 75, location: 'Canada' },
      { id: 8, name: 'City Power & Light', industry: 'Technology', revenue: 9200000, employees: 380, location: 'USA' },
      { id: 9, name: 'Fourth Coffee', industry: 'Manufacturing', revenue: 5600000, employees: 165, location: 'UK' },
      { id: 10, name: 'Proseware Inc', industry: 'Technology', revenue: 6300000, employees: 210, location: 'UK' }
    ];

    const modal = new err403.Modal({
      title: 'Company Directory',
      size: 'large',
      fields: [
        {
          id: 'companyTable',
          type: 'table',
          tableColumns: [
            { id: 'name', header: 'Company Name', visible: true, sortable: true, width: '250px' },
            { id: 'industry', header: 'Industry', visible: true, sortable: true, width: '150px' },
            { id: 'location', header: 'Location', visible: true, sortable: true, width: '120px' },
            { id: 'revenue', header: 'Revenue', visible: true, sortable: true, width: '150px', align: 'right' },
            { id: 'employees', header: 'Employees', visible: true, sortable: true, width: '120px', align: 'right' }
          ],
          data: sampleData,
          selectionMode: 'none'
        }
      ],
      buttons: [new err403.ModalButton('Close', () => {}, true)]
    });
    modal.show();
  };

  const showTableWithSelection = () => {
    const contactData = [
      { id: 1, name: 'John Doe', email: 'john.doe@contoso.com', department: 'Sales' },
      { id: 2, name: 'Jane Smith', email: 'jane.smith@fabrikam.com', department: 'Marketing' },
      { id: 3, name: 'Bob Johnson', email: 'bob.j@adventure.com', department: 'IT' },
      { id: 4, name: 'Alice Williams', email: 'alice.w@northwind.com', department: 'HR' }
    ];

    const modal = new err403.Modal({
      title: 'Select Contacts',
      size: 'large',
      fields: [
        {
          id: 'contactTable',
          type: 'table',
          tableColumns: [
            { id: 'name', header: 'Full Name', visible: true, sortable: true, width: '200px' },
            { id: 'email', header: 'Email Address', visible: true, sortable: true, width: '250px' },
            { id: 'department', header: 'Department', visible: true, sortable: true, width: '150px' }
          ],
          data: contactData,
          selectionMode: 'multiple'
        }
      ],
      buttons: [
        new err403.ModalButton('Cancel', () => {}),
        new err403.ModalButton('Process Selected', () => {
          const selected = modal.getFieldValue('contactTable');
          if (selected.length === 0) {
            err403.Toast.warn({ title: 'No Selection', message: 'Please select at least one contact' });
            return false;
          }
          err403.ModalHelpers.alert(
            'Selected Contacts',
            formatJsonWithStyle(selected)
          );
          err403.Toast.success({ title: 'Processing Complete', message: `Processed ${selected.length} contact(s)` });
          return true;
        }, true)
      ]
    });
    modal.show();
  };

  // File Upload Demo with Drag & Drop
  const showFileUploadDemo = () => {
    const modal = new err403.Modal({
      title: 'Upload Documents',
      size: 'large',
      fields: [
        { 
          id: 'documents', 
          label: 'Business Documents', 
          type: 'file',
          required: true,
          fileUpload: {
            accept: '.pdf,.doc,.docx,.xls,.xlsx',
            maxFiles: 10,
            maxSize: 10485760, // 10MB per file
            multiple: true,
            showFileList: true,
            dragDropText: 'Drag and drop documents here',
            browseText: 'or click to browse',
            onFilesSelected: (files) => {
              console.debug(...err403.UILIB, 'Files selected:', files.map(f => ({ name: f.name, size: f.size })));
              const totalSize = files.reduce((sum, f) => sum + f.size, 0);
              const totalMB = (totalSize / 1048576).toFixed(2);
              err403.Toast.info({ 
                title: 'Files Ready', 
                message: `${files.length} file(s) selected (${totalMB} MB total)`,
                duration: 4000
              });
            }
          }
        },
        { 
          id: 'images', 
          label: 'Product Images', 
          type: 'file',
          fileUpload: {
            accept: 'image/*',
            maxFiles: 5,
            maxSize: 5242880, // 5MB per file
            multiple: true,
            dragDropText: 'Drop product images here',
            browseText: 'or select image files'
          }
        },
        { id: 'description', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Add a description for the uploaded files...' }
      ],
      buttons: [
        new err403.ModalButton('Cancel', () => {}),
        new err403.ModalButton('Upload', () => {
          const documents = modal.getFieldValue('documents');
          const images = modal.getFieldValue('images');
          const description = modal.getFieldValue('description');
          
          if (!documents || documents.length === 0) {
            err403.Toast.error({ title: 'No Documents', message: 'Please select at least one document to upload' });
            return false;
          }
          
          console.debug(...err403.UILIB, 'Uploading files:', { 
            documents: documents.map(f => f.name),
            images: images?.map(f => f.name) || [],
            description 
          });
          
          err403.Toast.success({ 
            title: 'Upload Started', 
            message: `Uploading ${documents.length + (images?.length || 0)} file(s)...`,
            sound: true
          });
          
          return true;
        }, true)
      ]
    });
    modal.show();
  };

  const showComprehensiveDemo = () => {
    const productData = [
      { id: 1, product: 'Surface Laptop 5', category: 'Hardware', price: 1299, stock: 45, active: true },
      { id: 2, product: 'Office 365 E3', category: 'Software', price: 20, stock: 999, active: true },
      { id: 3, product: 'Azure Credits', category: 'Cloud Services', price: 100, stock: 500, active: true },
      { id: 4, product: 'Dynamics 365 Sales', category: 'CRM', price: 65, stock: 150, active: false }
    ];

    const modal = new err403.Modal({
      title: '🧙 Wizard Demo - Multi-Step Form',
      message: 'This is the parent modal message that appears above the step indicators. It stays visible throughout the entire wizard.',
      content: '<div style="padding: 12px; background: #f3f2f1; border-radius: 4px; margin-bottom: 8px;"><strong>Modal Content:</strong> You can also add HTML content at the modal level. This is useful for instructions that apply to all steps.</div>',
      size: 'large',
      draggable: true,
      progress: {
        enabled: true,
        type: 'steps-left',
        currentStep: 1,
        totalSteps: 5,
        allowStepNavigation: true,
        steps: [
          {
            id: 'step1',
            label: 'Basic Info',
            message: 'Step 1: Please provide basic company information below.',
            content: '<small style="color: #605e5c;">All fields with asterisk (*) are required.</small>',
            fields: [
              { id: 'companyName', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name', value: 'Contoso Ltd' },
              { id: 'industry', label: 'Industry', type: 'select', options: ['Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Finance'], value: 'Technology' },
              { id: 'website', label: 'Website', type: 'text', placeholder: 'https://example.com', value: 'https://contoso.com' },
              { id: 'phone', label: 'Phone', type: 'text', placeholder: '+1 (555) 123-4567' }
            ]
          },
          {
            id: 'step2',
            label: 'Address Lookup Test',
            message: 'Step 2: Test lookup field with auto-population of related fields.',
            content: '<small style="color: #605e5c;">Select an account from the lookup. The fields below will auto-populate.</small>',
            fields: [
              { 
                id: 'accountLookup', 
                label: 'Select Account', 
                type: 'lookup',
                entityName: 'account',
                lookupColumns: [
                  { attribute: 'name', label: 'Account Name' },
                  { attribute: 'accountnumber', label: 'Account Number' },
                  { attribute: 'emailaddress1', label: 'Email' },
                  { attribute: 'telephone1', label: 'Phone' },
                  { attribute: 'address1_city', label: 'City' },
                  { attribute: 'address1_stateorprovince', label: 'State' }
                ],
                onChange: function(value) {
                  console.debug(...err403.UILIB, '🔍 Lookup onChange triggered:', value);
                  if (value && value.id) {
                    console.debug(...err403.UILIB, '📋 Record data:', value.record);
                    modal.setFieldValue('accountName', value.record?.name || 'N/A');
                    modal.setFieldValue('accountNumber', value.record?.accountnumber || 'N/A');
                    modal.setFieldValue('email', value.record?.emailaddress1 || 'N/A');
                    modal.setFieldValue('phone', value.record?.telephone1 || 'N/A');
                    modal.setFieldValue('city', value.record?.address1_city || 'N/A');
                    modal.setFieldValue('state', value.record?.address1_stateorprovince || 'N/A');
                  } else {
                    console.debug(...err403.UILIB, '❌ Lookup cleared');
                    modal.setFieldValue('accountName', '');
                    modal.setFieldValue('accountNumber', '');
                    modal.setFieldValue('email', '');
                    modal.setFieldValue('phone', '');
                    modal.setFieldValue('city', '');
                    modal.setFieldValue('state', '');
                  }
                }
              },
              { id: 'accountName', label: '→ Account Name', type: 'text', readOnly: true, placeholder: 'Will auto-populate...' },
              { id: 'accountNumber', label: '→ Account Number', type: 'text', readOnly: true, placeholder: 'Will auto-populate...' },
              { id: 'email', label: '→ Email', type: 'text', readOnly: true, placeholder: 'Will auto-populate...' },
              { id: 'phone', label: '→ Phone', type: 'text', readOnly: true, placeholder: 'Will auto-populate...' },
              { id: 'city', label: '→ City', type: 'text', readOnly: true, placeholder: 'Will auto-populate...' },
              { id: 'state', label: '→ State', type: 'text', readOnly: true, placeholder: 'Will auto-populate...' }
            ]
          },
          {
            id: 'step3',
            label: 'Business Details',
            message: 'Step 3: Tell us more about your business operations.',
            content: '<small style="color: #605e5c;">This information helps us tailor our services to your needs.</small>',
            fields: [
              { id: 'revenue', label: 'Annual Revenue', type: 'number', required: true, placeholder: 'Enter revenue (required)' },
              { id: 'employees', label: 'Number of Employees', type: 'number', required: true, value: 250 },
              { id: 'foundedDate', label: 'Founded Date', type: 'date' },
              { id: 'publiclyTraded', label: 'Publicly Traded', type: 'switch', value: true },
              { id: 'satisfactionScore', label: 'Customer Satisfaction', type: 'range', value: 85, showValue: true, extraAttributes: { min: 0, max: 100, step: 5 } },
              { 
                id: 'businessAddress', 
                label: 'Business Address', 
                type: 'addressLookup',
                placeholder: 'Search for address...',
                addressLookup: {
                  provider: 'google',
                  componentRestrictions: { country: ['nz', 'au'] }
                }
              }
            ]
          },
          {
            id: 'step3',
            label: 'Product Selection',
            message: 'Step 4: Select the products you are interested in.',
            content: '<small style="color: #605e5c;">You can select multiple products from the table below.</small>',
            fields: [
              {
                id: 'productTable',
                type: 'table',
                tableColumns: [
                  { id: 'product', header: 'Product Name', visible: true, sortable: true, width: '250px' },
                  { id: 'category', header: 'Category', visible: true, sortable: true, width: '180px' },
                  { id: 'price', header: 'Price ($)', visible: true, sortable: true, width: '120px' },
                  { id: 'stock', header: 'In Stock', visible: true, sortable: true, width: '100px' }
                ],
                data: productData,
                selectionMode: 'multiple'
              }
            ]
          },
          {
            id: 'step4',
            label: 'Preferences',
            message: 'Step 5: Configure your communication preferences and upload supporting documents.',
            content: '<small style="color: #605e5c;">These preferences can be changed later in your account settings.</small>',
            fields: [
              { 
                id: 'allowMarketing', 
                label: 'Allow Marketing Communications', 
                type: 'switch', 
                value: true,
                tooltip: 'Toggle to show/hide marketing preference options'
              },
              { 
                id: 'attachments', 
                label: 'Supporting Documents', 
                type: 'file',
                fileUpload: {
                  accept: '.pdf,.doc,.docx',
                  maxFiles: 3,
                  maxSize: 10485760, // 10MB
                  multiple: true,
                  dragDropText: 'Drop business documents here',
                  browseText: 'or click to browse (.pdf, .doc, .docx)',
                  onFilesSelected: (files) => {
                    console.log('Documents selected:', files);
                  }
                }
              },
              { 
                id: 'emailNotifications', 
                label: 'Email Notifications', 
                type: 'switch', 
                value: true,
                visibleWhen: { field: 'allowMarketing', operator: 'truthy' }
              },
              { 
                id: 'smsAlerts', 
                label: 'SMS Alerts', 
                type: 'switch', 
                value: false,
                visibleWhen: { field: 'allowMarketing', operator: 'truthy' }
              },
              { 
                id: 'newsletter', 
                label: 'Marketing Newsletter', 
                type: 'switch', 
                value: true,
                visibleWhen: { field: 'allowMarketing', operator: 'truthy' }
              },
              { id: 'language', label: 'Preferred Language', type: 'select', required: true, options: ['English', 'Spanish', 'French', 'German', 'Chinese'], value: 'English' },
              { id: 'notes', label: 'Additional Notes (Required)', type: 'textarea', required: true, rows: 3, placeholder: 'Please provide some notes...' }
            ]
          }
        ]
      },
      buttons: [
        new err403.ModalButton('Cancel', () => {}),
        new err403.ModalButton('⬅️ Previous', () => {
          modal.previousStep();
          return false; // Don't close modal
        }),
        new err403.ModalButton('Next ➡️', () => {
          modal.nextStep();
          return false; // Don't close modal
        }),
        new err403.ModalButton('✅ Finish', () => {
          const allData = modal.getFieldValues();
          const selectedProducts = modal.getFieldValue('productTable');
          
          console.log('📦 Complete Wizard Data:', allData);
          console.log('✅ Selected Products:', selectedProducts);
          
          const summary = {
            ...allData,
            selectedProducts: selectedProducts
          };
          
          err403.ModalHelpers.alert(
            '🎉 Wizard Completed!',
            formatJsonWithStyle(summary)
          );
          
          err403.Toast.success({
            title: '🎉 Wizard Completed!',
            message: `Company: ${allData.companyName || 'N/A'} | ${selectedProducts.length} product(s) selected`,
            duration: 6000,
            sound: true
          });
          return true;
        }, true)
      ]
    });
    modal.show();
  };

  // Show welcome toast on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      err403.Toast.info({
        title: 'Welcome!',
        message: 'Try the buttons to see Toast notifications and Modal dialogs in action.',
        duration: 6000
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout currentPage="demo" version={typeof PACKAGE_VERSION !== 'undefined' ? PACKAGE_VERSION : undefined}>
      <div className="d365-page-title">
        <h1 className="d365-page-title__heading">Interactive Demo</h1>
        <p className="d365-page-title__subtitle">
          Explore all the UI components available in the err403 UI Library for Dynamics 365 CE
        </p>
      </div>

      <div className="d365-card-grid">
        {/* Toast Notifications */}
        <Card
          title="Toast Notifications"
          badge="ready"
          description="Toast notifications with auto-dismiss, stacking, and optional sound alerts."
          code={`// Success Toast
err403.Toast.success({
  title: "Account Saved",
  message: "The account has been updated successfully.",
  duration: 5000,
  sound: true
});

// Error Toast
err403.Toast.error({
  title: "Operation Failed",
  message: "Unable to save. Please try again.",
  duration: 6000
});

// Warning Toast
err403.Toast.warn({
  title: "Warning",
  message: "Some fields are missing.",
  duration: 5000
});

// Info Toast
err403.Toast.info({
  title: "Information",
  message: "System maintenance tonight at 10 PM.",
  duration: 7000
});`}
        >
          <Section title="Basic Toasts">
            <div className="d365-btn-group">
              <button className="d365-btn d365-btn--success" onClick={showSuccessToast}>Success</button>
              <button className="d365-btn d365-btn--error" onClick={showErrorToast}>Error</button>
              <button className="d365-btn d365-btn--warning" onClick={showWarnToast}>Warning</button>
              <button className="d365-btn d365-btn--primary" onClick={showInfoToast}>Info</button>
            </div>
          </Section>
          <Section title="With Sound">
            <div className="d365-btn-group">
              <button className="d365-btn d365-btn--success" onClick={showToastWithSound}>Success + Sound</button>
            </div>
          </Section>
        </Card>

        {/* Logger Utility */}
        <Card
          title="Logger Utility"
          badge="ready"
          description="Consistent console logging with styled prefixes for debugging."
          code={`// Debug/Trace logs
console.debug(...err403.TRACE, "Debug message", { userId: 123 });

// Warning logs
console.warn(...err403.WAR, "Warning message");

// Error logs
console.error(...err403.ERR, "Error message", new Error("Sample"));`}
        >
          <Section title="Log Types">
            <div className="d365-btn-group">
              <button className="d365-btn d365-btn--primary" onClick={logTrace}>Log TRACE</button>
              <button className="d365-btn d365-btn--warning" onClick={logWarning}>Log WAR</button>
              <button className="d365-btn d365-btn--error" onClick={logError}>Log ERR</button>
            </div>
          </Section>
          <div className="d365-note d365-note--info">
            <span className="d365-note__icon">ℹ️</span>
            <span>Open the browser console (F12) to see styled log outputs.</span>
          </div>
        </Card>

        {/* Modal Dialogs */}
        <Card
          title="Modal Dialogs"
          badge="ready"
          description="Modals with forms, validation, wizard navigation, tabs, and conditional field visibility."
          code={`// Alert Modal
err403.Modal.alert('Success', 'Changes saved successfully.');

// Confirm Modal  
const confirmed = await err403.Modal.confirm('Delete Record?', 'This action cannot be undone.');

// Form Modal with Fields
const modal = new err403.Modal({
  title: "New Account",
  size: "large",
  fields: [
    { id: 'name', label: 'Account Name', type: 'text', required: true },
    { id: 'industry', label: 'Industry', type: 'select', 
      options: ['Technology', 'Manufacturing', 'Retail'] },
    { id: 'active', label: 'Active', type: 'switch', value: true },
    { id: 'revenue', label: 'Annual Revenue', type: 'number' }
  ],
  buttons: [
    new err403.ModalButton('Cancel', () => {}),
    new err403.ModalButton('Save', () => {
      const data = modal.getFieldValues();
      console.log('Saved:', data);
      return true;
    }, true)
  ]
});
modal.show();

// Address Lookup with Google Maps
const addressModal = new err403.Modal({
  title: "Contact with Address",
  fields: [
    { id: 'firstname', label: 'First Name', type: 'text', required: true },
    { id: 'lastname', label: 'Last Name', type: 'text', required: true },
    { 
      id: 'address', 
      label: 'Search Address', 
      type: 'addressLookup',
      addressLookup: {
        provider: 'google', // or 'azure'
        apiKey: 'YOUR_API_KEY',
        placeholder: 'Start typing...',
        fields: {
          street: 'street',
          city: 'city',
          state: 'state',
          postalCode: 'zip',
          country: 'country'
        },
        onSelect: (address) => {
          console.log('Selected:', address.formattedAddress);
        }
      }
    },
    // Auto-populated fields
    { id: 'street', label: 'Street', type: 'text' },
    { id: 'city', label: 'City', type: 'text' },
    { id: 'state', label: 'State', type: 'text' },
    { id: 'zip', label: 'Postal Code', type: 'text' }
  ]
});

// File Upload with Drag & Drop
const uploadModal = new err403.Modal({
  title: "Upload Documents",
  fields: [
    { 
      id: 'files', 
      label: 'Documents', 
      type: 'file',
      fileUpload: {
        accept: '.pdf,.doc,.docx',
        maxFiles: 5,
        maxSize: 10485760, // 10MB
        multiple: true,
        dragDropText: 'Drag files here',
        onFilesSelected: (files) => {
          console.log('Selected:', files);
        }
      }
    }
  ]
});`}
        >
          <Section title="Basic Modals">
            <div className="d365-btn-group">
              <button className="d365-btn d365-btn--primary" onClick={showAlertModal}>Alert</button>
              <button className="d365-btn d365-btn--primary" onClick={showConfirmModal}>Confirm</button>
            </div>
          </Section>
          <Section title="Form Modals">
            <div className="d365-btn-group">
              <button className="d365-btn d365-btn--primary" onClick={showSimpleForm}>Simple Form</button>
              <button className="d365-btn d365-btn--primary" onClick={showAllFieldTypes}>All Field Types</button>
              <button className="d365-btn d365-btn--primary d365-btn--highlight" onClick={showAddressLookupForm}>📍 Address Lookup</button>
              <button className="d365-btn d365-btn--primary d365-btn--highlight" onClick={showFileUploadDemo}>📎 File Upload</button>
            </div>
          </Section>
          <Section title="Advanced Features">
            <div className="d365-btn-group">
              <button className="d365-btn d365-btn--secondary" onClick={showTabsModal}>Tabs</button>
              <button className="d365-btn d365-btn--secondary" onClick={showDraggableModal}>Draggable</button>
              <button className="d365-btn d365-btn--secondary d365-btn--highlight" onClick={showComprehensiveDemo}>🎯 Complete Showcase</button>
            </div>
          </Section>
        </Card>

        {/* Lookup Component */}
        <Card
          title="Lookup Component"
          badge="ready"
          description="Advanced entity record lookup with search, pagination, and sorting."
          code={`// Simple Lookup
err403.Lookup.open({
  entity: 'account',
  title: 'Select Account',
  columns: ['name', 'emailaddress1', 'telephone1'],
  onSelect: (selected) => {
    console.log('Selected:', selected);
  }
});

// Multi-Select Lookup
err403.Lookup.open({
  entity: 'contact',
  title: 'Select Contacts',
  allowMultiSelect: true,
  columns: ['fullname', 'emailaddress1', 'jobtitle'],
  onSelect: (selected) => {
    console.log('Selected contacts:', selected);
  }
});`}
        >
          <Section title="Lookup Types">
            <div className="d365-btn-group">
              <button className="d365-btn d365-btn--primary" onClick={showSimpleLookup}>Simple Lookup</button>
              <button className="d365-btn d365-btn--primary" onClick={showMultiSelectLookup}>Multi-Select</button>
            </div>
          </Section>
          <div className="d365-note d365-note--warning">
            <span className="d365-note__icon">⚠️</span>
            <span>Lookup uses mock data in demo. In D365, it fetches real entity records.</span>
          </div>
        </Card>

        {/* Table Component */}
        <Card
          title="Table Component"
          badge="ready"
          description="Display tabular data with sortable columns and row selection."
          code={`// Table as a field in modals
const modal = new err403.Modal({
  title: 'Product Catalog',
  size: 'large',
  fields: [
    {
      id: 'productsTable',
      type: 'table',
      label: 'Products',
      tableColumns: [
        { id: 'name', header: 'Product Name', visible: true, sortable: true, width: '250px' },
        { id: 'category', header: 'Category', visible: true, sortable: true, width: '150px' },
        { id: 'price', header: 'Price', visible: true, sortable: true, width: '100px' },
        { id: 'stock', header: 'In Stock', visible: true, sortable: true, width: '100px' }
      ],
      data: [
        { id: 1, name: 'Surface Laptop 5', category: 'Hardware', price: 1299, stock: 45 },
        { id: 2, name: 'Office 365 E3', category: 'Software', price: 20, stock: 999 },
        { id: 3, name: 'Azure Credits', category: 'Cloud', price: 100, stock: 500 }
      ],
      selectionMode: 'multiple',
      onRowSelect: (selectedRows) => {
        console.log('Selected:', selectedRows);
      }
    }
  ]
});

// Get selected rows
const selected = modal.getFieldValue('productsTable');
console.log('Selected:', selected);`}
        >
          <Section title="Table Types">
            <div className="d365-btn-group">
              <button className="d365-btn d365-btn--primary" onClick={showSimpleTable}>Simple Table</button>
              <button className="d365-btn d365-btn--primary" onClick={showTableWithSelection}>With Selection</button>
            </div>
          </Section>
        </Card>
      </div>
    </Layout>
  );
};

export default Demo;
