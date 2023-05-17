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

import { Box, Icon, IconButton, Stack, Typography } from '@mui/material';
import ExpandedIcon from 'mdi-material-ui/ChevronDown';
import CollapsedIcon from 'mdi-material-ui/ChevronRight';
import AddPanelIcon from 'mdi-material-ui/ChartBoxPlusOutline';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import ArrowUpIcon from 'mdi-material-ui/ArrowUp';
import ArrowDownIcon from 'mdi-material-ui/ArrowDown';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { InfoTooltip } from '@perses-dev/components';
import { ARIA_LABEL_TEXT, TOOLTIP_TEXT } from '../../constants';
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
      data-testid="panel-group-header"
      onClick={collapse !== undefined ? collapse.onToggleOpen : undefined }
      style={{ cursor: 'pointer' }}
    >
      {collapse ? (
        <>
          {collapse.isOpen ? <ExpandedIcon style={{ margin: '8px' }}/> : <CollapsedIcon style={{ margin: '8px' }}/>}
          {text}
          {isEditMode && (
            <Stack direction="row" marginLeft="auto">
              <InfoTooltip description={TOOLTIP_TEXT.addPanelToGroup}>
                <IconButton 
                  aria-label={ARIA_LABEL_TEXT.addPanelToGroup(title)}
                  onClick={(e) => {
                    {if (collapse.isOpen) e.stopPropagation()}; // set as expanded if not already
                    openAddPanel();
                  }}>
                  <AddPanelIcon />
                </IconButton>
              </InfoTooltip>
              <InfoTooltip description={TOOLTIP_TEXT.editGroup}>
                <IconButton
                  aria-label={ARIA_LABEL_TEXT.editGroup(title)}
                  onClick={(e) => {
                    e.stopPropagation(); // to not trigger expand/collapse
                    openEditPanelGroup();
                  }}>
                  <PencilIcon />
                </IconButton>
              </InfoTooltip>
              <InfoTooltip description={TOOLTIP_TEXT.deleteGroup}>
                <IconButton
                  aria-label={ARIA_LABEL_TEXT.deleteGroup(title)}
                  onClick={(e) => {
                    e.stopPropagation(); // to not trigger expand/collapse
                    openDeletePanelGroupDialog(panelGroupId);
                  }}>
                  <DeleteIcon />
                </IconButton>
              </InfoTooltip>
              <InfoTooltip description={TOOLTIP_TEXT.moveGroupDown}>
                <IconButton
                  aria-label={ARIA_LABEL_TEXT.moveGroupDown(title)}
                  disabled={moveDown === undefined}
                  onClick={(e) => {
                    e.stopPropagation(); // to not trigger expand/collapse
                    {moveDown !== undefined ? moveDown() : undefined };
                  }}>
                  <ArrowDownIcon />
                </IconButton>
              </InfoTooltip>
              <InfoTooltip description={TOOLTIP_TEXT.moveGroupUp}>
                <IconButton
                  aria-label={ARIA_LABEL_TEXT.moveGroupUp(title)}
                  disabled={moveUp === undefined}
                  onClick={(e) => {
                    e.stopPropagation(); // to not trigger expand/collapse
                    {moveUp !== undefined ? moveUp() : undefined };
                  }}>
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
