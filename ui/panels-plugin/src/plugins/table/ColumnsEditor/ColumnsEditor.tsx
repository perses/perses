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
import { ReactElement, useState } from 'react';
import AddIcon from 'mdi-material-ui/Plus';
import { handleMoveDown, handleMoveUp, useDragAndDropMonitor } from '@perses-dev/components';
import { ColumnSettings } from '../table-model';
import { ColumnEditorContainer } from './ColumnEditorContainer';

export interface ColumnsEditorProps {
  columnSettings: ColumnSettings[];
  onChange: (columnOptions: ColumnSettings[]) => void;
}

export function ColumnsEditor({ columnSettings, onChange }: ColumnsEditorProps): ReactElement {
  const [columnsCollapsed, setColumnsCollapsed] = useState(columnSettings.map(() => true));

  function handleColumnChange(index: number, column: ColumnSettings): void {
    const updatedColumns = [...columnSettings];
    updatedColumns[index] = column;
    onChange(updatedColumns);
  }

  function handleColumnAdd(): void {
    const columnName: string = `column_${Object.keys(columnSettings).length}`;
    const updatedColumns = [...columnSettings];
    updatedColumns.push({ name: columnName });
    onChange(updatedColumns);
    setColumnsCollapsed((prev) => {
      prev.push(false);
      return [...prev];
    });
  }

  function handleColumnDelete(index: number): void {
    const updatedColumns = [...columnSettings];
    updatedColumns.splice(index, 1);
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

  useDragAndDropMonitor({
    elements: columnSettings as unknown as Array<Record<string, unknown>>,
    accessKey: 'name',
    onChange: onChange as unknown as (elements: Array<Record<string, unknown>>) => void,
  });

  return (
    <Stack spacing={1}>
      {columnSettings.map((column, i) => (
        <ColumnEditorContainer
          key={i}
          column={column}
          isCollapsed={columnsCollapsed[i] ?? true}
          onChange={(updatedColumn: ColumnSettings) => handleColumnChange(i, updatedColumn)}
          onDelete={() => handleColumnDelete(i)}
          onCollapse={(collapsed) => handleColumnCollapseExpand(i, collapsed)}
          onMoveUp={() => onChange(handleMoveUp(column, columnSettings))}
          onMoveDown={() => onChange(handleMoveDown(column, columnSettings))}
        />
      ))}

      <Button variant="contained" startIcon={<AddIcon />} sx={{ marginTop: 1 }} onClick={handleColumnAdd}>
        Add Column Settings
      </Button>
    </Stack>
  );
}
