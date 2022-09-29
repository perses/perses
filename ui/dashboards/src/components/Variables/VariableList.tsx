// Copyright 2022 The Perses Authors
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

import { useState } from 'react';
import {
  Button,
  Stack,
  Box,
  Drawer,
  TableContainer,
  TableBody,
  TableRow,
  TableCell,
  Table,
  Paper,
  TableHead,
} from '@mui/material';
import { useTemplateVariableDefinitions, useEditMode } from '../../context';
import { TemplateVariable } from './Variable';

export function TemplateVariableList() {
  const [isEditing, setIsEditing] = useState(false);
  const variableDefinitions = useTemplateVariableDefinitions();
  const { isEditMode } = useEditMode();
  return (
    <>
      <Drawer anchor={'right'} open={isEditing} onClose={() => setIsEditing(false)}>
        <Box width={900} p={4}>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Variable Name</TableCell>
                  <TableCell align="right">Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {variableDefinitions.map((v) => (
                  <TableRow key={v.spec.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      {v.spec.name}
                    </TableCell>
                    <TableCell align="right">{v.kind}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <pre>{JSON.stringify(variableDefinitions, null, 2)}</pre>
        </Box>
      </Drawer>
      <Box display={'flex'} justifyContent="space-between">
        <Stack direction={'row'} spacing={2}>
          {variableDefinitions.map((v) => (
            <Box key={v.spec.name}>
              <TemplateVariable key={v.spec.name} name={v.spec.name} />
            </Box>
          ))}
          {isEditMode && <Button onClick={() => setIsEditing(true)}>Modify Variables</Button>}
        </Stack>
      </Box>
    </>
  );
}
