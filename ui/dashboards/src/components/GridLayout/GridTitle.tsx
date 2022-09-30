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

import { Box, IconButton, Stack, Typography } from '@mui/material';
import ExpandedIcon from 'mdi-material-ui/ChevronUp';
import CollapsedIcon from 'mdi-material-ui/ChevronDown';
import AddIcon from 'mdi-material-ui/Plus';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import { useState } from 'react';
import { useDashboardApp, useEditMode } from '../../context';

export interface GridTitleProps {
  groupIndex: number;
  title: string;
  collapse?: {
    isOpen: boolean;
    onToggleOpen: () => void;
  };
}

/**
 * Renders the title for a Grid section, optionally also supporting expanding
 * and collapsing
 */
export function GridTitle(props: GridTitleProps) {
  const { groupIndex, title, collapse } = props;

  const [isHovered, setIsHovered] = useState(false);
  const { openPanelDrawer, openPanelGroupDialog } = useDashboardApp();
  const { isEditMode } = useEditMode();

  const text = (
    <Typography variant="h2" sx={{ marginLeft: collapse !== undefined ? 1 : undefined }}>
      {title}
    </Typography>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'start',
        alignItems: 'center',
        padding: (theme) => theme.spacing(1),
        backgroundColor: (theme) => theme.palette.background.default,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {collapse ? (
        <>
          <IconButton onClick={collapse.onToggleOpen}>
            {collapse.isOpen ? <ExpandedIcon /> : <CollapsedIcon />}
          </IconButton>
          {text}
          {isEditMode && isHovered && (
            <Stack direction="row" sx={{ marginLeft: 'auto' }}>
              <IconButton onClick={() => openPanelDrawer({ groupIndex })}>
                <AddIcon />
              </IconButton>
              <IconButton onClick={() => openPanelGroupDialog(groupIndex)}>
                <PencilIcon />
              </IconButton>
            </Stack>
          )}
        </>
      ) : (
        // If we don't need expand/collapse, just render the title text
        text
      )}
    </Box>
  );
}
