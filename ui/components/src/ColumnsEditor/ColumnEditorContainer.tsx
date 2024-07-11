import { IconButton, Stack, Typography } from '@mui/material';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import EyeIcon from 'mdi-material-ui/EyeOutline';
import EyeOffIcon from 'mdi-material-ui/EyeOffOutline';
import { ColumnEditor, ColumnEditorProps } from './ColumnEditor';

export interface ColumnEditorContainerProps extends ColumnEditorProps {
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onDelete: () => void;
}

export function ColumnEditorContainer({
  column,
  isCollapsed,
  onChange,
  onCollapse,
  onDelete,
}: ColumnEditorContainerProps) {
  function handleHideColumn() {
    onChange({ ...column, hide: !column.hide });
  }

  return (
    <Stack spacing={1}>
      <Stack
        direction="row"
        alignItems="center"
        borderBottom={1}
        borderColor={(theme) => theme.palette.divider}
        justifyContent="space-between"
        gap={4}
      >
        <Stack direction="row" gap={1}>
          <IconButton size="small" onClick={() => onCollapse(!isCollapsed)}>
            {isCollapsed ? <ChevronRight /> : <ChevronDown />}
          </IconButton>
          <Typography variant="overline" component="h4">
            Column: {column.name}
          </Typography>
        </Stack>

        <Stack direction="row" gap={1}>
          <IconButton size="small" sx={{ marginLeft: 'auto' }} onClick={handleHideColumn}>
            {column.hide ? <EyeOffIcon /> : <EyeIcon />}
          </IconButton>
          <IconButton size="small" sx={{ marginLeft: 'auto' }} onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Stack>
      {!isCollapsed && <ColumnEditor column={column} onChange={onChange} />}
    </Stack>
  );
}
