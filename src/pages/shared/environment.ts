/**
 * Environment Detection Utility
 * Detects if running in Dynamics 365 environment and provides live data capabilities
 */

export interface D365Environment {
  /** Whether Xrm global is available */
  hasXrm: boolean;
  /** Whether Xrm.WebApi is available for data operations */
  hasWebApi: boolean;
  /** Whether running in D365 iframe context */
  isD365Context: boolean;
  /** Detected organization name (if available) */
  orgName?: string;
  /** Detected org URL (if available) */
  orgUrl?: string;
  /** User name (if available) */
  userName?: string;
  /** User ID (if available) */
  userId?: string;
  /** Environment type description */
  environmentType: 'dynamics365' | 'standalone' | 'unknown';
}

/**
 * Detect the current environment
 */
export function detectEnvironment(): D365Environment {
  const win = window as any;
  const xrm = win.Xrm;
  
  const hasXrm = typeof xrm !== 'undefined' && xrm !== null;
  const hasWebApi = hasXrm && typeof xrm.WebApi !== 'undefined';
  
  // Check for D365 context indicators
  const isD365Context = hasXrm || 
    typeof win.GetGlobalContext === 'function' ||
    typeof win.parent?.Xrm !== 'undefined' ||
    typeof win.top?.Xrm !== 'undefined';

  let orgName: string | undefined;
  let orgUrl: string | undefined;
  let userName: string | undefined;
  let userId: string | undefined;

  if (hasXrm) {
    try {
      const context = xrm.Utility?.getGlobalContext?.() || win.GetGlobalContext?.();
      if (context) {
        orgName = context.organizationSettings?.uniqueName;
        orgUrl = context.getClientUrl?.();
        userName = context.userSettings?.userName;
        userId = context.userSettings?.userId;
      }
    } catch (e) {
      // Context not available
    }
  }

  return {
    hasXrm,
    hasWebApi,
    isD365Context,
    orgName,
    orgUrl,
    userName,
    userId,
    environmentType: hasXrm ? 'dynamics365' : (isD365Context ? 'unknown' : 'standalone')
  };
}

/**
 * Check if we can use live D365 data
 */
export function canUseLiveData(): boolean {
  const env = detectEnvironment();
  return env.hasWebApi;
}

/**
 * Get mock data for standalone demo mode
 */
export const mockData = {
  accounts: [
    { id: '1', name: 'Contoso Ltd', accountnumber: 'ACC-001', telephone1: '555-0100', emailaddress1: 'info@contoso.com', address1_city: 'Seattle' },
    { id: '2', name: 'Fabrikam Inc', accountnumber: 'ACC-002', telephone1: '555-0200', emailaddress1: 'info@fabrikam.com', address1_city: 'Portland' },
    { id: '3', name: 'Adventure Works', accountnumber: 'ACC-003', telephone1: '555-0300', emailaddress1: 'info@adventure.com', address1_city: 'San Francisco' },
    { id: '4', name: 'Northwind Traders', accountnumber: 'ACC-004', telephone1: '555-0400', emailaddress1: 'info@northwind.com', address1_city: 'Chicago' },
    { id: '5', name: 'Wide World Importers', accountnumber: 'ACC-005', telephone1: '555-0500', emailaddress1: 'info@wideworld.com', address1_city: 'New York' },
    { id: '6', name: 'Tailspin Toys', accountnumber: 'ACC-006', telephone1: '555-0600', emailaddress1: 'info@tailspin.com', address1_city: 'Boston' },
    { id: '7', name: 'Alpine Ski House', accountnumber: 'ACC-007', telephone1: '555-0700', emailaddress1: 'info@alpine.com', address1_city: 'Denver' },
    { id: '8', name: 'City Power & Light', accountnumber: 'ACC-008', telephone1: '555-0800', emailaddress1: 'info@citypower.com', address1_city: 'Houston' }
  ],
  contacts: [
    { id: '1', fullname: 'John Doe', emailaddress1: 'john.doe@contoso.com', telephone1: '555-1001', jobtitle: 'Sales Manager' },
    { id: '2', fullname: 'Jane Smith', emailaddress1: 'jane.smith@fabrikam.com', telephone1: '555-1002', jobtitle: 'Marketing Director' },
    { id: '3', fullname: 'Bob Johnson', emailaddress1: 'bob.j@adventure.com', telephone1: '555-1003', jobtitle: 'IT Administrator' },
    { id: '4', fullname: 'Alice Williams', emailaddress1: 'alice.w@northwind.com', telephone1: '555-1004', jobtitle: 'HR Manager' },
    { id: '5', fullname: 'Charlie Brown', emailaddress1: 'charlie.b@wideworld.com', telephone1: '555-1005', jobtitle: 'CFO' },
    { id: '6', fullname: 'Diana Prince', emailaddress1: 'diana.p@tailspin.com', telephone1: '555-1006', jobtitle: 'CEO' }
  ],
  products: [
    { id: '1', name: 'Surface Laptop 5', productnumber: 'SL5-001', price: 1299.00, quantityonhand: 45, productcategoryid: 'Hardware' },
    { id: '2', name: 'Office 365 E3', productnumber: 'O365-E3', price: 20.00, quantityonhand: 999, productcategoryid: 'Software' },
    { id: '3', name: 'Azure Credits', productnumber: 'AZ-100', price: 100.00, quantityonhand: 500, productcategoryid: 'Cloud' },
    { id: '4', name: 'Dynamics 365 Sales', productnumber: 'D365-S', price: 65.00, quantityonhand: 150, productcategoryid: 'CRM' },
    { id: '5', name: 'Power BI Pro', productnumber: 'PBI-PRO', price: 10.00, quantityonhand: 800, productcategoryid: 'Analytics' }
  ]
};

/**
 * Environment badge styles
 */
export const environmentStyles = {
  dynamics365: {
    background: '#107c10',
    color: '#ffffff',
    icon: '✓',
    label: 'D365 Connected'
  },
  standalone: {
    background: '#0078d4',
    color: '#ffffff',
    icon: '◎',
    label: 'Demo Mode'
  },
  unknown: {
    background: '#797600',
    color: '#ffffff',
    icon: '?',
    label: 'Unknown'
  }
};
