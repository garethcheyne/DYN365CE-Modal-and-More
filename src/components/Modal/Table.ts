/**
 * Table field component for Modal
 * Displays tabular data with sorting, selection, and customizable columns
 */

import { FieldConfig } from './Modal.types';
import { theme } from '../../styles/theme';
import { getTargetDocument } from '../../utils/dom';
import { React, CheckboxFluentUi, mountFluentComponent, defaultTheme } from '../FluentUi';

export class Table {
    private config: FieldConfig;
    private container!: HTMLElement;
    private selectedRows: Set<number> = new Set();
    private sortColumn: string | null = null;
    private sortDescending: boolean = false;
    private currentData: any[] = [];

    constructor(config: FieldConfig) {
        this.config = {
            selectionMode: 'none',
            columns: [],
            data: [],
            ...config
        };
        this.currentData = [...(this.config.data || [])];
    }

    /**
     * Render the table component
     */
    public render(): HTMLElement {
        const doc = getTargetDocument();
        this.container = doc.createElement('div');
        this.container.className = 'err403-table-container';
        this.container.setAttribute('data-field-id', this.config.id);

        // Add label if provided
        if (this.config.label) {
            const label = doc.createElement('label');
            label.className = 'err403-field-label';
            label.textContent = this.config.label;
            if (this.config.required) {
                label.classList.add('required');
            }
            this.container.appendChild(label);
        }

        // Create table wrapper
        const tableWrapper = doc.createElement('div');
        tableWrapper.className = 'err403-table-wrapper';
        tableWrapper.style.cssText = `
            overflow: auto;
            border: 1px solid ${theme.colors.modal.border};
            border-radius: ${theme.borderRadius.small};
            max-height: 400px;
        `;

        // Create table
        const table = doc.createElement('table');
        table.className = 'err403-table';
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            background: ${theme.colors.modal.background};
        `;

        // Create header
        const thead = this.createHeader();
        table.appendChild(thead);

        // Create body
        const tbody = this.createBody();
        table.appendChild(tbody);

        tableWrapper.appendChild(table);
        this.container.appendChild(tableWrapper);

        return this.container;
    }

    /**
     * Create table header
     */
    private createHeader(): HTMLElement {
        const doc = getTargetDocument();
        const thead = doc.createElement('thead');
        const tr = doc.createElement('tr');
        tr.style.cssText = `
            background: ${theme.colors.neutralLighterAlt};
            border-bottom: 2px solid ${theme.colors.modal.border};
        `;

        // Add selection column if needed
        if (this.config.selectionMode !== 'none') {
            const th = doc.createElement('th');
            th.style.cssText = `
                padding: 12px;
                text-align: left;
                font-weight: 600;
                color: ${theme.colors.modal.textSecondary};
                width: 40px;
            `;

            if (this.config.selectionMode === 'multiple') {
                const checkboxWrapper = doc.createElement('div');
                const CheckboxComponent = React.createElement(CheckboxFluentUi, {
                    checked: false,
                    onChange: (checked: boolean) => this.toggleSelectAll(checked)
                });
                mountFluentComponent(checkboxWrapper, CheckboxComponent, defaultTheme);
                th.appendChild(checkboxWrapper);
            }

            tr.appendChild(th);
        }

        // Add column headers
        const visibleColumns = (this.config.columns || []).filter(col => col.visible !== false);
        visibleColumns.forEach(column => {
            const th = doc.createElement('th');
            th.style.cssText = `
                padding: 12px;
                text-align: left;
                font-weight: 600;
                color: ${theme.colors.modal.textSecondary};
                ${column.width ? `width: ${column.width};` : ''}
                ${column.sortable ? 'cursor: pointer; user-select: none;' : ''}
            `;

            const headerContent = doc.createElement('div');
            headerContent.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
            `;

            const headerText = doc.createElement('span');
            headerText.textContent = column.header;
            headerContent.appendChild(headerText);

            if (column.sortable) {
                const sortIcon = doc.createElement('span');
                sortIcon.style.cssText = `
                    font-size: 12px;
                    color: ${theme.colors.modal.textSecondary};
                    opacity: 0.5;
                `;
                sortIcon.textContent = '⇅';
                headerContent.appendChild(sortIcon);

                th.addEventListener('click', () => this.sortByColumn(column.id));
                th.addEventListener('mouseenter', () => {
                    th.style.backgroundColor = theme.colors.modal.secondaryHover;
                });
                th.addEventListener('mouseleave', () => {
                    th.style.backgroundColor = '';
                });
            }

            th.appendChild(headerContent);
            tr.appendChild(th);
        });

        thead.appendChild(tr);
        return thead;
    }

    /**
     * Create table body
     */
    private createBody(): HTMLElement {
        const doc = getTargetDocument();
        const tbody = doc.createElement('tbody');

        this.currentData.forEach((row, index) => {
            const tr = this.createRow(row, index);
            tbody.appendChild(tr);
        });

        // Show empty state if no data
        if (this.currentData.length === 0) {
            const tr = doc.createElement('tr');
            const td = doc.createElement('td');
            const visibleColumns = (this.config.columns || []).filter(col => col.visible !== false);
            const colSpan = visibleColumns.length + (this.config.selectionMode !== 'none' ? 1 : 0);
            td.colSpan = colSpan;
            td.style.cssText = `
                padding: 32px;
                text-align: center;
                color: ${theme.colors.modal.textSecondary};
            `;
            td.textContent = 'No data available';
            tr.appendChild(td);
            tbody.appendChild(tr);
        }

        return tbody;
    }

    /**
     * Create a table row
     */
    private createRow(rowData: any, rowIndex: number): HTMLElement {
        const doc = getTargetDocument();
        const tr = doc.createElement('tr');
        tr.style.cssText = `
            border-bottom: 1px solid ${theme.colors.modal.border};
            transition: background-color 0.2s;
        `;

        if (this.selectedRows.has(rowIndex)) {
            tr.style.backgroundColor = theme.colors.modal.secondaryHover;
        }

        tr.addEventListener('mouseenter', () => {
            if (!this.selectedRows.has(rowIndex)) {
                tr.style.backgroundColor = theme.colors.modal.secondaryHover;
            }
        });

        tr.addEventListener('mouseleave', () => {
            if (!this.selectedRows.has(rowIndex)) {
                tr.style.backgroundColor = '';
            }
        });

        // Add selection column if needed
        if (this.config.selectionMode !== 'none') {
            const td = doc.createElement('td');
            td.style.cssText = `
                padding: 12px;
                width: 40px;
            `;

            // Use Checkbox for both single and multiple selection
            const checkboxWrapper = doc.createElement('div');
            const CheckboxComponent = React.createElement(CheckboxFluentUi, {
                checked: this.selectedRows.has(rowIndex),
                onChange: (checked: boolean) => this.selectRow(rowIndex, checked)
            });
            mountFluentComponent(checkboxWrapper, CheckboxComponent, defaultTheme);
            td.appendChild(checkboxWrapper);

            tr.appendChild(td);
        }

        // Add data columns
        const visibleColumns = (this.config.columns || []).filter(col => col.visible !== false);
        visibleColumns.forEach(column => {
            const td = doc.createElement('td');
            td.style.cssText = `
                padding: 12px;
                color: ${theme.colors.modal.text};
            `;

            const value = rowData[column.id];
            td.textContent = value != null ? String(value) : '';

            tr.appendChild(td);
        });

        return tr;
    }

    /**
     * Sort table by column
     */
    private sortByColumn(columnId: string): void {
        if (this.sortColumn === columnId) {
            this.sortDescending = !this.sortDescending;
        } else {
            this.sortColumn = columnId;
            this.sortDescending = false;
        }

        this.currentData.sort((a, b) => {
            const aVal = a[columnId];
            const bVal = b[columnId];

            let comparison = 0;
            if (aVal == null && bVal == null) comparison = 0;
            else if (aVal == null) comparison = 1;
            else if (bVal == null) comparison = -1;
            else if (typeof aVal === 'number' && typeof bVal === 'number') {
                comparison = aVal - bVal;
            } else {
                comparison = String(aVal).localeCompare(String(bVal));
            }

            return this.sortDescending ? -comparison : comparison;
        });

        this.refresh();
    }

    /**
     * Select/deselect a row
     */
    private selectRow(rowIndex: number, selected: boolean): void {
        if (this.config.selectionMode === 'single') {
            this.selectedRows.clear();
        }

        if (selected) {
            this.selectedRows.add(rowIndex);
        } else {
            this.selectedRows.delete(rowIndex);
        }

        this.refresh();

        // Call selection callback if provided
        if (this.config.onRowSelect) {
            const selectedData = this.getSelectedRows();
            this.config.onRowSelect(selectedData);
        }
    }

    /**
     * Toggle select all rows
     */
    private toggleSelectAll(selectAll: boolean): void {
        this.selectedRows.clear();

        if (selectAll) {
            this.currentData.forEach((_, index) => {
                this.selectedRows.add(index);
            });
        }

        this.refresh();

        // Call selection callback if provided
        if (this.config.onRowSelect) {
            const selectedData = this.getSelectedRows();
            this.config.onRowSelect(selectedData);
        }
    }

    /**
     * Get selected row data
     */
    public getSelectedRows(): any[] {
        return Array.from(this.selectedRows).map(index => this.currentData[index]);
    }

    /**
     * Refresh the table display
     */
    private refresh(): void {
        const doc = getTargetDocument();
        const tableWrapper = this.container.querySelector('.err403-table-wrapper');
        if (tableWrapper) {
            const table = doc.createElement('table');
            table.className = 'err403-table';
            table.style.cssText = `
                width: 100%;
                border-collapse: collapse;
                background: ${theme.colors.modal.background};
            `;

            const thead = this.createHeader();
            const tbody = this.createBody();
            table.appendChild(thead);
            table.appendChild(tbody);

            tableWrapper.innerHTML = '';
            tableWrapper.appendChild(table);
        }
    }

    /**
     * Get current table value (selected rows)
     */
    public getValue(): any[] {
        return this.getSelectedRows();
    }

    /**
     * Set table data
     */
    public setValue(data: any[]): void {
        this.currentData = [...data];
        this.selectedRows.clear();
        this.refresh();
    }
}
