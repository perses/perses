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

import { CardHeader, Typography, Stack, IconButton, CardHeaderProps, styled } from '@mui/material';
import { InfoTooltip, TooltipPlacement, combineSx } from '@perses-dev/components';
import InformationOutlineIcon from 'mdi-material-ui/InformationOutline';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import DragIcon from 'mdi-material-ui/DragVertical';

type OmittedProps = 'children' | 'action' | 'title' | 'disableTypography';

export interface PanelHeaderProps extends Omit<CardHeaderProps, OmittedProps> {
  id: string;
  title: string;
  description?: string;
  editHandlers?: {
    onEditPanelClick: () => void;
    onDeletePanelClick: () => void;
  };
  isHovered: boolean;
}

export function PanelHeader({ id, title, description, editHandlers, isHovered, sx, ...rest }: PanelHeaderProps) {
  const titleElementId = `${id}-title`;
  const descriptionTooltipId = `${id}-description`;

  let action: CardHeaderProps['action'] = undefined;
  if (editHandlers !== undefined) {
    // If there are edit handlers, always just show the edit buttons
    action = (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <InfoTooltip description="Edit">
          <HeaderIconButton aria-label={`edit panel ${title}`} size="small" onClick={editHandlers.onEditPanelClick}>
            <PencilIcon />
          </HeaderIconButton>
        </InfoTooltip>
        <InfoTooltip description="Delete">
          <HeaderIconButton aria-label={`delete panel ${title}`} size="small" onClick={editHandlers.onDeletePanelClick}>
            <DeleteIcon />
          </HeaderIconButton>
        </InfoTooltip>
        <InfoTooltip description="Drag and drop panel to reorganize">
          <HeaderIconButton aria-label={`move panel ${title}`} size="small">
            <DragIcon className="drag-handle" sx={{ cursor: 'grab' }} />
          </HeaderIconButton>
        </InfoTooltip>
      </Stack>
    );
  } else if (description !== undefined && isHovered) {
    // If there aren't edit handlers and we have a description, show a button with a tooltip for the panel description
    action = (
      <InfoTooltip id={descriptionTooltipId} description={description} enterDelay={100}>
        <HeaderIconButton aria-label="Panel Description">
          <InformationOutlineIcon
            aria-describedby="info-tooltip"
            aria-hidden={false}
            sx={{ color: (theme) => theme.palette.grey[700] }}
          />
        </HeaderIconButton>
      </InfoTooltip>
    );
  }

  return (
    <CardHeader
      id={id}
      component="header"
      aria-labelledby={titleElementId}
      aria-describedby={descriptionTooltipId}
      disableTypography
      title={
        <Typography
          id={titleElementId}
          variant="subtitle1"
          sx={{
            // `minHeight` guarantees that the header has the correct height
            // when there is no title (i.e. in the preview)
            lineHeight: '24px',
            minHeight: '24px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </Typography>
      }
      action={action}
      sx={combineSx(
        (theme) => ({
          padding: theme.spacing(1),
          borderBottom: `solid 1px ${theme.palette.divider}`,
          '.MuiCardHeader-content': {
            overflow: 'hidden',
          },
        }),
        sx
      )}
      {...rest}
    />
  );
}

const HeaderIconButton = styled(IconButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: '4px',
}));
