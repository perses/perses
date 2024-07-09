import { OptionsEditorColumn, OptionsEditorGrid } from '@perses-dev/components';
import { Typography } from '@mui/material';
import { TableOptionsEditorProps } from './table-model';

export function TableOptionsEditor({}: TableOptionsEditorProps) {
  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <Typography>Test</Typography>
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}
