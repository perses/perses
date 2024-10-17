import { Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import EyeOffIcon from 'mdi-material-ui/EyeOffOutline';
import EyeIcon from 'mdi-material-ui/EyeOutline';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { Transform, TRANSFORM_TEXT } from '@perses-dev/core';
import { TransformEditor, TransformEditorProps } from './TransformEditor';

export interface TransformEditorContainerProps extends TransformEditorProps {
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onDelete: () => void;
}

export function TransformEditorContainer({
  value,
  isCollapsed,
  onChange,
  onCollapse,
  onDelete,
  ...props
}: TransformEditorContainerProps) {
  function handleTransformDisable() {
    onChange({ ...value, spec: { ...value.spec, disabled: !value.spec?.disabled } });
  }

  return (
    <Stack {...props}>
      <Stack
        direction="row"
        alignItems="center"
        borderBottom={1}
        borderColor={(theme) => theme.palette.divider}
        justifyContent="space-between"
        gap={4}
      >
        <Stack direction="row" gap={1}>
          <IconButton
            // data-testid={`transform-toggle#${transform.kind}`}
            size="small"
            onClick={() => onCollapse(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronDown />}
          </IconButton>
          <Typography variant="overline" component="h4" sx={{ textTransform: 'none' }}>
            {value.spec.plugin.kind ? (
              <span>
                <strong>{TRANSFORM_TEXT[value.spec.plugin.kind as keyof typeof TRANSFORM_TEXT]}</strong>
              </span>
            ) : (
              <strong>Select a transformation kind</strong>
            )}
          </Typography>
        </Stack>

        <Stack direction="row" gap={1}>
          {isCollapsed && (
            <>
              <Tooltip title={value.spec?.disabled ? 'Show column' : 'Hide column'} placement="top">
                <IconButton size="small" sx={{ marginLeft: 'auto' }} onClick={handleTransformDisable}>
                  {value.spec?.disabled ? <EyeOffIcon /> : <EyeIcon />}
                </IconButton>
              </Tooltip>
              <Divider flexItem orientation="vertical" variant="middle" />
            </>
          )}
          <Tooltip title="Remove column settings" placement="top">
            <IconButton size="small" sx={{ marginLeft: 'auto' }} onClick={onDelete}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      {!isCollapsed && <TransformEditor value={value} onChange={onChange} />}
    </Stack>
  );
}
