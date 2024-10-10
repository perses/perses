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

import { useTheme, CircularProgress, IconButton, Tooltip } from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';
import { ErrorAlert } from '@perses-dev/components';
import { PrometheusDatasourceSelector } from '../model';
import { useParseQuery } from './utils';
import TreeNode from './TreeNode';

// Forked from https://github.com/prometheus/prometheus/blob/65f610353919b1c7b42d3776c3a95b68046a6bba/web/ui/mantine-ui/src/pages/query/TreeView.tsx

interface TreeViewProps {
  promqlExpr: string;
  datasource: PrometheusDatasourceSelector;
  onClose: () => void;
}

export const TreeView = ({ promqlExpr, datasource, onClose }: TreeViewProps) => {
  const theme = useTheme();

  const { data: parseQueryResponse, isLoading, error } = useParseQuery(promqlExpr, datasource);
  let errorMessage = 'An unknown error occurred';
  if (error && error instanceof Error) {
    if (error.message.trim() === '404 page not found') {
      errorMessage = 'Tree view is available only for datasources whose APIs comply with Prometheus 3.0 specifications';
    } else {
      errorMessage = error.message;
    }
  }

  return (
    <div style={{ border: `1px solid ${theme.palette.divider}`, padding: '10px', position: 'relative' }}>
      <Tooltip title="Close tree view">
        <IconButton
          aria-label="Close tree view"
          onClick={onClose} // Trigger the onClose function
          sx={{ position: 'absolute', top: '5px', right: '5px' }}
          size="small"
        >
          <CloseIcon sx={{ fontSize: '18px' }} />
        </IconButton>
      </Tooltip>
      {error ? (
        <ErrorAlert error={{ name: 'Tree view rendering error', message: errorMessage }} />
      ) : isLoading ? (
        <CircularProgress />
      ) : parseQueryResponse?.data ? (
        <TreeNode node={parseQueryResponse.data} reverse={false} childIdx={0} />
      ) : null}
    </div>
  );
};
