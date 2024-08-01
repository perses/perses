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
import { CellSettings } from '../table-model';
import { CellEditorContainer } from './CellEditorContainer';

export interface CellsEditorProps {
  cellSettings: CellSettings[];
  onChange: (cellOptions: CellSettings[]) => void;
}

export function CellsEditor({ cellSettings, onChange }: CellsEditorProps) {
  const [cells, setCells] = useState<CellSettings[]>(cellSettings);

  const [cellsCollapsed, setCellsCollapsed] = useState(cells.map(() => true));

  function handleCellChange(index: number, cell: CellSettings): void {
    const updatedCells = [...cells];
    updatedCells[index] = cell;
    setCells(updatedCells);
    onChange(updatedCells);
  }

  function handleAddCellEditor(): void {
    const cellName: string = `cell_${Object.keys(cells).length}`;
    const updatedCells = [...cells];
    updatedCells.push({ name: cellName });
    setCells(updatedCells);
    onChange(updatedCells);
    setCellsCollapsed((prev) => {
      prev.push(false);
      return [...prev];
    });
  }

  function handleCellDelete(index: number): void {
    const updatedCells = [...cells];
    updatedCells.splice(index, 1);
    setCells(updatedCells);
    onChange(updatedCells);
    setCellsCollapsed((prev) => {
      prev.splice(index, 1);
      return [...prev];
    });
  }

  function handleCellCollapseExpand(index: number, collapsed: boolean): void {
    setCellsCollapsed((prev) => {
      prev[index] = collapsed;
      return [...prev];
    });
  }

  return (
    <Stack spacing={1}>
      {cells.map((cell, i) => (
        <CellEditorContainer
          key={i}
          cell={cell}
          isCollapsed={cellsCollapsed[i] ?? true}
          onChange={(updatedCell: CellSettings) => handleCellChange(i, updatedCell)}
          onDelete={() => handleCellDelete(i)}
          onCollapse={(collapsed) => handleCellCollapseExpand(i, collapsed)}
        />
      ))}

      <Button variant="contained" startIcon={<AddIcon />} sx={{ marginTop: 1 }} onClick={handleAddCellEditor}>
        Add Cell Settings
      </Button>
    </Stack>
  );
}
