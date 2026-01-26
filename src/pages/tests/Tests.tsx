/**
 * Tests Page - Test suite for err403 UI Library components
 */
import React, { useState, useCallback } from 'react';
import { Layout } from '../shared/Layout';
import * as err403Module from '../../index';

// Use the module exports directly (works in both dev and production)
const err403 = err403Module;
declare const PACKAGE_VERSION: string;

interface LogEntry {
  id: number;
  message: string;
  status: 'success' | 'error' | 'warning' | 'info';
  time: string;
}

// Test Card Component
interface TestCardProps {
  title: string;
  description?: string;
  tests: { label: string; handler: () => void }[];
  logs: LogEntry[];
  onClear: () => void;
}

const TestCard: React.FC<TestCardProps> = ({ title, description, tests, logs, onClear }) => (
  <div className="d365-card">
    <div className="d365-card__header">
      <h2 className="d365-card__title">{title}</h2>
      <button className="d365-btn d365-btn--ghost d365-btn--small" onClick={onClear}>
        Clear
      </button>
    </div>
    <div className="d365-card__body">
      {description && <p className="d365-card__description">{description}</p>}
      <div className="d365-test-grid">
        {tests.map((test, i) => (
          <button key={i} className="d365-btn d365-btn--primary" onClick={test.handler}>
            {test.label}
          </button>
        ))}
      </div>
      <div className="d365-console">
        {logs.length === 0 && <span style={{ color: '#6a6a6a' }}>Results will appear here...</span>}
        {logs.map((log) => (
          <div key={log.id} className={`d365-console__line d365-console__line--${log.status}`}>
            <span className="d365-console__time">[{log.time}]</span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const Tests: React.FC = () => {
  // Separate log state for each section
  const [toastLogs, setToastLogs] = useState<LogEntry[]>([]);
  const [modalLogs, setModalLogs] = useState<LogEntry[]>([]);
  const [advancedModalLogs, setAdvancedModalLogs] = useState<LogEntry[]>([]);
  const [lookupLogs, setLookupLogs] = useState<LogEntry[]>([]);
  const [loggerLogs, setLoggerLogs] = useState<LogEntry[]>([]);
  const [tableLogs, setTableLogs] = useState<LogEntry[]>([]);
  const [integrationLogs, setIntegrationLogs] = useState<LogEntry[]>([]);

  let logId = 0;

  const addLog = useCallback((
    setter: React.Dispatch<React.SetStateAction<LogEntry[]>>,
    message: string,
    status: LogEntry['status'] = 'success'
  ) => {
    const entry: LogEntry = {
      id: ++logId,
      message,
      status,
      time: new Date().toLocaleTimeString()
    };
    setter(prev => [...prev, entry]);
  }, []);

  // Toast Tests
  const toastTests = [
    { label: 'Success Toast', handler: () => {
      err403.Toast.success({ title: 'Success', message: 'Test successful!', duration: 3000 });
      addLog(setToastLogs, '✓ Success toast displayed');
    }},
    { label: 'Info Toast', handler: () => {
      err403.Toast.info({ title: 'Info', message: 'This is an info message', duration: 3000 });
      addLog(setToastLogs, '✓ Info toast displayed');
    }},
    { label: 'Warning Toast', handler: () => {
      err403.Toast.warn({ title: 'Warning', message: 'Warning: This is a test', duration: 3000 });
      addLog(setToastLogs, '✓ Warning toast displayed');
    }},
    { label: 'Error Toast', handler: () => {
      err403.Toast.error({ title: 'Error', message: 'Error: Test failed', duration: 3000 });
      addLog(setToastLogs, '✓ Error toast displayed');
    }},
    { label: 'Toast with Sound', handler: () => {
      err403.Toast.success({ title: 'Sound Test', message: 'Toast with sound!', sound: true, duration: 3000 });
      addLog(setToastLogs, '✓ Toast with sound displayed');
    }},
    { label: 'Stack Multiple', handler: () => {
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => {
          err403.Toast.info({ message: `Toast ${i} of 5`, duration: 5000 });
        }, i * 200);
      }
      addLog(setToastLogs, '✓ Multiple toasts stacked');
    }},
    { label: 'Auto-Dismiss (2s)', handler: () => {
      err403.Toast.info({ message: 'Auto-dismiss in 2 seconds', duration: 2000 });
      addLog(setToastLogs, '✓ Auto-dismiss toast started');
      setTimeout(() => addLog(setToastLogs, '✓ Toast auto-dismissed'), 2500);
    }}
  ];

  // Modal Tests
  const modalTests = [
    { label: 'Basic Modal', handler: () => {
      const modal = new err403.Modal({
        title: 'Basic Modal Test',
        message: 'This is a basic modal for testing.',
        buttons: [new err403.Button('OK', () => addLog(setModalLogs, '✓ Basic modal closed'), true)]
      });
      modal.show();
      addLog(setModalLogs, '✓ Basic modal opened');
    }},
    { label: 'Form Modal', handler: () => {
      const modal = new err403.Modal({
        title: 'Form Test',
        fields: [
          new err403.Input({ id: 'email', label: 'Email', type: 'text', required: true }),
          new err403.Input({ id: 'age', label: 'Age', type: 'number', extraAttributes: { min: 18, max: 100 } })
        ],
        buttons: [
          new err403.Button('Cancel', () => addLog(setModalLogs, 'Form cancelled')),
          new err403.Button('Submit', () => {
            const data = modal.getFieldValues();
            addLog(setModalLogs, `✓ Form submitted: ${JSON.stringify(data)}`);
          }, true)
        ]
      });
      modal.show();
      addLog(setModalLogs, '✓ Form modal opened');
    }},
    { label: 'Tabbed Modal', handler: () => {
      const modal = new err403.Modal({
        title: 'Tabbed Modal Test',
        fields: [
          new err403.Group({
            id: 'tabs', asTabs: true, fields: [
              new err403.Group({ id: 'tab1', label: 'General', fields: [
                new err403.Input({ id: 'name', label: 'Name', type: 'text' })
              ]}),
              new err403.Group({ id: 'tab2', label: 'Details', fields: [
                new err403.MultiLine({ id: 'desc', label: 'Description', rows: 4 })
              ]})
            ]
          })
        ],
        buttons: [new err403.Button('Close', () => addLog(setModalLogs, '✓ Tabbed modal closed'), true)]
      });
      modal.show();
      addLog(setModalLogs, '✓ Tabbed modal opened');
    }},
    { label: 'Side Cart Modal', handler: () => {
      err403.Modal.open({
        title: 'Side Cart Test',
        message: 'Main content with side panel',
        sideCart: {
          enabled: true, position: 'right', width: 300,
          content: '<div style="padding:20px"><h3>Side Panel</h3><p>Additional info here</p></div>'
        },
        buttons: [new err403.Button('Close', () => addLog(setModalLogs, '✓ Side cart modal closed'), true)]
      });
      addLog(setModalLogs, '✓ Side cart modal opened');
    }},
    { label: 'Draggable Modal', handler: () => {
      const modal = new err403.Modal({
        title: 'Draggable Test',
        message: 'Drag this modal by the title bar!',
        draggable: true,
        buttons: [new err403.Button('Close', () => addLog(setModalLogs, '✓ Draggable modal closed'), true)]
      });
      modal.show();
      addLog(setModalLogs, '✓ Draggable modal opened');
    }},
    { label: 'Nested Modals', handler: () => {
      const modal1 = new err403.Modal({
        title: 'First Modal',
        message: 'This is the first modal',
        buttons: [new err403.Button('Open Second', () => {
          const modal2 = new err403.Modal({
            title: 'Second Modal',
            message: 'Nested inside first modal',
            buttons: [new err403.Button('Close', () => addLog(setModalLogs, '✓ Second modal closed'), true)]
          });
          modal2.show();
          addLog(setModalLogs, '✓ Second modal opened (nested)');
          return false;
        }, true)]
      });
      modal1.show();
      addLog(setModalLogs, '✓ First modal opened');
    }}
  ];

  // Advanced Modal Tests
  const advancedModalTests = [
    { label: 'Modal.alert()', handler: () => {
      err403.Modal.alert('Alert', 'This is an alert message').then(() => {
        addLog(setAdvancedModalLogs, '✓ Alert closed');
      });
      addLog(setAdvancedModalLogs, '✓ Alert displayed');
    }},
    { label: 'Modal.confirm()', handler: () => {
      err403.Modal.confirm('Confirm', 'Are you sure?').then((result: boolean) => {
        addLog(setAdvancedModalLogs, result ? '✓ User clicked OK' : '✓ User clicked Cancel');
      });
      addLog(setAdvancedModalLogs, '✓ Confirmation dialog displayed');
    }},
    { label: 'Validation Form', handler: () => {
      const modal = new err403.Modal({
        title: 'Validation Test',
        fields: [
          new err403.Input({
            id: 'email', label: 'Email', type: 'email', required: true,
            validation: { rules: [{ type: 'required' }, { type: 'email', message: 'Must be valid email' }], showErrors: true }
          }),
          new err403.Input({
            id: 'password', label: 'Password', type: 'password', required: true,
            validation: { rules: [{ type: 'minLength', value: 8, message: 'Min 8 characters' }], showErrors: true }
          })
        ],
        buttons: [
          new err403.Button('Cancel', () => {}),
          new err403.Button('Submit', () => {
            if (modal.validateAllFields()) {
              addLog(setAdvancedModalLogs, '✓ Validation passed');
              return true;
            } else {
              addLog(setAdvancedModalLogs, '✗ Validation failed', 'error');
              return false;
            }
          }, true)
        ]
      });
      modal.show();
      addLog(setAdvancedModalLogs, '✓ Validation modal opened');
    }},
    { label: 'Modal Sizes', handler: () => {
      const sizes = ['small', 'medium', 'large'];
      let i = 0;
      const showNext = () => {
        if (i >= sizes.length) return;
        const size = sizes[i];
        err403.Modal.open({
          title: `${size.toUpperCase()} Modal`,
          message: `This is a ${size} modal (${i + 1}/${sizes.length})`,
          size,
          buttons: [new err403.Button('Next', () => { i++; setTimeout(showNext, 300); }, true)]
        });
        addLog(setAdvancedModalLogs, `✓ ${size} modal opened`);
      };
      showNext();
    }},
    { label: 'Modal Icons', handler: () => {
      const icons = ['INFO', 'SUCCESS', 'WARNING', 'ERROR'];
      let i = 0;
      const showNext = () => {
        if (i >= icons.length) return;
        const icon = icons[i];
        err403.Modal.open({
          title: `${icon} Icon`,
          message: `Modal with ${icon} icon`,
          icon,
          buttons: [new err403.Button('Next', () => { i++; setTimeout(showNext, 300); }, true)]
        });
        addLog(setAdvancedModalLogs, `✓ ${icon} icon modal opened`);
      };
      showNext();
    }},
    { label: 'Destructive Button', handler: () => {
      const modal = new err403.Modal({
        title: 'Delete Account',
        message: 'This action cannot be undone.',
        icon: 'WARNING',
        buttons: [
          new err403.Button('Cancel', () => addLog(setAdvancedModalLogs, '✓ Cancelled')),
          new err403.Button('Delete', () => addLog(setAdvancedModalLogs, '✓ Destructive action confirmed'), true, false, true)
        ]
      });
      modal.show();
      addLog(setAdvancedModalLogs, '✓ Destructive button modal opened');
    }}
  ];

  // Lookup Tests
  const lookupTests = [
    { label: 'Basic Lookup', handler: () => {
      err403.Lookup.open({
        entity: 'account',
        columns: ['name', 'accountnumber', 'telephone1'],
        onSelect: (r: any[]) => addLog(setLookupLogs, `✓ Selected: ${r.map(x => x.name).join(', ')}`)
      });
      addLog(setLookupLogs, '✓ Basic lookup opened');
    }},
    { label: 'Multi-Select', handler: () => {
      err403.Lookup.open({
        entity: 'contact',
        columns: ['fullname', 'emailaddress1'],
        multiSelect: true,
        onSelect: (r: any[]) => addLog(setLookupLogs, `✓ Selected ${r.length} contact(s)`)
      });
      addLog(setLookupLogs, '✓ Multi-select lookup opened');
    }},
    { label: 'Custom Labels', handler: () => {
      err403.Lookup.open({
        entity: 'account',
        columns: ['name', 'accountnumber', 'revenue'],
        columnLabels: { name: 'Account Name', accountnumber: 'Account #', revenue: 'Annual Revenue' },
        onSelect: (r: any[]) => addLog(setLookupLogs, `✓ Selected: ${r[0]?.name || 'none'}`)
      });
      addLog(setLookupLogs, '✓ Custom labels lookup opened');
    }},
    { label: 'Search Fields', handler: () => {
      err403.Lookup.open({
        entity: 'account',
        columns: ['name', 'accountnumber'],
        searchFields: ['name', 'accountnumber'],
        onSelect: () => addLog(setLookupLogs, '✓ Search test completed')
      });
      addLog(setLookupLogs, '✓ Search lookup opened - try typing');
    }}
  ];

  // Logger Tests
  const loggerTests = [
    { label: 'TRACE Log', handler: () => {
      console.debug(...err403.TRACE, 'Test trace log', { data: 'test' });
      addLog(setLoggerLogs, '✓ TRACE log written to console');
    }},
    { label: 'WAR Log', handler: () => {
      console.debug(...err403.WAR, 'Test warning log');
      addLog(setLoggerLogs, '✓ WAR log written to console');
    }},
    { label: 'ERR Log', handler: () => {
      console.error(...err403.ERR, 'Test error log', new Error('Test'));
      addLog(setLoggerLogs, '✓ ERR log written to console');
    }},
    { label: 'Multiple Logs', handler: () => {
      console.debug(...err403.TRACE, 'Debug');
      console.debug(...err403.WAR, 'Warning');
      console.error(...err403.ERR, 'Error');
      addLog(setLoggerLogs, '✓ Multiple logs written - check browser console');
    }}
  ];

  // Table Tests
  const tableTests = [
    { label: 'Simple Table', handler: () => {
      const modal = new err403.Modal({
        title: 'Simple Table',
        size: 'medium',
        fields: [new err403.Table({
          id: 'table1',
          columns: [
            { id: 'name', header: 'Name', sortable: true },
            { id: 'age', header: 'Age', sortable: true }
          ],
          data: [{ id: 1, name: 'Alice', age: 30 }, { id: 2, name: 'Bob', age: 25 }],
          selectionMode: 'none'
        })],
        buttons: [new err403.Button('Close', () => {}, true)]
      });
      modal.show();
      addLog(setTableLogs, '✓ Simple table displayed');
    }},
    { label: 'Sortable Table', handler: () => {
      const modal = new err403.Modal({
        title: 'Sortable Table',
        size: 'medium',
        fields: [new err403.Table({
          id: 'table2',
          columns: [
            { id: 'name', header: 'Name', sortable: true },
            { id: 'score', header: 'Score', sortable: true }
          ],
          data: [
            { id: 1, name: 'Zebra', score: 85 },
            { id: 2, name: 'Apple', score: 92 },
            { id: 3, name: 'Mango', score: 78 }
          ],
          selectionMode: 'none'
        })],
        buttons: [new err403.Button('Close', () => {}, true)]
      });
      modal.show();
      addLog(setTableLogs, '✓ Sortable table - click column headers');
    }},
    { label: 'Single Select', handler: () => {
      const modal = new err403.Modal({
        title: 'Single Selection',
        fields: [new err403.Table({
          id: 'table3',
          columns: [{ id: 'product', header: 'Product', sortable: true }, { id: 'price', header: 'Price' }],
          data: [{ id: 1, product: 'Laptop', price: 1200 }, { id: 2, product: 'Mouse', price: 25 }],
          selectionMode: 'single',
          onRowSelect: (rows: any[]) => rows.length && addLog(setTableLogs, `→ Selected: ${rows[0].product}`)
        })],
        buttons: [new err403.Button('Close', () => {}, true)]
      });
      modal.show();
      addLog(setTableLogs, '✓ Single selection table');
    }},
    { label: 'Multi Select', handler: () => {
      const modal = new err403.Modal({
        title: 'Multi Selection',
        fields: [new err403.Table({
          id: 'table4',
          columns: [{ id: 'task', header: 'Task' }, { id: 'status', header: 'Status' }],
          data: [
            { id: 1, task: 'Design', status: 'Done' },
            { id: 2, task: 'Code', status: 'In Progress' },
            { id: 3, task: 'Test', status: 'Pending' }
          ],
          selectionMode: 'multiple',
          onRowSelect: (rows: any[]) => addLog(setTableLogs, `→ ${rows.length} row(s) selected`)
        })],
        buttons: [new err403.Button('Close', () => {}, true)]
      });
      modal.show();
      addLog(setTableLogs, '✓ Multi selection table');
    }}
  ];

  // Integration Tests
  const integrationTests = [
    { label: 'Modal + Toast', handler: () => {
      err403.Modal.open({
        title: 'Integration Test',
        message: 'Click OK to show a toast',
        buttons: [new err403.Button('OK', () => {
          err403.Toast.success({ title: 'Success', message: 'Modal closed, toast shown!' });
          addLog(setIntegrationLogs, '✓ Modal closed, toast displayed');
        }, true)]
      });
      addLog(setIntegrationLogs, '✓ Integration modal opened');
    }},
    { label: 'Lookup in Modal', handler: () => {
      err403.Modal.open({
        title: 'Select Account',
        fields: [new err403.Input({ id: 'selected', label: 'Selected Account', disabled: true })],
        buttons: [
          new err403.Button('Open Lookup', () => {
            err403.Lookup.open({
              entity: 'account',
              columns: ['name'],
              onSelect: (r: any[]) => {
                addLog(setIntegrationLogs, `✓ Lookup in modal: ${r[0]?.name || 'none'}`);
              }
            });
            return false;
          }, true),
          new err403.Button('Close', () => {})
        ]
      });
      addLog(setIntegrationLogs, '✓ Modal with lookup opened');
    }},
    { label: 'Run All Auto Tests', handler: () => {
      addLog(setIntegrationLogs, '🚀 Running automated tests...', 'info');
      let count = 0;

      // Run toast tests
      err403.Toast.success({ message: 'Test 1', duration: 1000 }); count++;
      err403.Toast.info({ message: 'Test 2', duration: 1000 }); count++;
      err403.Toast.warn({ message: 'Test 3', duration: 1000 }); count++;
      err403.Toast.error({ message: 'Test 4', duration: 1000 }); count++;

      // Run logger tests
      console.debug(...err403.TRACE, 'Auto test'); count++;
      console.debug(...err403.WAR, 'Auto test'); count++;
      console.error(...err403.ERR, 'Auto test'); count++;

      setTimeout(() => {
        addLog(setIntegrationLogs, `✓ Completed ${count} automated tests`);
        addLog(setIntegrationLogs, 'ℹ Manual tests require user interaction', 'info');
      }, 1500);
    }}
  ];

  return (
    <Layout currentPage="tests" version={typeof PACKAGE_VERSION !== 'undefined' ? PACKAGE_VERSION : undefined}>
      <div className="d365-page-title">
        <h1 className="d365-page-title__heading">Test Suite</h1>
        <p className="d365-page-title__subtitle">
          Automated and manual tests for the err403 UI Library components
        </p>
      </div>

      <div className="d365-note d365-note--info" style={{ marginBottom: '24px' }}>
        <span className="d365-note__icon">ℹ️</span>
        <span>Click the buttons below to run individual tests. Results appear in the console below each section.</span>
      </div>

      <div className="d365-card-grid">
        <TestCard
          title="Toast Component Tests"
          tests={toastTests}
          logs={toastLogs}
          onClear={() => setToastLogs([])}
        />
        <TestCard
          title="Modal Component Tests"
          tests={modalTests}
          logs={modalLogs}
          onClear={() => setModalLogs([])}
        />
        <TestCard
          title="Advanced Modal Tests"
          tests={advancedModalTests}
          logs={advancedModalLogs}
          onClear={() => setAdvancedModalLogs([])}
        />
        <TestCard
          title="Lookup Component Tests"
          description="Uses mock data in demo. In D365, fetches real entity records."
          tests={lookupTests}
          logs={lookupLogs}
          onClear={() => setLookupLogs([])}
        />
        <TestCard
          title="Logger Utility Tests"
          description="Open browser console (F12) to see styled outputs."
          tests={loggerTests}
          logs={loggerLogs}
          onClear={() => setLoggerLogs([])}
        />
        <TestCard
          title="Table Component Tests"
          tests={tableTests}
          logs={tableLogs}
          onClear={() => setTableLogs([])}
        />
        <TestCard
          title="Integration Tests"
          tests={integrationTests}
          logs={integrationLogs}
          onClear={() => setIntegrationLogs([])}
        />
      </div>
    </Layout>
  );
};

export default Tests;
