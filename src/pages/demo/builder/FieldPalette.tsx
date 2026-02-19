/**
 * Field Palette - Draggable field templates
 */

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { makeStyles, tokens, Text } from '@fluentui/react-components';
import { FIELD_TEMPLATES, FieldTemplate, FieldType, FieldCategory } from './types';
import { getTemplateIcon } from './icons';

const useStyles = makeStyles({
  palette: {
    display: 'flex',
    flexDirection: 'column',
    width: '220px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  hint: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  section: {
    padding: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalS,
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    padding: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    cursor: 'grab',
    fontSize: tokens.fontSizeBase200,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      borderTopColor: tokens.colorBrandStroke1,
      borderRightColor: tokens.colorBrandStroke1,
      borderBottomColor: tokens.colorBrandStroke1,
      borderLeftColor: tokens.colorBrandStroke1,
    },
  },
  itemDragging: {
    opacity: 0.5,
    cursor: 'grabbing',
  },
  itemIcon: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorBrandForeground1,
  },
  itemLabel: {
    fontSize: tokens.fontSizeBase200,
  },
});

interface DraggableFieldProps {
  template: FieldTemplate;
  styles: ReturnType<typeof useStyles>;
}

const DraggableField: React.FC<DraggableFieldProps> = ({ template, styles }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${template.type}`,
    data: { type: 'palette', template },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`${styles.item} ${isDragging ? styles.itemDragging : ''}`}
      title={template.description}
    >
      <span className={styles.itemIcon}>{getTemplateIcon(template.type, template.iconOverride)}</span>
      <Text className={styles.itemLabel}>{template.label}</Text>
    </div>
  );
};

interface FieldPaletteProps {
  onFieldAdd?: (type: FieldType) => void;
}

// Category display configuration
const CATEGORY_CONFIG: Record<FieldCategory, { title: string; order: number }> = {
  text: { title: 'Text Input', order: 1 },
  choice: { title: 'Choice', order: 2 },
  d365: { title: 'D365 Components', order: 3 },
  layout: { title: 'Layout', order: 4 },
};

export const FieldPalette: React.FC<FieldPaletteProps> = ({ onFieldAdd }) => {
  const styles = useStyles();

  // Group templates by category using the category property
  const templatesByCategory = FIELD_TEMPLATES.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<FieldCategory, FieldTemplate[]>);

  // Get sorted categories
  const sortedCategories = (Object.keys(templatesByCategory) as FieldCategory[])
    .sort((a, b) => CATEGORY_CONFIG[a].order - CATEGORY_CONFIG[b].order);

  return (
    <div className={styles.palette}>
      <div className={styles.header}>
        <Text weight="semibold" size={400}>Fields</Text>
        <Text className={styles.hint}>Drag to add</Text>
      </div>

      {sortedCategories.map(category => (
        <div key={category} className={styles.section}>
          <Text className={styles.sectionTitle}>{CATEGORY_CONFIG[category].title}</Text>
          <div className={styles.grid}>
            {templatesByCategory[category].map(template => (
              <DraggableField key={template.type} template={template} styles={styles} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FieldPalette;
