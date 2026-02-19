/**
 * Builder Icons - Fluent UI icon mappings for Modal Builder
 */

import React from 'react';
import {
  TextT24Regular,
  Mail24Regular,
  NumberSymbol24Regular,
  DocumentText24Regular,
  CalendarLtr24Regular,
  ChevronDown24Regular,
  CheckboxChecked24Regular,
  ToggleLeft24Regular,
  Search24Regular,
  TableSimple24Regular,
  Attach24Regular,
  LineHorizontal124Regular,
  GroupList24Regular,
  Code24Regular,
  Save24Regular,
  FolderOpen24Regular,
  ArrowDownload24Regular,
  Add24Regular,
  Settings24Regular,
  ArrowSync24Regular,
  Copy24Regular,
  Checkmark24Regular,
  DocumentCopy24Regular,
  Delete24Regular,
  ReOrderDotsVertical24Regular,
  FormNew24Regular,
  ListBar24Regular,
  CheckmarkCircle24Regular,
  Info24Regular,
  Warning24Regular,
  ErrorCircle24Regular,
  Location24Regular,
  TabDesktop24Regular,
} from '@fluentui/react-icons';
import { FieldType } from './types';

// Map field types to Fluent UI icons
export const getFieldIcon = (type: FieldType): React.ReactElement => {
  const iconMap: Record<FieldType, React.ReactElement> = {
    text: <TextT24Regular />,
    email: <Mail24Regular />,
    number: <NumberSymbol24Regular />,
    textarea: <DocumentText24Regular />,
    date: <CalendarLtr24Regular />,
    select: <ChevronDown24Regular />,
    checkbox: <CheckboxChecked24Regular />,
    switch: <ToggleLeft24Regular />,
    lookup: <Search24Regular />,
    table: <TableSimple24Regular />,
    file: <Attach24Regular />,
    addressLookup: <Location24Regular />,
    range: <LineHorizontal124Regular />,
    group: <GroupList24Regular />,
    tabs: <TabDesktop24Regular />,
    custom: <Code24Regular />,
  };

  return iconMap[type] || <TextT24Regular />;
};

// Icon overrides for templates that share the same type
const iconOverrides: Record<string, React.ReactElement> = {
  tabs: <TabDesktop24Regular />,
};

// Get icon for a template (supports iconOverride)
export const getTemplateIcon = (type: FieldType, iconOverride?: string): React.ReactElement => {
  if (iconOverride && iconOverrides[iconOverride]) {
    return iconOverrides[iconOverride];
  }
  return getFieldIcon(type);
};

// Toolbar icons
export const ToolbarIcons = {
  save: <Save24Regular />,
  load: <FolderOpen24Regular />,
  import: <ArrowDownload24Regular />,
  add: <Add24Regular />,
  settings: <Settings24Regular />,
  reset: <ArrowSync24Regular />,
  copy: <Copy24Regular />,
  copied: <Checkmark24Regular />,
  duplicate: <DocumentCopy24Regular />,
  delete: <Delete24Regular />,
  dragHandle: <ReOrderDotsVertical24Regular />,
  singlePage: <FormNew24Regular />,
  multiStep: <ListBar24Regular />,
  emptyCanvas: <FormNew24Regular />,
} as const;

// Alert type icons
export const AlertIcons = {
  success: <CheckmarkCircle24Regular />,
  info: <Info24Regular />,
  warning: <Warning24Regular />,
  error: <ErrorCircle24Regular />,
} as const;
