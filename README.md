# err403 UI Library for Dynamics 365

**Professional-grade UI components that seamlessly integrate with Dynamics 365**, giving your forms, ribbons, and custom pages the same polished look and feel as native D365 interfaces.

Stop wrestling with custom HTML and CSS. This library provides production-ready components that match Microsoft's Fluent UI design system, ensuring your customizations look and feel like they belong in Dynamics 365.

## Why Choose err403 UI Library?

✅ **Matches Dynamics 365 Design** - Uses Microsoft Fluent UI v9 components for authentic D365 styling  
✅ **Simple Vanilla API** - Clean JavaScript API, no React knowledge required  
✅ **Easy to Use** - Simple API, complete examples, works with form scripts and ribbon buttons  
✅ **Production Ready** - Validated, tested, and optimized for D365 environments  
✅ **Fully Typed** - Built with TypeScript for better IntelliSense and fewer bugs  

## What's Included

### 🍞 Toast Notifications
Show success messages, warnings, and errors that appear in the top-right corner, just like D365's native notifications. Perfect for confirming actions, displaying errors, or keeping users informed.

### 🪟 Modal Dialogs
Create professional forms, wizards, and confirmation dialogs with full validation, tabs, progress indicators, conditional field visibility, and custom fields. Build complex data entry experiences that feel native to D365.

**New Features:**
- ✨ **Conditional Field Visibility** - Show/hide fields based on other field values
- 🧙 **Visual Wizard Steps** - Step indicators with circles, labels, and connectors
- 📊 **All Field Types** - Text, number, date, switch, slider, textarea, dropdown, table
- 🎨 **Fluent UI Styling** - Authentic D365 appearance with filled-darker inputs

### 🔍 Advanced Lookups
Powerful record selection dialogs with search, filtering, sorting, and multi-select. Integrate seamlessly with D365's entity metadata for a consistent user experience.

## Architecture

**Vanilla JavaScript API with Fluent UI Components**

This library provides a simple vanilla JavaScript API that works seamlessly with D365 form scripts and ribbon buttons. Behind the scenes, it uses:

- **Microsoft Fluent UI v9** - Professional React components for authentic D365 styling
- **React 18** - Modern UI framework (bundled internally, invisible to your code)
- **TypeScript** - Type-safe development with full IntelliSense support

### Key Components Using Fluent UI

- ✨ **TabList & Tooltip** - Native Fluent UI tab navigation and tooltips
- 📊 **DataGrid** - High-performance sortable tables with selection
- 🔔 **Toast/Toaster** - Fluent UI toast notifications with intents
- 🎛️ **Switch** - Modern toggle switches
- 🔘 **Button** - Fluent UI buttons with primary/secondary appearances

### How It Works

```javascript
// You write simple vanilla JavaScript
err403.Toast.success({ title: 'Done!', message: 'Record saved' });

// Library handles React rendering internally
// ↓ Converts to Fluent UI React components
// ↓ Mounts to DOM with proper theming
// ↓ User sees polished D365-style toast
```

**Benefits:**
- No React knowledge required
- No build process for your code
- Automatic D365 theme matching
- Production-optimized bundle (280 KB gzipped)

## Installation

### Quick Start (3 Steps)

**Step 1:** Download the solution package from the [releases](releases/) folder:
- `err403UILibrary_1_0_0.zip`

**Step 2:** Import into your Dynamics 365 environment:
1. Navigate to **Settings → Solutions**
2. Click **Import**
3. Select the downloaded zip file
4. Complete the import wizard

**Step 3:** Reference the library in your form scripts or web resources:

```javascript
// The library is now available globally as err403
err403.Toast.success({ message: 'Library loaded!' });
```

**That's it!** The library is installed as web resource `err403_/ui-lib.min.js` and ready to use.

### Try the Demo

See the library in action:
- **Demo Page:** `https://[your-org].dynamics.com/WebResources/err403_/demo.html`
- **Test Suite:** `https://[your-org].dynamics.com/WebResources/err403_/tests.html`

---

## Complete Examples

### Example 1: Success & Error Messages

Show feedback to users after they perform actions:

```javascript
// When a record is saved successfully
function onSave(executionContext) {
  err403.Toast.success({
    title: 'Success',
    message: 'Contact saved successfully!',
    duration: 3000,
    sound: true
  });
}

// When validation fails
function validatePhoneNumber(executionContext) {
  var phone = Xrm.Page.getAttribute('telephone1').getValue();
  
  if (!phone || phone.length < 10) {
    err403.Toast.error({
      title: 'Validation Error',
      message: 'Phone number must be at least 10 digits',
      duration: 5000
    });
    return false;
  }
  return true;
}

// Show a warning
function showDataWarning() {
  err403.Toast.warn({
    title: 'Data Notice',
    message: 'This record is missing required information',
    duration: 4000
  });
}
```

### Example 2: Simple Confirmation Dialog

Ask users to confirm before deleting a record:

```javascript
function confirmDelete(recordId) {
  err403.Modal.confirm(
    'Delete Record', 
    'Are you sure you want to delete this record? This cannot be undone.'
  ).then(function(confirmed) {
    if (confirmed) {
      // User clicked OK
      Xrm.WebApi.deleteRecord('account', recordId).then(function() {
        err403.Toast.success({ message: 'Record deleted' });
      });
    }
    // User clicked Cancel - do nothing
  });
}
```

### Example 3: Quick Alert Message

Show important information to users:

```javascript
function showLicenseInfo() {
  err403.Modal.alert(
    'License Expiring',
    'Your license will expire in 30 days. Please contact your administrator.'
  );
}
```

### Example 4: Create a Contact Form

Build a complete data entry form with validation:

```javascript
function createContact() {
  var modal = new err403.Modal({
    title: 'Create New Contact',
    size: 'medium',
    fields: [
      new err403.Input({
        id: 'firstname',
        label: 'First Name',
        type: 'text',
        required: true,
        placeholder: 'Enter first name'
      }),
      new err403.Input({
        id: 'lastname',
        label: 'Last Name',
        type: 'text',
        required: true,
        placeholder: 'Enter last name'
      }),
      new err403.Input({
        id: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'contact@example.com',
        validation: {
          rules: [
            { type: 'email', message: 'Please enter a valid email address' }
          ]
        }
      }),
      new err403.Input({
        id: 'phone',
        label: 'Phone',
        type: 'text',
        placeholder: '(555) 123-4567'
      }),
      new err403.OptionSet({
        id: 'preferredcontactmethod',
        label: 'Preferred Contact Method',
        options: [
          { label: 'Email', value: '1' },
          { label: 'Phone', value: '2' },
          { label: 'Mail', value: '3' }
        ]
      })
    ],
    buttons: [
      new err403.Button('Cancel', function() {
        // Just close the modal
      }),
      new err403.Button('Create Contact', function() {
        // Validate all fields
        if (!modal.validateAllFields()) {
          err403.Toast.error({ message: 'Please fix validation errors' });
          return false; // Keep modal open
        }
        
        // Get form data
        var data = modal.getFieldValues();
        
        // Create the contact record
        var contact = {
          firstname: data.firstname,
          lastname: data.lastname,
          emailaddress1: data.email,
          telephone1: data.phone,
          preferredcontactmethodcode: parseInt(data.preferredcontactmethod)
        };
        
        Xrm.WebApi.createRecord('contact', contact).then(
          function success(result) {
            err403.Toast.success({ 
              message: 'Contact created successfully!' 
            });
            console.log('Created contact ID:', result.id);
          },
          function error(err) {
            err403.Toast.error({ 
              message: 'Failed to create contact: ' + err.message 
            });
          }
        );
        
        return true; // Close modal
      }, true) // true = primary button (blue)
    ]
  });
  
  modal.show();
}
```

### Example 5: Multi-Step Wizard

Guide users through a complex process:

```javascript
function runAccountSetupWizard() {
  var modal = err403.Modal.open({
    title: 'Account Setup Wizard',
    size: 'large',
    progress: {
      enabled: true,
      type: 'steps-left', // Show step indicators on the left
      currentStep: 1,
      totalSteps: 3,
      steps: [
        {
          id: 'step1',
          label: 'Basic Info',
          name: 'Basic Information',
          description: 'Enter account details',
          fields: [
            new err403.Input({
              id: 'accountname',
              label: 'Account Name',
              type: 'text',
              required: true
            }),
            new err403.Input({
              id: 'accountnumber',
              label: 'Account Number',
              type: 'text'
            }),
            new err403.OptionSet({
              id: 'industrycode',
              label: 'Industry',
              options: [
                { label: 'Technology', value: '1' },
                { label: 'Manufacturing', value: '2' },
                { label: 'Services', value: '3' }
              ]
            })
          ]
        },
        {
          id: 'step2',
          label: 'Address',
          name: 'Address Information',
          description: 'Enter business address',
          fields: [
            new err403.Input({
              id: 'address1_line1',
              label: 'Street Address',
              type: 'text'
            }),
            new err403.Input({
              id: 'address1_city',
              label: 'City',
              type: 'text'
            }),
            new err403.Input({
              id: 'address1_stateorprovince',
              label: 'State/Province',
              type: 'text'
            }),
            new err403.Input({
              id: 'address1_postalcode',
              label: 'Postal Code',
              type: 'text'
            })
          ]
        },
        {
          id: 'step3',
          label: 'Review',
          name: 'Review & Submit',
          description: 'Review your information',
          fields: [
            new err403.MultiLine({
              id: 'description',
              label: 'Additional Notes',
              rows: 4,
              placeholder: 'Any additional information...'
            })
          ]
        }
      ]
    },
    buttons: [
      new err403.Button('Previous', function() {
        modal.previousStep();
        return false; // Don't close
      }),
      new err403.Button('Next', function() {
        if (modal.validateCurrentStep()) {
          modal.nextStep();
        }
        return false; // Don't close
      }, true),
      new err403.Button('Finish', function() {
        var data = modal.getFieldValues();
        
        // Create the account
        Xrm.WebApi.createRecord('account', data).then(function(result) {
          err403.Toast.success({ message: 'Account created successfully!' });
        });
        
        return true; // Close modal
      }, true)
    ]
  });
}
```

### Example 6: Conditional Field Visibility

Show or hide fields based on other field values - perfect for dynamic forms:

```javascript
function createAccountWithConditionalFields() {
  const modal = new err403.Modal({
    title: 'New Account',
    size: 'medium',
    fields: [
      // Control field
      { 
        id: 'accountType', 
        label: 'Account Type', 
        type: 'select',
        options: ['Business', 'Individual'],
        value: 'Business'
      },
      
      // Business fields - only visible when accountType is 'Business'
      { 
        id: 'companyName', 
        label: 'Company Name', 
        type: 'text',
        required: true,
        visibleWhen: { field: 'accountType', operator: 'equals', value: 'Business' }
      },
      { 
        id: 'taxId', 
        label: 'Tax ID', 
        type: 'text',
        visibleWhen: { field: 'accountType', operator: 'equals', value: 'Business' }
      },
      
      // Individual fields - only visible when accountType is 'Individual'
      { 
        id: 'firstName', 
        label: 'First Name', 
        type: 'text',
        required: true,
        visibleWhen: { field: 'accountType', operator: 'equals', value: 'Individual' }
      },
      { 
        id: 'lastName', 
        label: 'Last Name', 
        type: 'text',
        required: true,
        visibleWhen: { field: 'accountType', operator: 'equals', value: 'Individual' }
      },
      
      // Marketing preferences with dependent fields
      { 
        id: 'allowMarketing', 
        label: 'Allow Marketing Communications', 
        type: 'switch',
        value: true
      },
      { 
        id: 'emailNotifications', 
        label: 'Email Notifications', 
        type: 'switch',
        visibleWhen: { field: 'allowMarketing', operator: 'truthy' }
      },
      { 
        id: 'smsAlerts', 
        label: 'SMS Alerts', 
        type: 'switch',
        visibleWhen: { field: 'allowMarketing', operator: 'truthy' }
      }
    ],
    buttons: [
      new err403.ModalButton('Cancel', () => {}),
      new err403.ModalButton('Save', () => {
        const data = modal.getFieldValues();
        console.log('Account data:', data);
        err403.Toast.success({ title: 'Saved', message: 'Account created successfully' });
        return true;
      }, true)
    ]
  });
  modal.show();
}

// Available operators for visibleWhen:
// - 'equals': field === value
// - 'notEquals': field !== value
// - 'contains': string contains substring
// - 'greaterThan': number > value
// - 'lessThan': number < value
// - 'truthy': !!field (any truthy value)
// - 'falsy': !field (any falsy value)
```

### Example 7: D365 Option Set Auto-Fetch

Automatically load option set values from Dynamics 365 metadata:

```javascript
function createLeadForm() {
  const modal = new err403.Modal({
    title: 'Create Lead',
    fields: [
      { 
        id: 'firstname', 
        label: 'First Name', 
        type: 'text', 
        required: true 
      },
      { 
        id: 'lastname', 
        label: 'Last Name', 
        type: 'text', 
        required: true 
      },
      { 
        id: 'emailaddress1', 
        label: 'Email', 
        type: 'email', 
        required: true 
      },
      // Auto-fetch Industry option set
      {
        id: 'industrycode',
        type: 'select',
        optionSet: {
          entityName: 'lead',
          attributeName: 'industrycode',
          includeNull: true,      // Add blank option
          sortByLabel: true        // Sort alphabetically
        }
      },
      // Auto-fetch Lead Source
      {
        id: 'leadsourcecode',
        type: 'select',
        optionSet: {
          entityName: 'lead',
          attributeName: 'leadsourcecode',
          includeNull: true
        }
      },
      // Auto-fetch Rating
      {
        id: 'leadqualitycode',
        type: 'select',
        optionSet: {
          entityName: 'lead',
          attributeName: 'leadqualitycode'
        }
      }
    ],
    buttons: [
      new err403.ModalButton('Cancel', () => { /* close */ }),
      new err403.ModalButton('Create Lead', function() {
        const data = modal.getAllFieldValues();
        
        Xrm.WebApi.createRecord('lead', {
          firstname: data.firstname,
          lastname: data.lastname,
          emailaddress1: data.emailaddress1,
          industrycode: parseInt(data.industrycode),
          leadsourcecode: parseInt(data.leadsourcecode),
          leadqualitycode: parseInt(data.leadqualitycode)
        }).then(() => {
          err403.Toast.success({ message: 'Lead created successfully' });
        });
        
        return true;
      }, true)
    ]
  });
  modal.show();
}

// The library automatically:
// 1. Fetches option set metadata from D365
// 2. Populates dropdown with options
// 3. Uses attribute display name as label (if not provided)
// 4. Handles both local and global option sets
```

### Example 8: Account Lookup with Selection

Let users search and select records:

```javascript
function selectAccount() {
  err403.Lookup.open({
    entity: 'account',
    columns: ['name', 'accountnumber', 'telephone1', 'address1_city'],
    columnLabels: {
      name: 'Account Name',
      accountnumber: 'Account #',
      telephone1: 'Phone',
      address1_city: 'City'
    },
    searchFields: ['name', 'accountnumber'], // Search in these visible fields
    additionalSearchFields: ['emailaddress1', 'websiteurl'], // Also search email/website but don't display
    onSelect: function(results) {
      if (results.length > 0) {
        var account = results[0];
        
        // Set the value on the current form
        Xrm.Page.getAttribute('parentaccountid').setValue([{
          id: account.id,
          name: account.name,
          entityType: 'account'
        }]);
        
        err403.Toast.success({ 
          message: 'Selected: ' + account.name 
        });
      }
    }
  });
}
```

**Search Behavior:** The lookup uses "contains" logic, so searching for "smith" will find "John Smith", "Smithson Inc", and "Blacksmith Corp". The search checks both visible fields (`name`, `accountnumber`) and hidden fields (`emailaddress1`, `websiteurl`), allowing users to find records by email or website even though those columns aren't displayed in the grid.

### Example 9: Multi-Select Contacts

Select multiple records at once:

```javascript
function selectMultipleContacts() {
  err403.Lookup.open({
    entity: 'contact',
    columns: ['fullname', 'emailaddress1', 'telephone1', 'jobtitle'],
    columnLabels: {
      fullname: 'Name',
      emailaddress1: 'Email',
      telephone1: 'Phone',
      jobtitle: 'Job Title'
    },
    multiSelect: true, // Allow selecting multiple records
    onSelect: function(selectedContacts) {
      console.log('Selected ' + selectedContacts.length + ' contacts');
      
      // Process each selected contact
      selectedContacts.forEach(function(contact) {
        console.log(contact.fullname + ' - ' + contact.emailaddress1);
      });
      
      err403.Toast.success({ 
        message: selectedContacts.length + ' contacts selected' 
      });
    }
  });
}
```

### Example 10: Filtered Lookup (Active Accounts Only)

Show only records that match specific criteria:

```javascript
function selectActiveAccount() {
  err403.Lookup.open({
    entity: 'account',
    columns: ['name', 'accountnumber', 'revenue'],
    columnLabels: {
      name: 'Account Name',
      accountnumber: 'Account #',
      revenue: 'Annual Revenue'
    },
    // Only show active accounts
    filters: '<filter><condition attribute="statecode" operator="eq" value="0" /></filter>',
    // Sort by revenue (highest first)
    orderBy: [{ attribute: 'revenue', descending: true }],
    onSelect: function(results) {
      if (results.length > 0) {
        console.log('Selected account:', results[0].name);
      }
    }
  });
}
```

### Example 11: Data Table with Sorting and Selection

Display tabular data with sorting, selection, and customizable columns:

```javascript
function showContactsTable() {
  // Fetch contacts from D365
  Xrm.WebApi.retrieveMultipleRecords('contact', '?$select=fullname,emailaddress1,telephone1,jobtitle,birthdate&$top=50')
    .then(function(result) {
      var modal = new err403.Modal({
        title: 'Contact List',
        size: 'large',
        fields: [
          new err403.Table({
            id: 'contactsTable',
            label: 'Contacts',
            columns: [
              { id: 'fullname', header: 'Full Name', visible: true, sortable: true, width: '200px' },
              { id: 'emailaddress1', header: 'Email', visible: true, sortable: true, width: '250px' },
              { id: 'telephone1', header: 'Phone', visible: true, sortable: false, width: '150px' },
              { id: 'jobtitle', header: 'Job Title', visible: true, sortable: true },
              { id: 'birthdate', header: 'Birth Date', visible: false } // Hidden column
            ],
            data: result.entities,
            selectionMode: 'multiple', // Options: 'none', 'single', 'multiple'
            onRowSelect: function(selectedRows) {
              console.log('Selected contacts:', selectedRows);
              err403.Toast.info({ 
                message: selectedRows.length + ' contact(s) selected' 
              });
            }
          })
        ],
        buttons: [
          new err403.Button('Cancel', function() {
            // Close without action
          }),
          new err403.Button('Process Selected', function() {
            var selectedContacts = modal.getFieldValue('contactsTable');
            
            if (selectedContacts.length === 0) {
              err403.Toast.warn({ message: 'Please select at least one contact' });
              return false; // Keep modal open
            }
            
            // Process selected contacts
            selectedContacts.forEach(function(contact) {
              console.log('Processing:', contact.fullname);
            });
            
            err403.Toast.success({ 
              message: 'Processed ' + selectedContacts.length + ' contacts' 
            });
            
            return true; // Close modal
          }, true)
        ]
      });
      
      modal.show();
    });
}
```

**Dynamic table updates:**
```javascript
// Update table data programmatically
function refreshTableData() {
  Xrm.WebApi.retrieveMultipleRecords('contact', '?$select=fullname,emailaddress1&$top=25')
    .then(function(result) {
      modal.setFieldValue('contactsTable', result.entities);
    });
}
```

**Table features:**
- **Sortable columns**: Click column headers to sort (supports text and numeric sorting)
- **Row selection**: Single or multiple row selection modes
- **Column visibility**: Show/hide specific columns
- **Custom widths**: Set specific widths for columns
- **Selection callback**: Get notified when users select rows
- **Dynamic updates**: Update table data using `setFieldValue()`

### Example 10: Form with Tabs

Organize complex forms with tabs:

```javascript
function editAccountDetails(accountId) {
  var modal = new err403.Modal({
    title: 'Edit Account',
    size: 'large',
    fields: [
      new err403.Group({
        id: 'tabs',
        asTabs: true, // Display as tabs
        fields: [
          // General tab
          new err403.Group({
            id: 'general',
            label: 'General',
            fields: [
              new err403.Input({
                id: 'name',
                label: 'Account Name',
                type: 'text',
                required: true
              }),
              new err403.Input({
                id: 'telephone1',
                label: 'Phone',
                type: 'text'
              }),
              new err403.Input({
                id: 'websiteurl',
                label: 'Website',
                type: 'text'
              })
            ]
          }),
          // Address tab
          new err403.Group({
            id: 'address',
            label: 'Address',
            fields: [
              new err403.Input({
                id: 'address1_line1',
                label: 'Street',
                type: 'text'
              }),
              new err403.Input({
                id: 'address1_city',
                label: 'City',
                type: 'text'
              }),
              new err403.Input({
                id: 'address1_postalcode',
                label: 'Zip Code',
                type: 'text'
              })
            ]
          }),
          // Notes tab
          new err403.Group({
            id: 'notes',
            label: 'Notes',
            fields: [
              new err403.MultiLine({
                id: 'description',
                label: 'Description',
                rows: 6
              })
            ]
          })
        ]
      })
    ],
    buttons: [
      new err403.Button('Cancel', function() {
        // Close without saving
      }),
      new err403.Button('Save', function() {
        var data = modal.getFieldValues();
        
        Xrm.WebApi.updateRecord('account', accountId, data).then(function() {
          err403.Toast.success({ message: 'Account updated' });
          location.reload(); // Refresh the form
        });
        
        return true;
      }, true)
    ]
  });
  
  // Load existing data and populate form
  Xrm.WebApi.retrieveRecord('account', accountId, '?$select=name,telephone1,websiteurl,address1_line1,address1_city,address1_postalcode,description')
    .then(function(account) {
      modal.show();
      
      // Use setFieldValue to populate the form after it's displayed
      modal.setFieldValue('name', account.name);
      modal.setFieldValue('telephone1', account.telephone1);
      modal.setFieldValue('websiteurl', account.websiteurl);
      modal.setFieldValue('address1_line1', account.address1_line1);
      modal.setFieldValue('address1_city', account.address1_city);
      modal.setFieldValue('address1_postalcode', account.address1_postalcode);
      modal.setFieldValue('description', account.description);
    });
}
```

**Using `setFieldValue` dynamically:**
```javascript
// Update a field based on another field's value
function onCityChange(executionContext) {
  var city = modal.getFieldValue('address1_city');
  
  // Auto-populate state based on city
  if (city === 'New York') {
    modal.setFieldValue('address1_stateorprovince', 'NY');
  } else if (city === 'Los Angeles') {
    modal.setFieldValue('address1_stateorprovince', 'CA');
  }
}
```

### Example 13: Progress Indicator

Show progress during long operations:

```javascript
function processRecords() {
  var modal = err403.Modal.open({
    title: 'Processing Records',
    message: 'Please wait...',
    progress: {
      enabled: true,
      type: 'bar', // Progress bar
      currentStep: 0,
      totalSteps: 100
    },
    buttons: [] // No buttons during processing
  });
  
  var processed = 0;
  var total = 100;
  
  // Simulate processing
  var interval = setInterval(function() {
    processed += 10;
    modal.updateProgress(processed);
    
    if (processed >= total) {
      clearInterval(interval);
      modal.close();
      err403.Toast.success({ 
        message: 'Processing complete! ' + total + ' records updated.' 
      });
    }
  }, 500);
}
```

---

## Using on Forms (Form Events)

Add the library to your form's Form Libraries, then use it in event handlers:

**OnLoad Event:**
```javascript
function onFormLoad(executionContext) {
  var formContext = executionContext.getFormContext();
  
  // Show a welcome message
  err403.Toast.info({
    message: 'Form loaded successfully',
    duration: 2000
  });
}
```

**OnChange Event:**
```javascript
function onAccountTypeChange(executionContext) {
  var formContext = executionContext.getFormContext();
  var accountType = formContext.getAttribute('accounttypecode').getValue();
  
  if (accountType === 3) { // If type is "Partner"
    err403.Toast.warn({
      title: 'Partner Account',
      message: 'Please ensure partner agreement is on file',
      duration: 5000
    });
  }
}
```

**Ribbon Button:**
```javascript
function onRibbonButtonClick() {
  var selectedRecords = Xrm.Page.getControl('grid').getGrid().getSelectedRows();
  
  if (selectedRecords.length === 0) {
    err403.Toast.warn({ message: 'Please select at least one record' });
    return;
  }
  
  err403.Modal.confirm('Process Records', 'Process ' + selectedRecords.length + ' selected records?')
    .then(function(confirmed) {
      if (confirmed) {
        // Process records...
        err403.Toast.success({ message: 'Processing started' });
      }
    });
}
```

---

## API Reference

### Toast

**Show a toast notification:**
```javascript
err403.Toast.show({
  type: 'success' | 'info' | 'warn' | 'error' | 'custom',
  title: 'Optional title',
  message: 'Your message',
  duration: 3000, // milliseconds
  sound: true // optional
});
```

**Convenience methods:**
```javascript
err403.Toast.success({ message: 'Success!' });
err403.Toast.info({ message: 'Info message' });
err403.Toast.warn({ message: 'Warning!' });
err403.Toast.error({ message: 'Error occurred' });
```

### Modal

**Create a modal:**
```javascript
const modal = new err403.Modal({
  title: 'Title',
  message: 'Optional message',
  size: 'small' | 'medium' | 'large' | 'fullscreen' | { width: 800, height: 600 },
  fields: [ /* array of field config objects */ ],
  buttons: [ /* array of ModalButton objects */ ],
  draggable: true, // optional - make modal draggable
  allowDismiss: true, // click outside to close
  progress: { // optional - for wizards
    enabled: true,
    currentStep: 1,
    allowStepNavigation: true,
    steps: [
      { id: 'step1', label: 'Step 1', fields: [...] },
      { id: 'step2', label: 'Step 2', fields: [...] }
    ]
  }
});

modal.show();
```

**Field Configuration:**
```javascript
// All field types support:
{
  id: 'fieldId',              // Required - unique identifier
  label: 'Field Label',       // Optional - display label
  type: 'text',               // Field type (see types below)
  value: 'initial value',     // Optional - initial value
  required: true,             // Optional - mark as required
  disabled: false,            // Optional - disable field
  readOnly: false,            // Optional - read-only mode
  placeholder: 'Enter...',    // Optional - placeholder text
  tooltip: 'Help text',       // Optional - tooltip on hover
  orientation: 'horizontal',  // Optional - 'horizontal' (default) or 'vertical'
  
  // Conditional visibility (NEW!)
  visibleWhen: {
    field: 'otherFieldId',    // Field to watch
    operator: 'equals',       // Comparison operator
    value: 'someValue'        // Value to compare
  }
}

// Available field types:
- 'text' | 'email' | 'tel' | 'password' | 'url' | 'search'
- 'number'
- 'textarea' - with rows property
- 'date' - Fluent UI DatePicker
- 'select' - with options: ['Option 1', 'Option 2'] or [{ label, value }]
- 'switch' - Boolean toggle
- 'range' - Slider with min, max, step (use extraAttributes)
- 'table' - Embedded data grid (use Table class)
- 'custom' - Custom HTML with render() function

// Example: Number field with range slider
{ 
  id: 'satisfaction', 
  label: 'Satisfaction Score', 
  type: 'range',
  value: 75,
  showValue: true,
  extraAttributes: { min: 0, max: 100, step: 5 }
}

// Example: Conditional field visibility
{ 
  id: 'emailNotifications', 
  label: 'Email Notifications', 
  type: 'switch',
  visibleWhen: { 
    field: 'allowMarketing', 
    operator: 'truthy'  // equals | notEquals | contains | greaterThan | lessThan | truthy | falsy
  }
}

// Example: Table field
new err403.Table({ 
  id: 'productsTable', 
  columns: [
    { id: 'name', header: 'Product Name', visible: true, sortable: true, width: '250px' },
    { id: 'price', header: 'Price', visible: true, sortable: true, width: '100px' }
  ],
  data: [
    { id: 1, name: 'Product A', price: 100 },
    { id: 2, name: 'Product B', price: 200 }
  ],
  selectionMode: 'multiple',
  onRowSelect: (selectedRows) => { console.log(selectedRows); }
})
```

**Button helper:**
```javascript
new err403.ModalButton(
  'Label',
  () => {
    // Callback function
    // Return false to keep modal open
    // Return true or nothing to close modal
  },
  true,  // setFocus - makes this the primary (blue) button
  false  // preventClose - if true, button won't close modal automatically
)
```

**Static methods:**
```javascript
err403.Modal.alert('Title', 'Message').then(() => { /* closed */ });
err403.Modal.confirm('Title', 'Message').then((confirmed) => { /* boolean */ });
```

**Modal methods:**
```javascript
modal.show();
modal.close();
modal.getFieldValues(); // Returns object with all field values
modal.getFieldValue('fieldId'); // Get single field value
modal.setFieldValue('fieldId', newValue); // Update field value programmatically
modal.validateAllFields(); // Returns boolean
modal.updateProgress(percentage); // For progress bars
modal.nextStep(); // For wizards
modal.previousStep(); // For wizards
```

### Lookup

**Open a lookup:**
```javascript
err403.Lookup.open({
  entity: 'account',
  columns: ['name', 'accountnumber'],
  columnLabels: { name: 'Name', accountnumber: 'Number' }, // optional
  searchFields: ['name', 'accountnumber'], // optional
  multiSelect: false, // optional
  filters: '<filter>...</filter>', // FetchXML filter
  orderBy: [{ attribute: 'name', descending: false }], // optional
  onSelect: function(results) {
    // results is array of selected records
    // each result has: { id, name, entityType, ...columns }
  }
});
```

### Logger

**Console logging with prefixes:**
```javascript
console.log(...err403.BUG, 'Debug message', data);
console.warn(...err403.WAR, 'Warning message');
console.error(...err403.ERR, 'Error message', error);
```

---

## Browser Support

- ✅ Microsoft Edge (recommended)
- ✅ Google Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Internet Explorer 11

---

## Technical Details

- **Size:** ~690 KB minified (~280 KB gzipped)
- **Framework:** Fluent UI v9 + React 18 (bundled internally)
- **API:** Vanilla JavaScript/TypeScript - No React knowledge required
- **Compatibility:** Works with all D365 CE versions (online and on-premise)
- **Loading:** Synchronous script, available immediately
- **Type Definitions:** Full TypeScript support with IntelliSense

---

## Need Help?

- 📖 [Complete Test Suite](demo/tests.html) - See all features in action
- 🎨 [Live Demo](demo/demo.html) - Interactive examples
- 📝 [Testing Guide](TESTING.md) - How to test in your environment

---

---

## For Developers

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Build D365 solution package
npm run build-solution
```

### Project Structure

```text
├── src/
│   ├── components/
│   │   ├── Toast/
│   │   ├── Modal/
│   │   └── Lookup/
│   ├── utils/
│   ├── types/
│   └── index.ts
├── demo/
│   ├── demo.html
│   └── tests.html
├── solution/
│   └── WebResources/
└── dist/
    └── ui-lib.min.js
```

---

## License

MIT License - Free to use in your Dynamics 365 projects

---

**Built with ❤️ for the Dynamics 365 community**
