// Copyright 2024 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Button, Stack } from '@mui/material';
import { useState } from 'react';
import AddIcon from 'mdi-material-ui/Plus';
import { ColumnSettings } from '../table-model';
import { ColumnEditorContainer } from './ColumnEditorContainer';

export interface ColumnsEditorProps {
  columnSettings: ColumnSettings[];
  onChange: (columnOptions: ColumnSettings[]) => void;
}

export function ColumnsEditor({ columnSettings, onChange }: ColumnsEditorProps) {
  const [columns, setColumns] = useState<ColumnSettings[]>(columnSettings);

  const [columnsCollapsed, setColumnsCollapsed] = useState(columns.map(() => true));

  function handleColumnChange(index: number, column: ColumnSettings): void {
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
          isCollapsed={columnsCollapsed[i] ?? true}
          onChange={(updatedColumn: ColumnSettings) => handleColumnChange(i, updatedColumn)}
          onDelete={() => handleColumnDelete(i)}
          onCollapse={(collapsed) => handleColumnCollapseExpand(i, collapsed)}
        />
      ))}

      <Button variant="contained" startIcon={<AddIcon />} sx={{ marginTop: 1 }} onClick={handleAddColumnEditor}>
        Add Column Settings
      </Button>
    </Stack>
  );
}
