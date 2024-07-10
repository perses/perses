import { ColumnOptions } from '@perses-dev/core';
import { Button, Stack } from '@mui/material';
import { useState } from 'react';
import AddIcon from 'mdi-material-ui/Plus';
import { ColumnEditorContainer } from './ColumnEditorContainer';

export interface ColumnsEditorProps {
  columnOptions: ColumnOptions[];
  onChange: (columnOptions: ColumnOptions[]) => void;
}

export function ColumnsEditor({ columnOptions, onChange }: ColumnsEditorProps) {
  const [columns, setColumns] = useState<ColumnOptions[]>(columnOptions);

  const [columnsCollapsed, setColumnsCollapsed] = useState(columns.map(() => false));

  function handleColumnChange(index: number, column: ColumnOptions): void {
    const updatedColumns = [...columns];
    updatedColumns[index] = column;
    setColumns(updatedColumns);
    onChange(updatedColumns);
  }

  function handleAddColumnEditor(): void {
    const columnName: string = `column_${Object.keys(columns).length}`;
    const updatedColumns = [...columns];
    updatedColumns.push({ name: columnName });
    setColumns(updatedColumns);
    onChange(updatedColumns);
    setColumnsCollapsed((prev) => {
      prev.push(false);
      return [...prev];
    });
  }

  function handleColumnDelete(index: number): void {
    const updatedColumns = [...columns];
    updatedColumns.splice(index, 1);
    setColumns(updatedColumns);
    onChange(updatedColumns);
    setColumnsCollapsed((prev) => {
      prev.splice(index, 1);
      return [...prev];
    });
  }

  function handleColumnCollapseExpand(index: number, collapsed: boolean): void {
    setColumnsCollapsed((prev) => {
      prev[index] = collapsed;
      return [...prev];
    });
  }

  return (
    <Stack spacing={1}>
      {columns.map((column, i) => (
        <ColumnEditorContainer
          key={i}
          column={column}
          isCollapsed={columnsCollapsed[i] ?? false}
          onChange={(updatedColumn: ColumnOptions) => handleColumnChange(i, updatedColumn)}
          onDelete={() => handleColumnDelete(i)}
          onCollapse={(collapsed) => handleColumnCollapseExpand(i, collapsed)}
        />
      ))}

      <Button variant="contained" startIcon={<AddIcon />} sx={{ marginTop: 1 }} onClick={handleAddColumnEditor}>
        Add Column
      </Button>
    </Stack>
  );
}
