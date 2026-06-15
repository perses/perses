// Copyright The Perses Authors
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

import { Box, IconButton, Link } from '@mui/material';
import ChevronDownIcon from 'mdi-material-ui/ChevronDown';
import ChevronRightIcon from 'mdi-material-ui/ChevronRight';
import FolderOutlineIcon from 'mdi-material-ui/FolderOutline';
import FolderOpenOutlineIcon from 'mdi-material-ui/FolderOpenOutline';
import ViewDashboardOutlineIcon from 'mdi-material-ui/ViewDashboardOutline';
import { ReactElement } from 'react';
import { DashboardTreeTableRow } from './DashboardTreeList';

export interface NameCellProps {
  kind: DashboardTreeTableRow['kind'];
  depth: number;
  displayName: string;
  project: string;
  name: string;
  isOpen: boolean;
  onToggleExpanded: () => void;
}

export function NameCell({
  kind,
  depth,
  displayName,
  project,
  name,
  isOpen,
  onToggleExpanded,
}: NameCellProps): ReactElement {
  // folder padding is based on depth, with dashboards having an extra 24px to account for the chevron icon
  const paddingLeft = kind === 'Folder' ? depth * 24 : (depth + 1) * 24;

  switch (kind) {
    case 'Folder':
      return (
        <Box sx={{ paddingLeft: `${paddingLeft}px`, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton
            onClick={onToggleExpanded}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'collapse folder' : 'expand folder'}
            sx={{ padding: 0 }}
          >
            {isOpen ? <ChevronDownIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
          {isOpen ? <FolderOpenOutlineIcon fontSize="small" /> : <FolderOutlineIcon fontSize="small" />}
          {displayName}
        </Box>
      );
    case 'NoItems':
      return (
        <Box component="span" sx={{ paddingLeft: `${paddingLeft}px`, color: 'text.secondary', fontStyle: 'italic' }}>
          No Items
        </Box>
      );
    case 'Dashboard':
      return (
        <Box sx={{ paddingLeft: `${paddingLeft}px`, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ViewDashboardOutlineIcon fontSize="small" />
          <Link href={`/projects/${project}/dashboards/${name}`} color="inherit" underline="hover">
            {displayName}
          </Link>
        </Box>
      );
  }
}
