import { Transform } from '@perses-dev/core';
import { Button, Stack, StackProps } from '@mui/material';
import { useState } from 'react';
import AddIcon from 'mdi-material-ui/Plus';
import { TransformEditorContainer } from './TransformEditorContainer';

export interface TransformsEditorProps extends Omit<StackProps, 'onChange'> {
  transforms: Transform[];
  onChange: (transforms: Transform[]) => void;
}

export function TransformsEditor({ transforms, onChange, ...props }: TransformsEditorProps) {
  const [transformsCollapsed, setTransformsCollapsed] = useState(transforms.map(() => true));

  function handleTransformChange(index: number, transform: Transform): void {
    const updatedTransforms = [...transforms];
    updatedTransforms[index] = transform;
    onChange(updatedTransforms);
  }

  function handleTransformAdd(): void {
    const updatedTransforms = [...transforms];
    updatedTransforms.push({ kind: 'Transform', spec: { plugin: { kind: 'Join', spec: { keys: [] } } } }); // TODO: change to unset kind
    onChange(updatedTransforms);
    setTransformsCollapsed((prev) => {
      prev.push(false);
      return [...prev];
    });
  }

  function handleTransformDelete(index: number): void {
    const updatedTransforms = [...transforms];
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
      {transforms.map((transform, i) => (
        <TransformEditorContainer
          key={i}
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
