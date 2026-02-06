/**
 * Shared Fluent UI Styles
 * Centralized makeStyles for consistent styling across all components
 *
 * Usage:
 *   import { useSharedStyles } from './sharedStyles';
 *   const sharedStyles = useSharedStyles();
 *   <div className={sharedStyles.labelWithTooltip}>...</div>
 */

import { makeStyles, tokens, shorthands } from '@fluentui/react-components';

/**
 * Common styles shared across all FluentUi components
 */
export const useSharedStyles = makeStyles({
  // Field wrapper with consistent bottom margin
  field: {
    marginBottom: tokens.spacingVerticalS, // 8px
  },

  // Label with inline tooltip icon
  labelWithTooltip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS, // 4px
  },

  // Tooltip info icon styling
  tooltipIcon: {
    color: tokens.colorNeutralForeground2, // #605e5c
    cursor: 'help',
  },

  // Full width input/dropdown
  fullWidth: {
    width: '100%',
  },

  // Flex container for input with button
  inputWithButton: {
    display: 'flex',
    gap: '0',
    width: '100%',
  },

  // Badge/pill button container
  badgeContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS, // 8px
    alignItems: 'center',
  },

  // Badge/pill button styling
  badgeButton: {
    ...shorthands.borderRadius(tokens.borderRadiusCircular), // 16px pill shape
    minWidth: 'auto',
    paddingLeft: tokens.spacingHorizontalM, // 16px
    paddingRight: tokens.spacingHorizontalM,
    fontSize: tokens.fontSizeBase300, // 14px
  },

  // Badge button selected state (add fontWeight via style prop)
  badgeButtonSelected: {
    fontWeight: tokens.fontWeightSemibold, // 600
  },

  // Badge button unselected state
  badgeButtonUnselected: {
    fontWeight: tokens.fontWeightRegular, // 400
  },
});

/**
 * Lookup-specific styles for dropdown and popover
 */
export const useLookupStyles = makeStyles({
  // Popover surface
  popoverSurface: {
    maxHeight: '400px',
    overflowY: 'auto',
    ...shorthands.padding('0'),
    boxShadow: tokens.shadow4, // 0 2px 4px rgba(0, 0, 0, 0.1)
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1), // #d2d0ce
  },

  // Dropdown header with entity name
  dropdownHeader: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM), // 8px 12px
    backgroundColor: tokens.colorNeutralBackground2, // #faf9f8
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2), // #edebe9
    fontSize: tokens.fontSizeBase200, // 12px
    fontWeight: tokens.fontWeightSemibold, // 600
    color: tokens.colorNeutralForeground2, // #605e5c
    position: 'sticky' as const,
    top: 0,
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Expand all button in header
  expandAllButton: {
    fontSize: tokens.fontSizeBase100, // 11px
    minWidth: 'auto',
    ...shorthands.padding('2px', tokens.spacingHorizontalS), // 2px 8px
    height: '24px',
  },

  // Loading/empty/error states container
  stateContainer: {
    ...shorthands.padding(tokens.spacingVerticalM), // 16px
    textAlign: 'center' as const,
  },

  // Error state styling
  errorState: {
    ...shorthands.padding(tokens.spacingVerticalM), // 16px
    textAlign: 'center' as const,
    color: tokens.colorPaletteRedForeground1, // #d13438
    fontWeight: tokens.fontWeightSemibold, // 600
    backgroundColor: tokens.colorPaletteRedBackground1, // #fef6f6
    ...shorthands.borderLeft('3px', 'solid', tokens.colorPaletteRedForeground1),
  },

  // Error message text
  errorMessage: {
    fontSize: tokens.fontSizeBase200, // 12px
    fontWeight: tokens.fontWeightRegular, // 400
    color: tokens.colorPaletteRedForeground2, // #a4262c
  },

  // No results text
  noResults: {
    color: tokens.colorNeutralForeground2, // #605e5c
  },

  // Lookup option row
  optionRow: {
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2), // #edebe9
  },

  // Selected option row
  optionRowSelected: {
    backgroundColor: tokens.colorNeutralBackground3, // #f3f2f1
  },

  // Option row content
  optionRowContent: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM), // 8px 12px
    cursor: 'pointer',
    display: 'flex',
    gap: tokens.spacingHorizontalS, // 8px
    alignItems: 'center',
  },

  // Option row hover
  optionRowHover: {
    backgroundColor: tokens.colorNeutralBackground2, // #faf9f8
  },

  // Entity icon container
  entityIcon: {
    flexShrink: 0,
    width: '16px',
    height: '16px',
  },

  // Option content container
  optionContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    minWidth: 0,
  },

  // Primary text in option
  primaryText: {
    fontSize: tokens.fontSizeBase300, // 14px
    fontWeight: tokens.fontWeightSemibold, // 600
    color: tokens.colorNeutralForeground1, // #242424
    ...shorthands.overflow('hidden'),
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // Primary text label (gray prefix)
  primaryTextLabel: {
    color: tokens.colorNeutralForeground2, // #605e5c
    fontWeight: tokens.fontWeightRegular, // 400
  },

  // Secondary text in option
  secondaryText: {
    fontSize: tokens.fontSizeBase200, // 12px
    fontWeight: tokens.fontWeightRegular, // 400
    color: tokens.colorNeutralForeground2, // #605e5c
    ...shorthands.overflow('hidden'),
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  // Secondary text label (bold prefix)
  secondaryTextLabel: {
    fontWeight: tokens.fontWeightSemibold, // 600
  },

  // Expand/collapse chevron container
  chevronContainer: {
    flexShrink: 0,
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    ...shorthands.borderRadius(tokens.borderRadiusSmall), // 2px
    color: tokens.colorNeutralForeground2, // #605e5c
  },

  // Chevron hover state
  chevronHover: {
    backgroundColor: tokens.colorNeutralStroke2, // #edebe9
  },

  // Expanded additional columns container
  expandedColumns: {
    ...shorthands.padding('4px', tokens.spacingHorizontalM, tokens.spacingVerticalS, '36px'), // 4px 12px 8px 36px
    display: 'flex',
    flexDirection: 'column' as const,
    gap: tokens.spacingVerticalXS, // 4px
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2), // #edebe9
  },

  // Expanded columns background
  expandedColumnsDefault: {
    backgroundColor: tokens.colorNeutralBackground2, // #faf9f8
  },

  // Expanded columns when selected
  expandedColumnsSelected: {
    backgroundColor: tokens.colorNeutralBackground3, // #f3f2f1
  },

  // Additional column row
  additionalColumn: {
    fontSize: tokens.fontSizeBase200, // 12px
    color: tokens.colorNeutralForeground2, // #605e5c
    display: 'flex',
    gap: tokens.spacingHorizontalXS, // 4px
  },

  // Additional column label
  additionalColumnLabel: {
    fontWeight: tokens.fontWeightSemibold, // 600
    minWidth: '100px',
  },

  // Button with no left border radius (for input+button combo)
  buttonNoLeftRadius: {
    borderTopLeftRadius: '0',
    borderBottomLeftRadius: '0',
    minWidth: '32px',
    backgroundColor: tokens.colorNeutralBackground3, // #f3f2f1
    ...shorthands.borderColor('transparent'),
  },

  // Button with no right border radius
  buttonNoRightRadius: {
    borderTopRightRadius: '0',
    borderBottomRightRadius: '0',
    minWidth: '32px',
    backgroundColor: tokens.colorNeutralBackground3, // #f3f2f1
    ...shorthands.borderColor('transparent'),
    ...shorthands.borderRadius('0'),
  },

  // Input with no right border (for input+button combo)
  inputNoRightBorder: {
    width: '100%',
    borderTopRightRadius: '0',
    borderBottomRightRadius: '0',
    ...shorthands.borderRight('none'),
  },
});

/**
 * Token reference for documentation:
 *
 * Colors:
 * - tokens.colorNeutralForeground1    = #242424 (primary text)
 * - tokens.colorNeutralForeground2    = #605e5c (secondary text, icons)
 * - tokens.colorNeutralBackground1    = #ffffff (white background)
 * - tokens.colorNeutralBackground2    = #faf9f8 (subtle background)
 * - tokens.colorNeutralBackground3    = #f3f2f1 (hover/selected background)
 * - tokens.colorNeutralStroke1        = #d2d0ce (primary border)
 * - tokens.colorNeutralStroke2        = #edebe9 (subtle border)
 * - tokens.colorPaletteRedForeground1 = #d13438 (error text)
 * - tokens.colorPaletteRedForeground2 = #a4262c (error text darker)
 * - tokens.colorPaletteRedBackground1 = #fef6f6 (error background)
 *
 * Spacing:
 * - tokens.spacingVerticalXS          = 4px
 * - tokens.spacingVerticalS           = 8px
 * - tokens.spacingVerticalM           = 12px
 * - tokens.spacingHorizontalXS        = 4px
 * - tokens.spacingHorizontalS         = 8px
 * - tokens.spacingHorizontalM         = 12px
 *
 * Typography:
 * - tokens.fontSizeBase100            = 10px
 * - tokens.fontSizeBase200            = 12px
 * - tokens.fontSizeBase300            = 14px
 * - tokens.fontWeightRegular          = 400
 * - tokens.fontWeightSemibold         = 600
 *
 * Border Radius:
 * - tokens.borderRadiusSmall          = 2px
 * - tokens.borderRadiusMedium         = 4px
 * - tokens.borderRadiusCircular       = 9999px (pill shape)
 */
