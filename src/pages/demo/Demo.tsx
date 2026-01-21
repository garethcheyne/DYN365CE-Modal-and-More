/**
 * Demo Page - Interactive showcase of err403 UI Library components
 */
import React from 'react';
import { Layout } from '../shared/Layout';

// Declare err403 global (loaded via script tag)
declare const err403: any;
declare const PACKAGE_VERSION: string;

// Component Card wrapper
interface CardProps {
  title: string;
  badge?: 'ready' | 'beta';
  description: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, badge, description, children }) => (
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
    </div>
  </div>
);

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

// Code example block
const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
  <pre className="d365-code">{code}</pre>
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
  const logWarning = () => console.warn(...err403.WAR, 'Warning message');
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
        { id: 'switchInput', label: 'Enable Notifications', type: 'switch', value: true },
        { id: 'rangeInput', label: 'Range Slider', type: 'range', value: 50, showValue: true, extraAttributes: { min: 0, max: 100, step: 5 } },
        { id: 'textarea', label: 'Multi-line Text', type: 'textarea', rows: 3, placeholder: 'Enter notes' },
        { id: 'optionset', label: 'Status', options: ['Draft', 'Active', 'Inactive'], value: 'Active' }
      ],
      buttons: [
        new err403.ModalButton('Close', () => {}),
        new err403.ModalButton('Submit', () => {
          const data = modal.getFieldValues();
          console.log('Form data:', data);
          err403.Toast.success({ title: 'Data Captured', message: 'Check console for output.' });
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
      { id: 1, name: 'Contoso Ltd', industry: 'Technology', revenue: 5000000, employees: 250 },
      { id: 2, name: 'Fabrikam Inc', industry: 'Manufacturing', revenue: 8500000, employees: 450 },
      { id: 3, name: 'Adventure Works', industry: 'Retail', revenue: 3200000, employees: 120 },
      { id: 4, name: 'Northwind Traders', industry: 'Distribution', revenue: 6700000, employees: 180 }
    ];

    const modal = new err403.Modal({
      title: 'Company Directory',
      size: 'large',
      fields: [
        new err403.Table({
          id: 'companyTable',
          columns: [
            { id: 'name', header: 'Company Name', visible: true, sortable: true, width: '250px' },
            { id: 'industry', header: 'Industry', visible: true, sortable: true, width: '200px' },
            { id: 'revenue', header: 'Revenue', visible: true, sortable: true, width: '150px' },
            { id: 'employees', header: 'Employees', visible: true, sortable: true, width: '120px' }
          ],
          data: sampleData,
          selectionMode: 'none'
        })
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
        new err403.Table({
          id: 'contactTable',
          columns: [
            { id: 'name', header: 'Full Name', visible: true, sortable: true, width: '200px' },
            { id: 'email', header: 'Email Address', visible: true, sortable: true, width: '250px' },
            { id: 'department', header: 'Department', visible: true, sortable: true, width: '150px' }
          ],
          data: contactData,
          selectionMode: 'multiple'
        })
      ],
      buttons: [
        new err403.ModalButton('Cancel', () => {}),
        new err403.ModalButton('Process Selected', () => {
          const selected = modal.getFieldValue('contactTable');
          if (selected.length === 0) {
            err403.Toast.warn({ title: 'No Selection', message: 'Please select at least one contact' });
            return false;
          }
          err403.Toast.success({ title: 'Processing Complete', message: `Processed ${selected.length} contact(s)` });
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
          <CodeBlock code={`err403.Toast.success({
  title: "Account Saved",
  message: "The account has been updated.",
  duration: 5000,
  sound: true
});`} />
        </Card>

        {/* Logger Utility */}
        <Card
          title="Logger Utility"
          badge="ready"
          description="Consistent console logging with styled prefixes for debugging."
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
          <CodeBlock code={`console.debug(...err403.TRACE, "Debug", { data: 123 });
console.warn(...err403.WAR, "Warning message");
console.error(...err403.ERR, "Error", errorObj);`} />
        </Card>

        {/* Modal Dialogs */}
        <Card
          title="Modal Dialogs"
          badge="ready"
          description="Modal dialogs with forms, tabs, progress indicators, and advanced features."
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
            </div>
          </Section>
          <Section title="Advanced Features">
            <div className="d365-btn-group">
              <button className="d365-btn d365-btn--secondary" onClick={showTabsModal}>Tabs</button>
              <button className="d365-btn d365-btn--secondary" onClick={showDraggableModal}>Draggable</button>
            </div>
          </Section>
          <CodeBlock code={`err403.Modal.alert('Success', 'Changes saved.');
err403.Modal.confirm('Delete?', 'Are you sure?');`} />
        </Card>

        {/* Lookup Component */}
        <Card
          title="Lookup Component"
          badge="ready"
          description="Advanced entity record lookup with search, pagination, and sorting."
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
          <CodeBlock code={`err403.Lookup.open({
  entity: 'account',
  columns: ['name', 'accountnumber'],
  multiSelect: true,
  onSelect: (records) => console.log(records)
});`} />
        </Card>

        {/* Table Component */}
        <Card
          title="Table Component"
          badge="ready"
          description="Display tabular data with sortable columns and row selection."
        >
          <Section title="Table Types">
            <div className="d365-btn-group">
              <button className="d365-btn d365-btn--primary" onClick={showSimpleTable}>Simple Table</button>
              <button className="d365-btn d365-btn--primary" onClick={showTableWithSelection}>With Selection</button>
            </div>
          </Section>
          <CodeBlock code={`new err403.Table({
  id: 'myTable',
  columns: [
    { id: 'name', header: 'Name', sortable: true },
    { id: 'email', header: 'Email', sortable: true }
  ],
  data: records,
  selectionMode: 'multiple'
});`} />
        </Card>
      </div>
    </Layout>
  );
};

export default Demo;
