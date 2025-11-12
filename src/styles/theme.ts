/**
 * Fluent UI-inspired design tokens
 * Custom theme for D365 CE UI Library
 */

export const theme = {
  colors: {
    // Primary colors
    primary: '#0078d4',
    primaryHover: '#106ebe',
    primaryPressed: '#005a9e',
    
    // Semantic colors
    success: '#107c10',
    error: '#a80000',
    warning: '#f3f2f1',
    info: '#0078d4',
    
    // Neutral palette
    neutralPrimary: '#323130',
    neutralSecondary: '#605e5c',
    neutralTertiary: '#a19f9d',
    neutralLight: '#edebe9',
    neutralLighter: '#f3f2f1',
    neutralLighterAlt: '#faf9f8',
    white: '#ffffff',
    
    // Toast-specific colors
    toast: {
      success: {
        bg: 'rgba(16, 124, 16, 0.9)',
        border: '#107c10',
        text: '#ffffff'
      },
      error: {
        bg: 'rgba(168, 0, 0, 0.9)',
        border: '#a80000',
        text: '#ffffff'
      },
      warn: {
        bg: 'rgba(255, 185, 0, 0.9)',
        border: '#ffb900',
        text: '#323130'
      },
      info: {
        bg: 'rgba(0, 120, 212, 0.9)',
        border: '#0078d4',
        text: '#ffffff'
      },
      default: {
        bg: 'rgba(50, 49, 48, 0.95)',
        border: '#323130',
        text: '#ffffff'
      }
    },
    
    // Modal-specific colors
    modal: {
      background: '#ffffff',
      text: '#323130',
      textSecondary: '#605e5c',
      border: '#edebe9',
      overlay: 'rgba(0, 0, 0, 0.4)',
      headerBackground: '#ffffff',
      footerBackground: '#ffffff',
      divider: '#edebe9',
      
      // Button colors
      primary: '#0078d4',
      primaryHover: '#106ebe',
      primaryPressed: '#005a9e',
      primaryText: '#ffffff',
      
      secondary: 'transparent',
      secondaryBorder: '#8a8886',
      secondaryText: '#323130',
      secondaryHover: '#f3f2f1',
      secondaryPressed: '#edebe9',
      
      danger: '#a80000',
      dangerHover: '#750b0b',
      dangerPressed: '#5a0000',
      dangerText: '#ffffff',
      
      // Input colors (D365 style - gray background)
      inputBackground: '#faf9f8',
      inputBorder: 'transparent',
      inputBorderBottom: '#8a8886',
      inputBorderHover: '#323130',
      inputBorderFocus: '#0078d4',
      inputText: '#323130',
      inputPlaceholder: '#605e5c',
      inputDisabled: '#f0f0f0',
      
      // Tab colors
      tabBorder: '#edebe9',
      tabActive: '#0078d4',
      tabActiveBorder: '#0078d4',
      tabInactive: '#323130',
      tabInactiveBorder: 'transparent',
      tabHover: '#106ebe',
      tabBackground: '#ffffff',
      tabSelectedBackground: '#ffffff',
      
      // Progress colors
      progress: {
        bar: '#0078d4',
        barBackground: '#edebe9',
        stepActive: '#0078d4',
        stepCompleted: '#107c10',
        stepPending: '#d2d0ce',
        stepText: '#323130',
        stepBorder: '#8a8886'
      },
      
      // Side cart colors
      sideCart: {
        background: '#faf9f8',
        border: '#edebe9',
        text: '#323130'
      }
    }
  },
  
  shadows: {
    toast: '0 0 2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.14)',
    modal: '0 0 2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.14)',
    dropdown: '0 0 2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.14)',
    card: '0 0 2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.14)',
    depth8: '0 0 2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.14)',
    depth16: '0 0 2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.14)',
    depth64: '0 0 2px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.14)'
  },
  
  borderRadius: {
    none: '0px',
    small: '4px',      // D365 input fields use 4px radius (borderRadiusMedium)
    medium: '8px',     // D365 modals/toasts use 8px radius
    large: '8px',      // D365 larger elements
    circular: '50%'
  },
  
  typography: {
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', sans-serif",
    fontSize: {
      caption: '12px',
      body: '14px',
      subtitle: '16px',
      title: '18px',
      large: '20px',
      xLarge: '24px'
    },
    fontWeight: {
      regular: 400,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      caption: '16px',
      body: '20px',
      subtitle: '22px',
      title: '24px'
    }
  },
  
  spacing: {
    none: '0px',
    xxs: '2px',
    xs: '4px',
    sNudge: '6px',
    s: '8px',
    mNudge: '10px',
    m: '12px',
    l: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px'
  },
  
  zIndex: {
    toast: 999999,
    modal: 999998,
    modalOverlay: 999997,
    dropdown: 1000
  }
};
