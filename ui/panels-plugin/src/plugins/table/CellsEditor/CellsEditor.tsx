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

import { Button, Divider, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

import { useState } from 'react';
import AddIcon from 'mdi-material-ui/Plus';
import { CellSettings } from '../table-model';
import { CellEditor } from './CellEditor';

export interface CellsEditorProps {
  cellSettings: CellSettings[];
  onChange: (cellOptions: CellSettings[]) => void;
}

export function CellsEditor({ cellSettings, onChange }: CellsEditorProps) {
  const [cells, setCells] = useState<CellSettings[]>(cellSettings);

  function handleCellChange(index: number, cell: CellSettings): void {
    const updatedCells = [...cells];
    updatedCells[index] = cell;
    setCells(updatedCells);
    onChange(updatedCells);
  }

  function handleAddCellEditor(): void {
    const updatedCells = [...cells];
    updatedCells.push({ condition: { kind: 'Value', spec: { value: '' } } });
    setCells(updatedCells);
    onChange(updatedCells);
  }

  function handleCellDelete(index: number): void {
    const updatedCells = [...cells];
    updatedCells.splice(index, 1);
    setCells(updatedCells);
    onChange(updatedCells);
  }

  return (
    <Stack spacing={1}>
      <Grid container spacing={2}>
        <Grid xs={5}>
          <Typography variant="subtitle1">Condition</Typography>
        </Grid>
        <Grid xs={4}>
          <Typography variant="subtitle1">Display Text</Typography>
        </Grid>
        <Grid xs={1} textAlign="center">
          <Typography variant="subtitle1">Color</Typography>
        </Grid>
        <Grid xs={1} textAlign="center">
          <Typography variant="subtitle1">Background</Typography>
        </Grid>
        <Grid xs={1}></Grid>
      </Grid>
      <Stack gap={1.5} divider={<Divider flexItem orientation="horizontal" />}>
        {cells.map((cell, i) => (
          <CellEditor
            key={i}
            cell={cell}
            onChange={(updatedCell: CellSettings) => handleCellChange(i, updatedCell)}
            onDelete={() => handleCellDelete(i)}
          />
        ))}
      </Stack>

      <Button variant="contained" startIcon={<AddIcon />} sx={{ marginTop: 1 }} onClick={handleAddCellEditor}>
        Add Cell Settings
      </Button>
    </Stack>
  );
}
