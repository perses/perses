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
import ExpandedIcon from 'mdi-material-ui/ChevronDown';
import CollapsedIcon from 'mdi-material-ui/ChevronRight';
import AddPanelIcon from 'mdi-material-ui/ChartBoxPlusOutline';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import ArrowUpIcon from 'mdi-material-ui/ArrowUp';
import ArrowDownIcon from 'mdi-material-ui/ArrowDown';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { InfoTooltip } from '@perses-dev/components';
import { usePanelGroupActions, useEditMode, PanelGroupId, useDeletePanelGroupDialog } from '../../context';

export interface GridTitleProps {
  panelGroupId: PanelGroupId;
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
  const { panelGroupId, title, collapse } = props;

  const { openAddPanel, openEditPanelGroup, moveUp, moveDown } = usePanelGroupActions(panelGroupId);
  const { openDeletePanelGroupDialog } = useDeletePanelGroupDialog();
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
        backgroundColor: ({ palette }) =>
          palette.mode === 'dark' ? palette.background.paper : palette.background.default,
      }}
    >
      {collapse ? (
        <>
          <IconButton onClick={collapse.onToggleOpen}>
            {collapse.isOpen ? <ExpandedIcon /> : <CollapsedIcon />}
          </IconButton>
          {text}
          {isEditMode && (
            <Stack direction="row" marginLeft="auto">
              <InfoTooltip description={`Add a new panel to ${title}`}>
                <IconButton aria-label={`add panel to group ${title}`} onClick={openAddPanel}>
                  <AddPanelIcon />
                </IconButton>
              </InfoTooltip>
              <InfoTooltip description="Edit">
                <IconButton aria-label={`edit group ${title}`} onClick={openEditPanelGroup}>
                  <PencilIcon />
                </IconButton>
              </InfoTooltip>
              <InfoTooltip description="Delete">
                <IconButton
                  aria-label={`delete group ${title}`}
                  onClick={() => openDeletePanelGroupDialog(panelGroupId)}
                >
                  <DeleteIcon />
                </IconButton>
              </InfoTooltip>
              <InfoTooltip description="Move panel group down">
                <IconButton
                  aria-label={`move group ${title} down`}
                  disabled={moveDown === undefined}
                  onClick={moveDown}
                >
                  <ArrowDownIcon />
                </IconButton>
              </InfoTooltip>
              <InfoTooltip description="Move panel group up">
                <IconButton aria-label={`move group ${title} up`} disabled={moveUp === undefined} onClick={moveUp}>
                  <ArrowUpIcon />
                </IconButton>
              </InfoTooltip>
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
