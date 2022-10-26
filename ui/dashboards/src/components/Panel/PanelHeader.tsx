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

import { CardHeader, Typography, Box, Stack, IconButton, CardHeaderProps, styled } from '@mui/material';
import { InfoTooltip, TooltipPlacement, combineSx } from '@perses-dev/components';
import InformationOutlineIcon from 'mdi-material-ui/InformationOutline';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import DragIcon from 'mdi-material-ui/DragVertical';

type OmittedProps = 'children';

export interface PanelHeaderProps extends Omit<CardHeaderProps, OmittedProps> {
  title: string;
  description?: string;
  editHandlers?: {
    onEditPanelClick: () => void;
    onDeletePanelClick: () => void;
  };
  isHovered: boolean;
}

export function PanelHeader({ title, description, editHandlers, isHovered, sx, ...rest }: PanelHeaderProps) {
  return (
    <CardHeader
      {...rest}
      title={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            minHeight: '32px',
          }}
        >
          <Typography variant="subtitle1" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">
            {title}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: 'auto',
            }}
          >
            {isHovered && editHandlers === undefined && description !== undefined && (
              <InfoTooltip id="info-tooltip" description={description} placement={TooltipPlacement.Bottom}>
                <InformationOutlineIcon
                  aria-describedby="info-tooltip"
                  aria-hidden={false}
                  sx={{ cursor: 'pointer', color: (theme) => theme.palette.grey[700] }}
                />
              </InfoTooltip>
            )}
            {isHovered && editHandlers !== undefined && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <HeaderIconButton aria-label="edit panel" size="small" onClick={editHandlers.onEditPanelClick}>
                  <PencilIcon />
                </HeaderIconButton>
                <HeaderIconButton aria-label="delete panel" size="small" onClick={editHandlers.onDeletePanelClick}>
                  <DeleteIcon />
                </HeaderIconButton>
                <HeaderIconButton aria-label="drag handle" size="small">
                  <DragIcon className="drag-handle" sx={{ cursor: 'grab' }} />
                </HeaderIconButton>
              </Stack>
            )}
          </Box>
        </Box>
      }
      sx={combineSx(
        (theme) => ({
          display: 'block',
          padding: theme.spacing(0.5),
          borderBottom: `solid 1px ${theme.palette.divider}`,
        }),
        sx
      )}
    />
  );
}

const HeaderIconButton = styled(IconButton)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  padding: '4px',
}));
