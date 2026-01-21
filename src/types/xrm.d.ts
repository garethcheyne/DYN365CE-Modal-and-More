/**
 * Xrm type declarations for D365 CE
 */

declare global {
  interface Window {
    Xrm?: {
      Utility?: {
        getEntityMetadata?: (entityName: string, attributes?: string[]) => Promise<any>;
      };
      WebApi?: {
        retrieveMultipleRecords?: (entityName: string, options?: string) => Promise<any>;
      };
    };
    AudioContext?: any;
    webkitAudioContext?: any;
    Toast?: {
      success: (titleOrOptions: string | any, message?: string, duration?: number) => { show: () => void; close: () => void; };
      error: (titleOrOptions: string | any, message?: string, duration?: number) => { show: () => void; close: () => void; };
      warn: (titleOrOptions: string | any, message?: string, duration?: number) => { show: () => void; close: () => void; };
      info: (titleOrOptions: string | any, message?: string, duration?: number) => { show: () => void; close: () => void; };
      default: (titleOrOptions: string | any, message?: string, duration?: number) => { show: () => void; close: () => void; };
    };
  }
}

export {};
