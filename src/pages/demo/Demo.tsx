/**
 * Demo Page - Interactive showcase of err403 UI Library components
 */
import React, { useState } from 'react';
import { Layout } from '../shared/Layout';
import * as err403Module from '../../index';

// Use the module exports directly (works in both dev and production)
const uiLib = err403Module;
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
    <div className="ui-lib-d365-card">
      <div className="ui-lib-d365-card__header">
        <h2 className="ui-lib-d365-card__title">
          {title}
          {badge && (
            <span className={`ui-lib-d365-card__badge ui-lib-d365-card__badge--${badge}`}>
              {badge}
            </span>
          )}
        </h2>
      </div>
      <div className="ui-lib-d365-card__body">
        <p className="ui-lib-d365-card__description">{description}</p>
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
  <div className="ui-lib-d365-section">
    <h3 className="ui-lib-d365-section__title">{title}</h3>
    {children}
  </div>
);

export const Demo: React.FC = () => {
  // Toast handlers
  const showSuccessToast = () => {
    uiLib.Toast.success({
      title: 'Account Saved',
      message: 'The account has been updated successfully.',
      duration: 5000
    });
  };

  const showErrorToast = () => {
    uiLib.Toast.error({
      title: 'Operation Failed',
      message: 'Unable to save the record. Please try again.',
      duration: 6000
    });
  };

  const showWarnToast = () => {
    uiLib.Toast.warn({
      title: 'Warning',
      message: 'Some fields are missing. Please review your input.',
      duration: 5000
    });
  };

  const showInfoToast = () => {
    uiLib.Toast.info({
      title: 'Information',
      message: 'System maintenance scheduled for tonight at 10 PM.',
      duration: 7000
    });
  };

  const showToastWithSound = () => {
    uiLib.Toast.success({
      title: 'Payment Received',
      message: '$500 payment processed successfully.',
      duration: 5000,
      sound: true
    });
  };

  // Logger handlers
  const logTrace = () => console.debug(...uiLib.TRACE, 'Debug message', { userId: 123 });
  const logWarning = () => console.debug(...uiLib.WAR, 'Warning message');
  const logError = () => console.error(...uiLib.ERR, 'Error message', new Error('Sample'));

  // Modal handlers
  const showAlertSuccess = () => {
    uiLib.ModalHelpers.alert('Success', 'Your changes have been saved successfully.', 'success');
  };

  const showAlertInfo = () => {
    uiLib.ModalHelpers.alert('Information', 'This is an informational message.', 'info');
  };

  const showAlertWarning = () => {
    uiLib.ModalHelpers.alert('Warning', 'Please review your data before proceeding.', 'warning');
  };

  const showAlertError = () => {
    uiLib.ModalHelpers.alert('Error', 'Failed to save the record. Please try again.', 'error');
  };

  const showConfirmSuccess = async () => {
    const confirmed = await uiLib.ModalHelpers.confirm(
      'Save Changes?',
      'Do you want to save your changes?',
      'success'
    );
    if (confirmed) {
      uiLib.Toast.success({ title: 'Saved', message: 'Changes saved successfully.' });
    }
  };

  const showConfirmWarning = async () => {
    const confirmed = await uiLib.ModalHelpers.confirm(
      'Delete Record?',
      'Are you sure you want to delete this record? This action cannot be undone.',
      'warning'
    );
    if (confirmed) {
      uiLib.Toast.info({ title: 'Deleted', message: 'Record deleted.' });
    }
  };

  const showConfirmError = async () => {
    const confirmed = await uiLib.ModalHelpers.confirm(
      'Force Close?',
      'This will force close the application and you may lose unsaved data.',
      'error'
    );
    if (confirmed) {
      uiLib.Toast.error({ title: 'Forced Close', message: 'Application closed.' });
    }
  };

  const showConfirmModal = async () => {
    const confirmed = await uiLib.ModalHelpers.confirm(
      'Delete Record?',
      'Are you sure you want to delete this record? This action cannot be undone.'
    );
    if (confirmed) {
      uiLib.Toast.success({ title: 'Confirmed', message: 'Record deleted.' });
    } else {
      uiLib.Toast.info({ title: 'Cancelled', message: 'Action cancelled.' });
    }
  };

  const showSimpleForm = () => {
    const modal = new uiLib.Modal({
      title: 'Create Contact',
      message: 'Enter the contact details below.',
      fields: [
        { id: 'firstname', label: 'First Name', type: 'text', required: true, placeholder: 'Enter first name' },
        { id: 'lastname', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter last name' },
        { id: 'email', label: 'Email', type: 'email', placeholder: 'example@company.com' }
      ],
      buttons: [
        new uiLib.Button('Cancel', () => { }),
        new uiLib.Button('Create', () => {
          const data = modal.getFieldValues();
          uiLib.ModalHelpers.alert(
            'Form Data Submitted',
            formatJsonWithStyle(data)
          );
          uiLib.Toast.success({ title: 'Contact Created', message: `${data.firstname} ${data.lastname} has been created.` });
        }, true)
      ]
    });
    modal.show();
  };

  const showAllFieldTypes = () => {
    const modal = new uiLib.Modal({
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
              console.debug(...uiLib.UILIB, `${files.length} file(s) selected:`, files.map(f => f.name));
              uiLib.Toast.info({ title: 'Files Selected', message: `${files.length} file(s) ready to upload` });
            }
          }
        }
      ],
      buttons: [
        new uiLib.Button('Close', () => { }),
        new uiLib.Button('Submit', () => {
          const data = modal.getFieldValues();
          console.debug(...uiLib.UILIB, 'Form data:', data);
          uiLib.ModalHelpers.alert(
            'Form Data Submitted',
            formatJsonWithStyle(data)
          );
          uiLib.Toast.success({ title: 'Data Captured', message: 'All field values captured!' });
        }, true)
      ]
    });
    modal.show();
  };

  const showAddressLookupForm = () => {
    const modal = new uiLib.Modal({
      title: 'Create Contact with Address',
      size: 'large',
      fields: [
        { id: 'firstname', label: 'First Name', type: 'text', required: true, placeholder: 'Enter first name' },
        { id: 'lastname', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter last name' },
        { id: 'email', label: 'Email', type: 'email', placeholder: 'example@company.com' },

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
              console.debug(...uiLib.UILIB, 'Selected address:', address);
              uiLib.Toast.success({
                title: 'Address Selected',
                message: `${address.formattedAddress}`,
                duration: 5000
              });
            }
          }
        },

        // These fields will be auto-populated
        { id: 'address1_line1', label: 'Street', type: 'text' },
        { id: 'address1_city', label: 'City', type: 'text' },
        { id: 'address1_stateorprovince', label: 'State/Province', type: 'text' },
        { id: 'address1_postalcode', label: 'Postal Code', type: 'text' },
        { id: 'address1_country', label: 'Country', type: 'text' },
        { id: 'address1_latitude', label: 'Latitude', type: 'number' },
        { id: 'address1_longitude', label: 'Longitude', type: 'number' }
      ],
      buttons: [
        new uiLib.Button('Cancel', () => { }),
        new uiLib.Button('Create Contact', () => {
          const data = modal.getFieldValues();
          console.debug(...uiLib.UILIB, 'Contact data with address:', data);

          // Show result modal with formatted JSON
          uiLib.ModalHelpers.alert(
            'Form Data Submitted',
            formatJsonWithStyle(data)
          );

          uiLib.Toast.success({
            title: 'Contact Created',
            message: `${data.firstname} ${data.lastname} created with address in ${data.address1_city || 'N/A'}`
          });
          return true;
        }, true)
      ]
    });
    modal.show();
  };

  const showFieldGroupsModal = () => {
    const modal = new uiLib.Modal({
      title: 'New Contact with Field Groups',
      size: 'large',
      fields: [
        // Group without border - just title and divider
        {
          id: 'personalInfoGroup',
          type: 'group',
          label: 'Personal Information',
          content: 'Enter the contact\'s basic details below.',
          fields: [
            { id: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'Enter first name' },
            { id: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Enter last name' },
            { id: 'email', label: 'Email', type: 'email', placeholder: 'example@company.com' },
            { id: 'phone', label: 'Phone', type: 'text', placeholder: '+1 (555) 123-4567' }
          ]
        },
        // Group with border - card-like section
        {
          id: 'addressGroup',
          type: 'group',
          label: 'Address Details',
          content: 'Physical address information.',
          border: true,
          fields: [
            { id: 'street', label: 'Street', type: 'text', placeholder: '123 Main St' },
            { id: 'city', label: 'City', type: 'text', placeholder: 'New York' },
            { id: 'state', label: 'State/Province', type: 'text', placeholder: 'NY' },
            { id: 'postalCode', label: 'Postal Code', type: 'text', placeholder: '10001' }
          ]
        },
        // Collapsible group with border
        {
          id: 'preferencesGroup',
          type: 'group',
          label: 'Communication Preferences',
          content: 'Configure notification settings.',
          border: true,
          collapsible: true,
          defaultCollapsed: false,
          fields: [
            { id: 'emailNotifications', label: 'Email Notifications', type: 'switch', value: true },
            { id: 'smsNotifications', label: 'SMS Notifications', type: 'switch', value: false },
            { id: 'newsletter', label: 'Subscribe to Newsletter', type: 'checkbox', value: false }
          ]
        },
        // Collapsible group - starts collapsed
        {
          id: 'advancedGroup',
          type: 'group',
          label: 'Advanced Options',
          border: true,
          collapsible: true,
          defaultCollapsed: true,
          fields: [
            { id: 'notes', label: 'Notes', type: 'textarea', rows: 3, placeholder: 'Additional notes...' },
            { id: 'tags', label: 'Tags', type: 'text', placeholder: 'Comma-separated tags' }
          ]
        }
      ],
      buttons: [
        new uiLib.Button('Cancel', () => { }),
        new uiLib.Button('Create Contact', () => {
          const data = modal.getFieldValues();
          uiLib.ModalHelpers.alert(
            'Form Data Submitted',
            formatJsonWithStyle(data)
          );
          uiLib.Toast.success({ title: 'Contact Created', message: `${data.firstName} ${data.lastName} has been created.` });
        }, true)
      ]
    });
    modal.show();
  };

  const showTabsModal = () => {
    const modal = new uiLib.Modal({
      title: 'Account Settings',
      size: 'large',
      fields: [{
        id: 'tabs',
        fields: [
          {
            label: 'Profile', fields: [
              { id: 'name', label: 'Name', type: 'text', value: 'John Doe' },
              { id: 'email', label: 'Email', type: 'text', value: 'john@example.com' }
            ]
          },
          {
            label: 'Preferences', fields: [
              { id: 'notifications', label: 'Email Notifications', type: 'toggle', value: true },
              { id: 'theme', label: 'Theme', options: ['Light', 'Dark', 'Auto'], value: 'Light' }
            ]
          },
          {
            label: 'Security', fields: [
              { id: '2fa', label: 'Two-Factor Auth', type: 'toggle', value: false }
            ]
          }
        ],
        asTabs: true
      }],
      buttons: [
        new uiLib.Button('Cancel', () => { }),
        new uiLib.Button('Save', () => {
          const data = modal.getFieldValues();
          uiLib.ModalHelpers.alert(
            'Settings Saved',
            formatJsonWithStyle(data)
          );
          uiLib.Toast.success({ title: 'Settings Saved', message: 'Your preferences have been updated.' });
        }, true)
      ]
    });
    modal.show();
  };

  const showDraggableModal = () => {
    const modal = new uiLib.Modal({
      title: 'Draggable Dialog',
      message: 'Try dragging this modal by clicking and holding the header!',
      draggable: true,
      size: 'small',
      buttons: [new uiLib.Button('Close', () => { }, true)]
    });
    modal.show();
  };

  // Lookup handlers
  const showSimpleLookup = () => {
    uiLib.Lookup.open({
      entity: 'account',
      columns: ['name', 'accountnumber', 'telephone1', 'address1_city'],
      title: 'Select Account',
      onSelect: (records: any[]) => {
        uiLib.Toast.success({ title: 'Account Selected', message: `Selected: ${records.map((r: any) => r.name).join(', ')}` });
      }
    });
  };

  const showMultiSelectLookup = () => {
    uiLib.Lookup.open({
      entity: 'contact',
      columns: ['name', 'emailaddress1', 'telephone1'],
      multiSelect: true,
      title: 'Select Contacts (Multi-Select)',
      onSelect: (records: any[]) => {
        uiLib.Toast.success({ title: `${records.length} Contact(s) Selected`, message: `Selected: ${records.map((r: any) => r.name).join(', ')}` });
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

    const modal = new uiLib.Modal({
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
      buttons: [new uiLib.Button('Close', () => { }, true)]
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

    const modal = new uiLib.Modal({
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
        new uiLib.Button('Cancel', () => { }),
        new uiLib.Button('Process Selected', () => {
          const selected = modal.getFieldValue('contactTable');
          if (selected.length === 0) {
            uiLib.Toast.warn({ title: 'No Selection', message: 'Please select at least one contact' });
            return false;
          }
          uiLib.ModalHelpers.alert(
            'Selected Contacts',
            formatJsonWithStyle(selected)
          );
          uiLib.Toast.success({ title: 'Processing Complete', message: `Processed ${selected.length} contact(s)` });
          return true;
        }, true)
      ]
    });
    modal.show();
  };

  // Product Validation Dialog - Real-world Example
  const showProductValidationDialog = () => {
    // Mock product issues data - simplified without HTML first
    const mockIssues = [
      {
        id: 1,
        status: '1',
        product: 'Surface Laptop 5',
        reason: 'Product is inactive and must be activated or replaced'
      },
      {
        id: 2,
        status: '2',
        product: 'Azure Cloud Services',
        reason: 'Product is not synchronized with Business Central'
      },
      {
        id: 3,
        status: '3',
        product: '[SAMPLE] Placeholder Product',
        reason: 'Placeholder product must be replaced with actual product'
      }
    ];

    const modal = new uiLib.Modal({
      title: 'Product Validation Required',
      message: 'You cannot win this quote because the following products have issues. Please review and resolve before proceeding.',
      size: { width: 800, height: 450 },
      fields: [
        {
          id: 'productsTable',
          type: 'table',
          tableColumns: [
            {
              id: 'status',
              header: 'Status',
              visible: true,
              sortable: false,
              width: '80px',
              align: 'center'
            },
            {
              id: 'product',
              header: 'Product',
              visible: true,
              sortable: false,
              width: '40%'
            },
            {
              id: 'reason',
              header: 'Reason',
              visible: true,
              sortable: false,
              width: 'auto'
            }
          ],
          data: mockIssues,
          selectionMode: 'none'
        }
      ],
      buttons: [
        new uiLib.Button({
          label: 'Notify Product Manager',
          callback: () => {
            uiLib.Toast.success({ title: 'Notification Sent', message: 'Product manager has been notified' });
            return true;
          },
          id: 'notifyBtn'
        }),
        new uiLib.Button({
          label: 'Close',
          callback: () => true,
          setFocus: true,
          id: 'closeBtn'
        })
      ]
    });
    modal.show();
  };

  // Advanced Table with Formatting and Styled Cells
  const showAdvancedTableDemo = () => {
    const salesData = [
      { 
        id: 1, 
        vendor: 'Contoso Ltd', 
        accountNumber: '300045',
        productCount: 12,
        totalValue: 15234.89,
        margin: 0.3245,
        lastOrder: '2026-01-15',
        status: 'Active',
        action: '<a href="#" style="color: #0078d4; text-decoration: underline;">View Existing Quote</a>'
      },
      { 
        id: 2, 
        vendor: 'Fabrikam Inc', 
        accountNumber: '505444',
        productCount: 8,
        totalValue: 8920.50,
        margin: 0.1512,
        lastOrder: '2026-02-01',
        status: 'Pending',
        action: '<a href="#" style="color: #0078d4; text-decoration: underline;">View Existing Quote</a>'
      },
      { 
        id: 3, 
        vendor: 'Adventure Works', 
        accountNumber: '612305',
        productCount: 25,
        totalValue: 32150.00,
        margin: 0.4120,
        lastOrder: '2025-12-20',
        status: 'Active',
        action: '<a href="#" style="color: #0078d4; text-decoration: underline;">View Existing Quote</a>'
      },
      { 
        id: 4, 
        vendor: 'Northwind Traders', 
        accountNumber: '789012',
        productCount: 5,
        totalValue: 4567.25,
        margin: 0.2890,
        lastOrder: '2026-01-28',
        status: 'Inactive',
        action: '<span style="color: #a4262c;">No quotes</span>'
      }
    ];

    const modal = new uiLib.Modal({
      title: 'Sales Report',
      message: 'Select vendors to create bulk quotes (inactive vendors cannot be selected)',
      size: 'large',
      fields: [
        {
          id: 'salesTable',
          type: 'table',
          tableColumns: [
            {
              id: 'vendor',
              header: 'Vendor Name',
              visible: true,
              sortable: true,
              width: '200px',
              align: 'left'
            },
            {
              id: 'accountNumber',
              header: 'Account #',
              visible: true,
              sortable: true,
              width: '120px',
              align: 'left'
            },
            {
              id: 'productCount',
              header: 'Products',
              visible: true,
              sortable: true,
              width: '100px',
              align: 'center',
              format: 'number'
            },
            {
              id: 'totalValue',
              header: 'Total Value',
              visible: true,
              sortable: true,
              width: '120px',
              align: 'right',
              format: 'currency'
            },
            {
              id: 'margin',
              header: 'Margin',
              visible: true,
              sortable: true,
              width: '100px',
              align: 'right',
              format: 'percent'
            },
            {
              id: 'lastOrder',
              header: 'Last Order',
              visible: true,
              sortable: true,
              width: '120px',
              align: 'left',
              format: 'date'
            },
            {
              id: 'status',
              header: 'Status',
              visible: true,
              sortable: true,
              width: '100px',
              align: 'center'
            },
            {
              id: 'action',
              header: 'Action',
              visible: true,
              sortable: false,
              width: '180px',
              align: 'left'
            }
          ],
          data: salesData,
          selectionMode: 'multiple',
          isRowSelectable: (row: any) => row.status !== 'Inactive',
          onRowSelect: (selectedRows: any[]) => {
            console.debug('Selected vendors:', selectedRows);
          }
        }
      ],
      buttons: [
        new uiLib.Button({
          label: 'Create Quotes',
          callback: function() {
            const modal = this as any;
            const selected = modal.getFieldValue('salesTable');
            const selectedRows = salesData.filter((row: any) => 
              selected && selected.includes(row.id)
            );
            
            if (!selectedRows || selectedRows.length === 0) {
              uiLib.Toast.warn({ 
                title: 'No Selection', 
                message: 'Please select vendors to create quotes' 
              });
              return false;
            }

            uiLib.Toast.success({ 
              title: 'Quotes Created', 
              message: `Created ${selectedRows.length} quote(s) for selected vendors` 
            });
            return true;
          },
          setFocus: true,
          id: 'createBtn'
        }),
        new uiLib.Button({
          label: 'Close',
          callback: () => true,
          id: 'closeBtn'
        })
      ]
    });
    modal.show();
  };

  // File Upload Demo with Drag & Drop
  const showFileUploadDemo = () => {
    const modal = new uiLib.Modal({
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
              console.debug(...uiLib.UILIB, 'Files selected:', files.map(f => ({ name: f.name, size: f.size })));
              const totalSize = files.reduce((sum, f) => sum + f.size, 0);
              const totalMB = (totalSize / 1048576).toFixed(2);
              uiLib.Toast.info({
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
        new uiLib.Button('Cancel', () => { }),
        new uiLib.Button('Upload', () => {
          const documents = modal.getFieldValue('documents');
          const images = modal.getFieldValue('images');
          const description = modal.getFieldValue('description');

          if (!documents || documents.length === 0) {
            uiLib.Toast.error({ title: 'No Documents', message: 'Please select at least one document to upload' });
            return false;
          }

          console.debug(...uiLib.UILIB, 'Uploading files:', {
            documents: documents.map(f => f.name),
            images: images?.map(f => f.name) || [],
            description
          });

          uiLib.Toast.success({
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

  // SideCart Demo
  const showSideCartDemo = () => {
    const modal = new uiLib.Modal({
      title: 'Product Details',
      size: 'large',
      sideCart: {
        enabled: true,
        position: 'left',
        width: 280,
        imageUrl: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWBrzy?ver=85d4',
        backgroundColor: '#f3f2f1',
        content: `
          <div style="padding: 16px;">
            <h3 style="margin: 0 0 12px 0; color: #323130;">Surface Laptop 5</h3>
            <p style="color: #605e5c; font-size: 13px; margin: 0 0 16px 0;">The perfect everyday laptop with a stunning touchscreen display.</p>
            <div style="background: #fff; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
              <div style="font-size: 24px; font-weight: 600; color: #0078d4;">$1,299.00</div>
              <div style="font-size: 12px; color: #107c10;">✓ In Stock</div>
            </div>
            <ul style="padding-left: 20px; margin: 0; color: #605e5c; font-size: 13px;">
              <li>13.5" PixelSense Display</li>
              <li>Intel Core i7</li>
              <li>16GB RAM / 512GB SSD</li>
              <li>Up to 18 hours battery</li>
            </ul>
          </div>
        `
      },
      fields: [
        { id: 'quantity', label: 'Quantity', type: 'number', value: 1, required: true },
        { id: 'color', label: 'Color', type: 'select', displayMode: 'badges', options: ['Platinum', 'Matte Black', 'Sage', 'Sandstone'], value: 'Platinum' },
        { id: 'warranty', label: 'Extended Warranty', type: 'switch', value: false },
        { id: 'notes', label: 'Order Notes', type: 'textarea', rows: 3, placeholder: 'Special instructions...' }
      ],
      buttons: [
        new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
        new uiLib.Button({
          label: 'Add to Cart',
          callback: () => {
            const data = modal.getFieldValues();
            uiLib.Toast.success({ title: 'Added to Cart', message: `${data.quantity}x Surface Laptop 5 (${data.color})` });
            return true;
          },
          setFocus: true,
          id: 'addBtn'
        })
      ]
    });
    modal.show();
  };

  // AutoSave Demo
  const showAutoSaveDemo = () => {
    const modal = new uiLib.Modal({
      title: 'Draft Email (Auto-Saved)',
      size: 'medium',
      autoSave: true,
      autoSaveKey: 'demo-email-draft',
      message: 'Your changes are automatically saved. Close and reopen to see restored values.',
      fields: [
        { id: 'to', label: 'To', type: 'email', required: true, placeholder: 'recipient@example.com' },
        { id: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Enter subject...' },
        { id: 'priority', label: 'Priority', type: 'select', displayMode: 'badges', options: ['Low', 'Normal', 'High', 'Urgent'], value: 'Normal' },
        { id: 'body', label: 'Message', type: 'textarea', rows: 6, placeholder: 'Type your message here...' }
      ],
      buttons: [
        new uiLib.Button({
          label: 'Clear Draft',
          callback: () => {
            modal.clearAutoSave();
            uiLib.Toast.info({ title: 'Draft Cleared', message: 'Auto-saved data has been removed.' });
            return true;
          },
          id: 'clearBtn'
        }),
        new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
        new uiLib.Button({
          label: 'Send',
          callback: () => {
            const data = modal.getFieldValues();
            modal.clearAutoSave();
            uiLib.Toast.success({ title: 'Email Sent', message: `Sent to ${data.to}` });
            return true;
          },
          setFocus: true,
          id: 'sendBtn'
        })
      ]
    });
    modal.show();
  };

  // Loading with Progress Demo
  const showLoadingProgressDemo = async () => {
    const modal = new uiLib.Modal({
      title: 'Data Sync',
      message: 'Click "Start Sync" to see the loading progress animation.',
      fields: [
        { id: 'syncType', label: 'Sync Type', type: 'select', displayMode: 'badges', options: ['Accounts', 'Contacts', 'Products', 'All'], value: 'All' }
      ],
      buttons: [
        new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
        new uiLib.Button({
          label: 'Start Sync',
          callback: async () => {
            const steps = ['Connecting...', 'Syncing Accounts...', 'Syncing Contacts...', 'Syncing Products...', 'Finalizing...'];

            for (let i = 0; i < steps.length; i++) {
              const progress = Math.round(((i + 1) / steps.length) * 100);
              modal.setLoading(true, { message: steps[i], progress });
              await new Promise(resolve => setTimeout(resolve, 800));
            }

            modal.setLoading(false);
            uiLib.Toast.success({ title: 'Sync Complete', message: 'All data synchronized successfully!', sound: true });
            return true;
          },
          setFocus: true,
          id: 'syncBtn'
        })
      ]
    });
    modal.show();
  };

  // ModalHelpers Demo
  const showAlertDemo = async () => {
    await uiLib.ModalHelpers.alert('Welcome!', 'This is a simple alert message using ModalHelpers.');
    uiLib.Toast.info({ title: 'Alert Closed', message: 'User acknowledged the alert.' });
  };

  const showConfirmDemo = async () => {
    const confirmed = await uiLib.ModalHelpers.confirm('Delete Record?', 'This action cannot be undone. Are you sure you want to proceed?', 'warning');
    if (confirmed) {
      uiLib.Toast.success({ title: 'Confirmed', message: 'User chose to proceed.' });
    } else {
      uiLib.Toast.info({ title: 'Cancelled', message: 'User cancelled the action.' });
    }
  };

  const showPromptDemo = async () => {
    const name = await uiLib.ModalHelpers.prompt('Enter Your Name', 'What should we call you?', 'Guest');
    if (name) {
      uiLib.Toast.success({ title: 'Hello!', message: `Nice to meet you, ${name}!` });
    } else {
      uiLib.Toast.info({ title: 'Cancelled', message: 'No name was entered.' });
    }
  };

  // Field Groups Demo
  const showFieldGroupsDemo = () => {
    const modal = new uiLib.Modal({
      title: 'Customer Profile',
      size: 'large',
      fields: [
        {
          id: 'personalInfo',
          type: 'group',
          label: 'Personal Information',
          description: 'Basic customer details',
          collapsible: true,
          collapsed: false,
          border: true,
          fields: [
            { id: 'firstName', label: 'First Name', type: 'text', required: true },
            { id: 'lastName', label: 'Last Name', type: 'text', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true },
            { id: 'phone', label: 'Phone', type: 'tel' }
          ]
        },
        {
          id: 'addressInfo',
          type: 'group',
          label: 'Address',
          description: 'Shipping and billing address',
          collapsible: true,
          collapsed: true,
          border: true,
          fields: [
            { id: 'street', label: 'Street', type: 'text' },
            { id: 'city', label: 'City', type: 'text' },
            { id: 'state', label: 'State', type: 'text' },
            { id: 'zip', label: 'Postal Code', type: 'text' }
          ]
        },
        {
          id: 'preferences',
          type: 'group',
          label: 'Preferences',
          description: 'Communication settings',
          collapsible: true,
          collapsed: true,
          border: true,
          fields: [
            { id: 'newsletter', label: 'Subscribe to Newsletter', type: 'switch', value: true },
            { id: 'sms', label: 'SMS Notifications', type: 'switch', value: false },
            { id: 'language', label: 'Preferred Language', type: 'select', options: ['English', 'Spanish', 'French', 'German'], value: 'English' }
          ]
        }
      ],
      buttons: [
        new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
        new uiLib.Button({
          label: 'Save Profile',
          callback: () => {
            const data = modal.getFieldValues();
            console.debug('Profile data:', data);
            uiLib.Toast.success({ title: 'Profile Saved', message: `${data.firstName} ${data.lastName}'s profile has been saved.` });
            return true;
          },
          setFocus: true,
          requiresValidation: true,
          id: 'saveBtn'
        })
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

    const modal = new uiLib.Modal({
      title: '🧙 Complete Showcase - All Features',
      message: 'This wizard demonstrates EVERY field type, validation pattern, and feature available in the UI Library.',
      content: '<div style="padding: 12px; background: #f3f2f1; border-radius: 4px; margin-bottom: 8px;"><strong>📚 Feature Coverage:</strong> Text inputs, numbers, dates, switches, checkboxes, sliders, dropdowns, lookups, tables, file uploads, address autocomplete, D365 option sets, conditional visibility, conditional validation, and more!</div>',
      size: 'large',
      draggable: true,
      progress: {
        enabled: true,
        type: 'steps-left',
        currentStep: 1,
        totalSteps: 8,
        allowStepNavigation: true,
        steps: [
          {
            id: 'step1',
            label: 'Text Inputs',
            message: 'Text Input Variations - All HTML5 input types with validation',
            content: '<div style="padding: 10px; background: #f3f2f1; border-radius: 4px; margin-bottom: 12px;"><strong>🔤 Demonstrating:</strong> text, email, tel, password, url, and search input types. Notice the <code>required</code> validation (red border when empty and touched), <code>placeholder</code> text, and <code>tooltip</code> on hover.</div>',
            fields: [
              { id: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'John Smith', tooltip: 'Enter your full legal name' },
              { id: 'emailAddress', label: 'Email', type: 'email', required: true, placeholder: 'john@example.com' },
              { id: 'phoneNumber', label: 'Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },
              { id: 'websiteUrl', label: 'Website', type: 'url', placeholder: 'https://example.com' },
              { id: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Enter secure password' },
              { id: 'searchQuery', label: 'Search', type: 'search', placeholder: 'Type to search...' }
            ]
          },
          {
            id: 'step2',
            label: 'Numbers & Dates',
            message: 'Numeric Inputs, Date Pickers, and Range Sliders',
            content: '<div style="padding: 10px; background: #f3f2f1; border-radius: 4px; margin-bottom: 12px;"><strong>🔢 Demonstrating:</strong> <code>type="number"</code> with validation, <code>type="date"</code> for date selection, and <code>type="range"</code> sliders with <code>showValue</code> display. Sliders use <code>extraAttributes</code> for min/max/step values.</div>',
            fields: [
              { id: 'age', label: 'Age', type: 'number', required: true, placeholder: 'Enter age', value: 30 },
              { id: 'salary', label: 'Annual Salary ($)', type: 'number', placeholder: '50000' },
              { id: 'birthDate', label: 'Birth Date', type: 'date', required: true },
              { id: 'startDate', label: 'Start Date', type: 'date' },
              { id: 'priority', label: 'Priority Level', type: 'range', value: 5, showValue: true, extraAttributes: { min: 1, max: 10, step: 1 } },
              { id: 'completion', label: 'Completion %', type: 'range', value: 75, showValue: true, extraAttributes: { min: 0, max: 100, step: 5 } }
            ]
          },
          {
            id: 'step3',
            label: 'Switches & Checkboxes',
            message: 'Boolean Inputs - Modern Switches vs Native D365 Checkboxes',
            content: '<div style="padding: 10px; background: #f3f2f1; border-radius: 4px; margin-bottom: 12px;"><strong>✅ Demonstrating:</strong> <code>type="switch"</code> for modern toggle switches (Fluent UI) and <code>type="checkbox"</code> for native D365-style checkboxes. Both support <code>required</code> validation and <code>tooltip</code> hints.</div>',
            fields: [
              { id: 'isActive', label: 'Account Active', type: 'switch', value: true, tooltip: 'Toggle to activate/deactivate' },
              { id: 'sendEmail', label: 'Send Email Notifications', type: 'switch', value: false },
              { id: 'termsAccepted', label: 'Accept Terms & Conditions', type: 'checkbox', required: true },
              { id: 'newsletterOptIn', label: 'Subscribe to Newsletter', type: 'checkbox' },
              { id: 'privacyConsent', label: 'Privacy Policy Consent', type: 'checkbox', required: true }
            ]
          },
          {
            id: 'step4',
            label: 'Dropdowns & Option Sets',
            message: 'Static Dropdowns vs Auto-Fetched D365 Option Sets with Badge Display',
            content: '<div style="padding: 10px; background: #f3f2f1; border-radius: 4px; margin-bottom: 12px;"><strong>📋 Demonstrating:</strong> Standard <code>type="select"</code> with hardcoded <code>options</code> array, AND <code>optionSet</code> property that automatically fetches option set metadata from Dynamics 365 Web API. The Industry Code field uses <code>displayMode="badges"</code> to show options as clickable badges instead of a dropdown!</div>',
            fields: [
              { id: 'country', label: 'Country', type: 'select', required: true, options: ['USA', 'Canada', 'UK', 'Australia', 'New Zealand'], placeholder: 'Select country' },
              { id: 'department', label: 'Department', type: 'select', displayMode: 'badges', options: ['Sales', 'Marketing', 'Engineering', 'HR', 'Finance'] },
              {
                id: 'accountCategory',
                label: 'Account Category (D365)',
                type: 'select',
                optionSet: {
                  entityName: 'account',
                  attributeName: 'accountcategorycode',
                  includeNull: true,
                  sortByLabel: true
                },
                tooltip: 'Fetched from Dynamics 365 option set - dropdown style'
              },
              {
                id: 'industryCode',
                label: 'Industry Code (D365 Badges)',
                type: 'select',
                displayMode: 'badges',
                optionSet: {
                  entityName: 'account',
                  attributeName: 'industrycode',
                  includeNull: true,
                  sortByLabel: true
                },
                tooltip: 'Fetched from Dynamics 365 option set - badge display mode'
              }
            ]
          },
          {
            id: 'step5',
            label: 'D365 Lookup',
            message: 'Dynamics 365 Entity Lookup with Auto-Population',
            content: '<div style="padding: 10px; background: #f3f2f1; border-radius: 4px; margin-bottom: 12px;"><strong>🔍 Demonstrating:</strong> <code>type="lookup"</code> with inline D365-style dropdown that searches entities. Uses <code>lookupColumns</code> to specify which attributes to fetch and display. The <code>onChange</code> callback auto-populates related fields below using <code>modal.setFieldValue()</code>.</div>',
            fields: [
              {
                id: 'accountLookup',
                label: 'Select Account',
                type: 'lookup',
                entityName: 'account',
                lookupColumns: [
                  { attribute: 'name', label: 'Account Name' },
                  { attribute: 'accountnumber', label: 'Number' },
                  { attribute: 'emailaddress1', label: 'Email' },
                  { attribute: 'telephone1', label: 'Phone' }
                ],
                placeholder: 'Search for account...',
                onChange: function (value) {
                  if (value && value.id) {
                    modal.setFieldValue('accName', value.record?.name || '');
                    modal.setFieldValue('accNumber', value.record?.accountnumber || '');
                    modal.setFieldValue('accEmail', value.record?.emailaddress1 || '');
                    modal.setFieldValue('accPhone', value.record?.telephone1 || '');
                  } else {
                    modal.setFieldValue('accName', '');
                    modal.setFieldValue('accNumber', '');
                    modal.setFieldValue('accEmail', '');
                    modal.setFieldValue('accPhone', '');
                  }
                }
              },
              { id: 'accName', label: '→ Name', type: 'text', readOnly: true, placeholder: 'Auto-populated' },
              { id: 'accNumber', label: '→ Number', type: 'text', readOnly: true, placeholder: 'Auto-populated' },
              { id: 'accEmail', label: '→ Email', type: 'email', readOnly: true, placeholder: 'Auto-populated' },
              { id: 'accPhone', label: '→ Phone', type: 'tel', readOnly: true, placeholder: 'Auto-populated' }
            ]
          },
          {
            id: 'step6',
            label: 'Data Table',
            message: 'Interactive Data Table with Sorting and Multi-Selection',
            content: '<div style="padding: 10px; background: #f3f2f1; border-radius: 4px; margin-bottom: 12px;"><strong>📊 Demonstrating:</strong> <code>type="table"</code> with sortable columns (click headers), multi-row selection, and <code>onRowSelect</code> callback. Uses <code>tableColumns</code> for column config and <code>data</code> array for rows. Table fields use <code>selectionMode</code> property: "none", "single", or "multiple".</div>',
            fields: [
              {
                id: 'productTable',
                label: 'Select Products',
                type: 'table',
                tableColumns: [
                  { id: 'product', header: 'Product', visible: true, sortable: true, width: '250px' },
                  { id: 'category', header: 'Category', visible: true, sortable: true, width: '150px' },
                  { id: 'price', header: 'Price', visible: true, sortable: true, width: '100px', align: 'right' },
                  { id: 'stock', header: 'Stock', visible: true, sortable: true, width: '100px', align: 'right' }
                ],
                data: productData,
                selectionMode: 'multiple'
              }
            ]
          },
          {
            id: 'step7',
            label: 'Address Lookup Test',
            message: 'Address Autocomplete with Google/Azure Maps API Integration',
            content: '<div style="padding: 12px; background: #fff4ce; border-radius: 4px; border-left: 4px solid #ffb900; margin-bottom: 12px;"><strong>🗺️ Demonstrating:</strong> <code>type="addressLookup"</code> with Google Maps or Azure Maps autocomplete. <strong>⚠️ Testing Instructions:</strong> Enter your API key below to enable address search. The key is <strong>only used in your browser</strong> for this session - NOT stored or transmitted to any server. Address fields use <code>visibleWhen</code> conditional visibility to appear only after API key is entered.</div>',
            fields: [
              {
                id: 'mapsProvider',
                label: 'Maps Provider',
                type: 'select',
                options: ['google', 'azure'],
                value: 'google',
                required: true,
                tooltip: 'Choose between Google Maps or Azure Maps API'
              },
              {
                id: 'mapsApiKey',
                label: 'API Key',
                type: 'password',
                required: true,
                placeholder: 'Enter your Maps API key',
                tooltip: 'Your API key is only used in your browser - not stored or sent to any server'
              },
              {
                id: 'testAddressLookup',
                label: 'Search Address',
                type: 'addressLookup',
                placeholder: 'Start typing an address...',
                addressLookup: {
                  provider: '{{mapsProvider}}' as any,
                  apiKey: '{{mapsApiKey}}',
                  componentRestrictions: { country: ['nz', 'au', 'us', 'gb'] },
                  fields: {
                    street: 'street',
                    city: 'city',
                    state: 'state',
                    postalCode: 'postalCode',
                    country: 'country',
                    latitude: 'lat',
                    longitude: 'lng'
                  },
                  onSelect: (address) => {
                    console.debug('Selected address:', address);
                  }
                },
                visibleWhen: { field: 'mapsApiKey', operator: 'truthy' }
              },
              { id: 'street', label: '→ Street', type: 'text', readOnly: true, visibleWhen: { field: 'mapsApiKey', operator: 'truthy' } },
              { id: 'city', label: '→ City', type: 'text', readOnly: true, visibleWhen: { field: 'mapsApiKey', operator: 'truthy' } },
              { id: 'state', label: '→ State', type: 'text', readOnly: true, visibleWhen: { field: 'mapsApiKey', operator: 'truthy' } },
              { id: 'postalCode', label: '→ Postal Code', type: 'text', readOnly: true, visibleWhen: { field: 'mapsApiKey', operator: 'truthy' } },
              { id: 'country', label: '→ Country', type: 'text', readOnly: true, visibleWhen: { field: 'mapsApiKey', operator: 'truthy' } },
              { id: 'lat', label: '→ Latitude', type: 'text', readOnly: true, visibleWhen: { field: 'mapsApiKey', operator: 'truthy' } },
              { id: 'lng', label: '→ Longitude', type: 'text', readOnly: true, visibleWhen: { field: 'mapsApiKey', operator: 'truthy' } }
            ]
          },
          {
            id: 'step8',
            label: 'Files & Advanced',
            message: 'File Uploads, Text Areas, and Conditional Validation',
            content: '<div style="padding: 10px; background: #f3f2f1; border-radius: 4px; margin-bottom: 12px;"><strong>📎 Demonstrating:</strong> <code>type="file"</code> with drag-and-drop, file size/type restrictions, and <code>fileUpload</code> configuration. Also <code>type="textarea"</code> with <code>rows</code> setting. Toggle "Requires Manager Approval" to see <code>visibleWhen</code> (conditional visibility) and <code>requiredWhen</code> (conditional validation) - the approval fields only appear AND become required when the switch is ON.</div>',
            fields: [
              {
                id: 'documents',
                label: 'Upload Documents',
                type: 'file',
                fileUpload: {
                  accept: '.pdf,.doc,.docx,.xls,.xlsx',
                  maxFiles: 5,
                  maxSize: 10485760,
                  multiple: true,
                  dragDropText: 'Drag and drop files here',
                  browseText: 'or click to browse',
                  onFilesSelected: (files) => console.debug('Files:', files)
                }
              },
              { id: 'description', label: 'Description', type: 'textarea', required: true, rows: 4, placeholder: 'Enter detailed description...' },
              {
                id: 'needsApproval',
                label: 'Requires Manager Approval',
                type: 'switch',
                value: false,
                tooltip: 'Toggle to show approval fields'
              },
              {
                id: 'approverName',
                label: 'Approver Name',
                type: 'text',
                requiredWhen: { field: 'needsApproval', operator: 'truthy' },
                visibleWhen: { field: 'needsApproval', operator: 'truthy' },
                placeholder: 'Enter manager name'
              },
              {
                id: 'approverEmail',
                label: 'Approver Email',
                type: 'email',
                requiredWhen: { field: 'needsApproval', operator: 'truthy' },
                visibleWhen: { field: 'needsApproval', operator: 'truthy' },
                placeholder: 'manager@example.com'
              },
              { id: 'comments', label: 'Additional Comments', type: 'textarea', rows: 3, placeholder: 'Optional feedback...' }
            ]
          }
        ]
      },
      buttons: [
        new uiLib.Button('Cancel', () => { }),
        new uiLib.Button('⬅️ Previous', () => {
          modal.previousStep();
          return false;
        }),
        new uiLib.Button('Next ➡️', () => {
          modal.nextStep();
          return false;
        }, true),
        new uiLib.Button({
          label: 'Finish',
          callback: () => {
            const allData = modal.getFieldValues();
            const selectedProducts = modal.getFieldValue('productTable') || [];

            console.debug('📦 Complete Wizard Data:', allData);
            console.debug('✅ Selected Products:', selectedProducts);

            const summary = {
              ...allData,
              selectedProducts: selectedProducts,
              productCount: selectedProducts.length
            };

            uiLib.ModalHelpers.alert(
              '🎉 Complete Showcase Finished!',
              formatJsonWithStyle(summary)
            );

            uiLib.Toast.success({
              title: '🎉 All Features Tested!',
              message: `${selectedProducts.length} product(s) selected | ${allData.documents?.length || 0} file(s) uploaded`,
              duration: 6000,
              sound: true
            });
            return true;
          },
          setFocus: true,
          requiresValidation: true,
          validateAllSteps: true,
          id: 'finishBtn'
        })
      ]
    });
    modal.show();
  };

  // Show welcome toast on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      uiLib.Toast.info({
        title: 'Welcome!',
        message: 'Try the buttons to see Toast notifications and Modal dialogs in action.',
        duration: 6000
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout currentPage="demo" version={typeof PACKAGE_VERSION !== 'undefined' ? PACKAGE_VERSION : undefined}>
      <div className="ui-lib-d365-page-title">
        <h1 className="ui-lib-d365-page-title__heading">Interactive Demo</h1>
        <p className="ui-lib-d365-page-title__subtitle">
          Explore all the UI components available in the err403 UI Library for Dynamics 365 CE
        </p>
      </div>

      <div className="ui-lib-d365-card-grid">
        {/* Toast Notifications */}
        <Card
          title="Toast Notifications"
          badge="ready"
          description="Toast notifications with auto-dismiss, stacking, and optional sound alerts."
          code={`// Success Toast
uiLib.Toast.success({
  title: "Account Saved",
  message: "The account has been updated successfully.",
  duration: 5000,
  sound: true
});

// Error Toast
uiLib.Toast.error({
  title: "Operation Failed",
  message: "Unable to save. Please try again.",
  duration: 6000
});

// Warning Toast
uiLib.Toast.warn({
  title: "Warning",
  message: "Some fields are missing.",
  duration: 5000
});

// Info Toast
uiLib.Toast.info({
  title: "Information",
  message: "System maintenance tonight at 10 PM.",
  duration: 7000
});`}
        >
          <Section title="Basic Toasts">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--success" onClick={showSuccessToast}>Success</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--error" onClick={showErrorToast}>Error</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--warning" onClick={showWarnToast}>Warning</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={showInfoToast}>Info</button>
            </div>
          </Section>
          <Section title="With Sound">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--success" onClick={showToastWithSound}>Success + Sound</button>
            </div>
          </Section>
        </Card>

        {/* Logger Utility */}
        <Card
          title="Logger Utility"
          badge="ready"
          description="Consistent console logging with styled prefixes for debugging."
          code={`// Debug/Trace logs
console.debug(...uiLib.TRACE, "Debug message", { userId: 123 });

// Warning logs
console.warn(...uiLib.WAR, "Warning message");

// Error logs
console.error(...uiLib.ERR, "Error message", new Error("Sample"));`}
        >
          <Section title="Log Types">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={logTrace}>Log TRACE</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--warning" onClick={logWarning}>Log WAR</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--error" onClick={logError}>Log ERR</button>
            </div>
          </Section>
          <div className="ui-lib-d365-note ui-lib-d365-note--info">
            <span className="ui-lib-d365-note__icon">ℹ️</span>
            <span>Open the browser console (F12) to see styled log outputs.</span>
          </div>
        </Card>

        {/* Modal Dialogs */}
        <Card
          title="Modal Dialogs"
          badge="ready"
          description="Modals with forms, validation, wizard navigation, tabs, and conditional field visibility."
          code={`// Alert Modal
uiLib.Modal.alert('Success', 'Changes saved successfully.');

// Confirm Modal  
const confirmed = await uiLib.Modal.confirm('Delete Record?', 'This action cannot be undone.');

// Form Modal with Fields
const modal = new uiLib.Modal({
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
    new uiLib.Button('Cancel', () => {}),
    new uiLib.Button('Save', () => {
      const data = modal.getFieldValues();
      console.debug('Saved:', data);
      return true;
    }, true)
  ]
});
modal.show();

// Address Lookup with Google Maps
const addressModal = new uiLib.Modal({
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
          console.debug('Selected:', address.formattedAddress);
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
const uploadModal = new uiLib.Modal({
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
          console.debug('Selected:', files);
        }
      }
    }
  ]
});`}
        >
          <Section title="Basic Modals">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={showAlertSuccess}>✅ Success Alert</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={showAlertInfo}>ℹ️ Info Alert</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={showAlertWarning}>⚠️ Warning Alert</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={showAlertError}>❌ Error Alert</button>
            </div>
            <div className="ui-lib-d365-btn-group" style={{ marginTop: '12px' }}>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--secondary" onClick={showConfirmSuccess}>✅ Success Confirm</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--secondary" onClick={showConfirmWarning}>⚠️ Warning Confirm</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--secondary" onClick={showConfirmError}>❌ Error Confirm</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--secondary" onClick={showConfirmModal}>❓ Question Confirm</button>
            </div>
          </Section>
          <Section title="Form Modals">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={showSimpleForm}>Simple Form</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={showAllFieldTypes}>All Field Types</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary ui-lib-d365-btn--highlight" onClick={showAddressLookupForm}>📍 Address Lookup</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary ui-lib-d365-btn--highlight" onClick={showFileUploadDemo}>📎 File Upload</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary ui-lib-d365-btn--highlight" onClick={showFieldGroupsModal}>📦 Field Groups</button>
            </div>
          </Section>
          <Section title="Advanced Features">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--secondary" onClick={showTabsModal}>Tabs</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--secondary" onClick={showDraggableModal}>Draggable</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--secondary ui-lib-d365-btn--highlight" onClick={showComprehensiveDemo}>🎯 Complete Showcase</button>
            </div>
          </Section>
        </Card>

        {/* Lookup Component */}
        <Card
          title="Lookup Component"
          badge="ready"
          description="Advanced entity record lookup with search, pagination, and sorting."
          code={`// Simple Lookup
uiLib.Lookup.open({
  entity: 'account',
  title: 'Select Account',
  columns: ['name', 'emailaddress1', 'telephone1'],
  onSelect: (selected) => {
    console.debug('Selected:', selected);
  }
});

// Multi-Select Lookup
uiLib.Lookup.open({
  entity: 'contact',
  title: 'Select Contacts',
  allowMultiSelect: true,
  columns: ['fullname', 'emailaddress1', 'jobtitle'],
  onSelect: (selected) => {
    console.debug('Selected contacts:', selected);
  }
});`}
        >
          <Section title="Lookup Types">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={showSimpleLookup}>Simple Lookup</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={showMultiSelectLookup}>Multi-Select</button>
            </div>
          </Section>
          <div className="ui-lib-d365-note ui-lib-d365-note--warning">
            <span className="ui-lib-d365-note__icon">⚠️</span>
            <span>Lookup uses mock data in demo. In D365, it fetches real entity records.</span>
          </div>
        </Card>

        {/* Table Component */}
        <Card
          title="Table Component"
          badge="ready"
          description="Display tabular data with sortable columns and row selection."
          code={`// Simple table in modal
const modal = new uiLib.Modal({
  title: 'Product Catalog',
  size: 'large',
  fields: [
    {
      id: 'productsTable',
      type: 'table',
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
        console.debug('Selected:', selectedRows);
      }
    }
  ]
});

// Real-world example: Product Validation Dialog
const validationModal = new uiLib.Modal({
  title: 'Product Validation Required',
  message: 'The following products have issues that must be resolved.',
  size: { width: 800, height: 450 },
  fields: [
    {
      id: 'productsTable',
      type: 'table',
      data: [
        {
          id: 1,
          status: '⛔',
          product: 'Surface Laptop 5',
          reason: 'Product is inactive and must be activated'
        },
        {
          id: 2,
          status: '🚫',
          product: 'Azure Services',
          reason: 'Not synchronized with Business Central'
        }
      ],
      tableColumns: [
        { id: 'status', header: 'Status', visible: true, width: '80px', align: 'center' },
        { id: 'product', header: 'Product', visible: true, sortable: true },
        { id: 'reason', header: 'Reason', visible: true, sortable: true }
      ],
      selectionMode: 'none'
    }
  ],
  buttons: [
    new uiLib.Button({ label: 'Notify Manager', callback: () => true }),
    new uiLib.Button({ label: 'Close', callback: () => true, setFocus: true })
  ]
});`}
        >
          <Section title="Table Types">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={showSimpleTable}>Simple Table</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={showTableWithSelection}>With Selection</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary ui-lib-d365-btn--highlight" onClick={showProductValidationDialog}>🎯 Real-World Example</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary ui-lib-d365-btn--highlight" onClick={showAdvancedTableDemo}>🧪 Advanced Formatting</button>
            </div>
          </Section>
        </Card>

        {/* SideCart Component */}
        <Card
          title="SideCart"
          badge="ready"
          description="Display product images, summaries, or additional context in a side panel attached to the modal."
          code={`const modal = new uiLib.Modal({
  title: 'Product Details',
  size: 'large',
  sideCart: {
    enabled: true,
    position: 'left',        // 'left' or 'right'
    width: 280,              // Width in pixels
    imageUrl: 'https://...',  // Product/hero image
    backgroundColor: '#f3f2f1',
    content: \`
      <div style="padding: 16px;">
        <h3>Surface Laptop 5</h3>
        <p>$1,299.00</p>
        <ul>
          <li>13.5" Display</li>
          <li>Intel Core i7</li>
        </ul>
      </div>
    \`
  },
  fields: [
    { id: 'quantity', label: 'Quantity', type: 'number', value: 1 },
    { id: 'color', label: 'Color', type: 'select', options: ['Platinum', 'Black'] }
  ],
  buttons: [
    new uiLib.Button({ label: 'Add to Cart', callback: () => true, setFocus: true })
  ]
});`}
        >
          <Section title="SideCart Demo">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary ui-lib-d365-btn--highlight" onClick={showSideCartDemo}>🛒 Product with SideCart</button>
            </div>
          </Section>
          <div className="ui-lib-d365-note ui-lib-d365-note--info">
            <span className="ui-lib-d365-note__icon">💡</span>
            <span>SideCart is great for e-commerce, product details, or showing related information alongside forms.</span>
          </div>
        </Card>

        {/* AutoSave Feature */}
        <Card
          title="AutoSave"
          badge="ready"
          description="Automatically save form data to localStorage and restore it when the modal reopens."
          code={`const modal = new uiLib.Modal({
  title: 'Draft Email',
  autoSave: true,                    // Enable auto-save
  autoSaveKey: 'my-draft-email',     // Unique key for localStorage
  fields: [
    { id: 'to', label: 'To', type: 'email' },
    { id: 'subject', label: 'Subject', type: 'text' },
    { id: 'body', label: 'Message', type: 'textarea' }
  ],
  buttons: [
    new uiLib.Button({
      label: 'Clear Draft',
      callback: () => {
        modal.clearAutoSave();  // Clear saved data
        return true;
      }
    }),
    new uiLib.Button({
      label: 'Send',
      callback: () => {
        modal.clearAutoSave();  // Clear on successful send
        return true;
      },
      setFocus: true
    })
  ]
});`}
        >
          <Section title="AutoSave Demo">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary ui-lib-d365-btn--highlight" onClick={showAutoSaveDemo}>📝 Draft Email (AutoSave)</button>
            </div>
          </Section>
          <div className="ui-lib-d365-note ui-lib-d365-note--warning">
            <span className="ui-lib-d365-note__icon">💾</span>
            <span>Try typing in fields, close the modal, then reopen - your data is restored!</span>
          </div>
        </Card>

        {/* Loading with Progress */}
        <Card
          title="Loading States"
          badge="ready"
          description="Show loading spinners with optional progress bars for long-running operations."
          code={`// Simple loading
modal.setLoading(true, 'Processing...');

// Loading with progress bar
modal.setLoading(true, {
  message: 'Syncing records...',
  progress: 50  // 0-100 percentage
});

// Turn off loading
modal.setLoading(false);

// Example: Batch update with progress
for (let i = 0; i < records.length; i++) {
  const progress = Math.round(((i + 1) / records.length) * 100);
  modal.setLoading(true, {
    message: \`Processing \${i + 1} of \${records.length}...\`,
    progress: progress
  });
  await processRecord(records[i]);
}
modal.setLoading(false);`}
        >
          <Section title="Loading Demo">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary ui-lib-d365-btn--highlight" onClick={showLoadingProgressDemo}>⏳ Sync with Progress</button>
            </div>
          </Section>
        </Card>

        {/* ModalHelpers */}
        <Card
          title="ModalHelpers"
          badge="ready"
          description="Quick helper methods for common dialog patterns: alert, confirm, and prompt."
          code={`// Alert - Simple message with OK button
await uiLib.ModalHelpers.alert('Welcome!', 'Thanks for using our app.');
await uiLib.ModalHelpers.alert('Success', 'Record saved.', 'success');

// Confirm - Yes/No dialog, returns boolean
const confirmed = await uiLib.ModalHelpers.confirm(
  'Delete Record?',
  'This cannot be undone.',
  'warning'  // Optional: 'success', 'warning', 'error', 'info'
);
if (confirmed) {
  // User clicked Yes
}

// Prompt - Get text input from user
const name = await uiLib.ModalHelpers.prompt(
  'Enter Name',
  'What should we call you?',
  'Guest'  // Default value
);
if (name) {
  console.debug('User entered:', name);
}`}
        >
          <Section title="Quick Dialogs">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary" onClick={showAlertDemo}>Alert</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--warning" onClick={showConfirmDemo}>Confirm</button>
              <button className="ui-lib-d365-btn ui-lib-d365-btn--secondary" onClick={showPromptDemo}>Prompt</button>
            </div>
          </Section>
        </Card>

        {/* Field Groups */}
        <Card
          title="Field Groups"
          badge="ready"
          description="Organize complex forms with collapsible, bordered field groups."
          code={`const modal = new uiLib.Modal({
  title: 'Customer Profile',
  fields: [
    {
      id: 'personalInfo',
      type: 'group',
      label: 'Personal Information',
      description: 'Basic customer details',
      collapsible: true,
      collapsed: false,  // Start expanded
      border: true,
      fields: [
        { id: 'firstName', label: 'First Name', type: 'text', required: true },
        { id: 'lastName', label: 'Last Name', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email' }
      ]
    },
    {
      id: 'addressInfo',
      type: 'group',
      label: 'Address',
      collapsible: true,
      collapsed: true,  // Start collapsed
      border: true,
      fields: [
        { id: 'street', label: 'Street', type: 'text' },
        { id: 'city', label: 'City', type: 'text' }
      ]
    }
  ]
});`}
        >
          <Section title="Field Groups Demo">
            <div className="ui-lib-d365-btn-group">
              <button className="ui-lib-d365-btn ui-lib-d365-btn--primary ui-lib-d365-btn--highlight" onClick={showFieldGroupsDemo}>👤 Customer Profile</button>
            </div>
          </Section>
        </Card>
      </div>
    </Layout>
  );
};

export default Demo;
