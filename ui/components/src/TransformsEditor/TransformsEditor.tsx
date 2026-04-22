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

import { Transform } from '@perses-dev/core';
import { Button, Stack, StackProps } from '@mui/material';
import { ReactElement, useState } from 'react';
import AddIcon from 'mdi-material-ui/Plus';
import { TransformEditorContainer } from './TransformEditorContainer';

export interface TransformsEditorProps extends Omit<StackProps, 'onChange'> {
  value: Transform[];
  onChange: (transforms: Transform[]) => void;
}

export function TransformsEditor({ value, onChange, ...props }: TransformsEditorProps): ReactElement {
  const [transformsCollapsed, setTransformsCollapsed] = useState(value.map(() => true));

  function handleTransformChange(index: number, transform: Transform): void {
    const updatedTransforms = [...value];
    updatedTransforms[index] = transform;
    onChange(updatedTransforms);
  }

  function handleTransformAdd(): void {
    const updatedTransforms = [...value];
    // @ts-expect-error: Unknown transform
    updatedTransforms.push({ kind: '', spec: {} });
    onChange(updatedTransforms);
    setTransformsCollapsed((prev) => {
      prev.push(false);
      return [...prev];
    });
  }

  function handleTransformDelete(index: number): void {
    const updatedTransforms = [...value];
    updatedTransforms.splice(index, 1);
    onChange(updatedTransforms);
    setTransformsCollapsed((prev) => {
      prev.splice(index, 1);
      return [...prev];
    });
  }

  function handleTransformCollapseExpand(index: number, collapsed: boolean): void {
    setTransformsCollapsed((prev) => {
      prev[index] = collapsed;
      return [...prev];
    });
  }

  return (
    <Stack gap={1} {...props}>
      {value.map((transform, i) => (
        <TransformEditorContainer
          key={i}
          index={i}
          value={transform}
          isCollapsed={transformsCollapsed[i] ?? true}
          onChange={(updatedTransform: Transform) => handleTransformChange(i, updatedTransform)}
          onDelete={() => handleTransformDelete(i)}
          onCollapse={(collapsed) => handleTransformCollapseExpand(i, collapsed)}
        />
      ))}

      <Button variant="contained" startIcon={<AddIcon />} sx={{ marginTop: 1 }} onClick={handleTransformAdd}>
        Add Transformation
      </Button>
    </Stack>
  );
}
