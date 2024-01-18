// Copyright 2023 The Perses Authors
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

import { Stack, IconButton, Typography, BoxProps, Box } from '@mui/material';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import produce from 'immer';
import { PluginEditor, PluginEditorProps } from '../PluginEditor';
import { TraceQueryDefinition } from '../../runtime';

interface TraceQueryInputProps {
  query: TraceQueryDefinition;
  index: number;
  onChange: (index: number, query: TraceQueryDefinition) => void;
  onCollapseExpand: (index: number) => void;
  isCollapsed?: boolean;
  onDelete?: (index: number) => void;
}

// Props on MUI Box that we don't want people to pass because we're either redefining them or providing them in
// this component
type OmittedMuiProps = 'children' | 'value' | 'onChange';

interface QueryEditorProps extends Omit<BoxProps, OmittedMuiProps> {
  value: TraceQueryDefinition;
  onChange: (next: TraceQueryDefinition) => void;
}

export const TraceQueryInput = ({
  index,
  query,
  isCollapsed,
  onDelete,
  onChange,
  onCollapseExpand,
}: TraceQueryInputProps) => {
  return (
    <Stack key={index} spacing={1}>
      <Stack direction="row" alignItems="center" borderBottom={1} borderColor={(theme) => theme.palette.divider}>
        <IconButton size="small" onClick={() => onCollapseExpand(index)}>
          {isCollapsed ? <ChevronRight /> : <ChevronDown />}
        </IconButton>
        <Typography variant="overline" component="h4">
          Query {index + 1}
        </Typography>
        <IconButton
          size="small"
          // Use `visibility` to ensure that the row has the same height when delete button is visible or not visible
          sx={{ marginLeft: 'auto', visibility: `${onDelete ? 'visible' : 'hidden'}` }}
          onClick={() => onDelete && onDelete(index)}
        >
          <DeleteIcon />
        </IconButton>
      </Stack>
      {!isCollapsed && <QueryEditor value={query} onChange={(next) => onChange(index, next)} />}
    </Stack>
  );
};

/**
 * Displays an editor for TraceQueryDefinition objects.
 */
function QueryEditor(props: QueryEditorProps) {
  const { value, onChange, ...others } = props;
  const {
    spec: { plugin },
  } = value;

  const handlePluginChange: PluginEditorProps['onChange'] = (next) => {
    onChange(
      produce(value, (draft) => {
        draft.spec.plugin = next;
      })
    );
  };

  return (
    <Box {...others}>
      <PluginEditor pluginType="TraceQuery" pluginKindLabel="Query Type" value={plugin} onChange={handlePluginChange} />
    </Box>
  );
}
