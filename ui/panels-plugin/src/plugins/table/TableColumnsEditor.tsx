import { ColumnsEditor } from '@perses-dev/components';
import { OptionsEditorProps } from '@perses-dev/plugin-system';
import { ColumnDefinition } from '@perses-dev/core';
import { TableOptions } from './table-model';

export type TableColumnsEditorProps = OptionsEditorProps<TableOptions>;

export function TableColumnsEditor({ onChange, value }: TableColumnsEditorProps) {
  function handleColumnChange(columns: ColumnDefinition[]): void {
    onChange({ ...value, columns: columns });
  }

  return <ColumnsEditor columnDefinitions={value.columns ?? []} onChange={handleColumnChange} />;
}
