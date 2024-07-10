import { ColumnsEditor } from '@perses-dev/components';
import { OptionsEditorProps } from '@perses-dev/plugin-system';
import { ColumnOptions } from '@perses-dev/core';
import { TableOptions } from './table-model';

export type TableOptionsEditorProps = OptionsEditorProps<TableOptions>;

export function TableOptionsEditor({ onChange, value }: TableOptionsEditorProps) {
  function handleColumnChange(columns: ColumnOptions[]): void {
    onChange({ ...value, columns: columns });
  }

  return <ColumnsEditor columnOptions={value.columns ?? []} onChange={handleColumnChange} />;
}
