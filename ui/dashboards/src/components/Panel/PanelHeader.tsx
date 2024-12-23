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

import { CardHeader, Typography, Stack, CardHeaderProps, styled, IconButton } from '@mui/material';
import { InfoTooltip, combineSx } from '@perses-dev/components';
import InformationOutlineIcon from 'mdi-material-ui/InformationOutline';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import DragIcon from 'mdi-material-ui/DragVertical';
import ArrowExpandIcon from 'mdi-material-ui/ArrowExpand';
import ArrowCollapseIcon from 'mdi-material-ui/ArrowCollapse';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import { useReplaceVariablesInString } from '@perses-dev/plugin-system';
import { ReactElement, ReactNode } from 'react';
import { Link } from '@perses-dev/core';
import { ARIA_LABEL_TEXT, TOOLTIP_TEXT } from '../../constants';
import { PanelLinks } from './PanelLinks';
type OmittedProps = 'children' | 'action' | 'title' | 'disableTypography';

export interface PanelHeaderProps extends Omit<CardHeaderProps, OmittedProps> {
  id: string;
  title: string;
  description?: string;
  links?: Link[];
  extra?: ReactNode;
  readHandlers?: {
    isPanelViewed?: boolean;
    onViewPanelClick: () => void;
  };
  editHandlers?: {
    onEditPanelClick: () => void;
    onDuplicatePanelClick: () => void;
    onDeletePanelClick: () => void;
  };
}

export function PanelHeader({
  id,
  title: rawTitle,
  description: rawDescription,
  links,
  readHandlers,
  editHandlers,
  sx,
  extra,
  ...rest
}: PanelHeaderProps): ReactElement {
  const titleElementId = `${id}-title`;
  const descriptionTooltipId = `${id}-description`;

  const title = useReplaceVariablesInString(rawTitle) as string;
  const description = useReplaceVariablesInString(rawDescription);

  let readActions: CardHeaderProps['action'] = undefined;
  if (readHandlers !== undefined) {
    readActions = (
      <InfoTooltip description={TOOLTIP_TEXT.viewPanel}>
        <HeaderIconButton
          aria-label={ARIA_LABEL_TEXT.viewPanel(title)}
          size="small"
          onClick={readHandlers.onViewPanelClick}
        >
          {readHandlers.isPanelViewed ? (
            <ArrowCollapseIcon fontSize="inherit" />
          ) : (
            <ArrowExpandIcon fontSize="inherit" />
          )}
        </HeaderIconButton>
      </InfoTooltip>
    );
  }
  let editActions: CardHeaderProps['action'] = undefined;
  if (editHandlers !== undefined) {
    // If there are edit handlers, always just show the edit buttons
    editActions = (
      <>
        <InfoTooltip description={TOOLTIP_TEXT.editPanel}>
          <HeaderIconButton
            aria-label={ARIA_LABEL_TEXT.editPanel(title)}
            size="small"
            onClick={editHandlers.onEditPanelClick}
          >
            <PencilIcon fontSize="inherit" />
          </HeaderIconButton>
        </InfoTooltip>
        <InfoTooltip description={TOOLTIP_TEXT.duplicatePanel}>
          <HeaderIconButton
            aria-label={ARIA_LABEL_TEXT.duplicatePanel(title)}
            size="small"
            onClick={editHandlers.onDuplicatePanelClick}
          >
            <ContentCopyIcon
              fontSize="inherit"
              sx={{
                // Shrink this icon a little bit to look more consistent
                // with the other icons in the header.
                transform: 'scale(0.925)',
              }}
            />
          </HeaderIconButton>
        </InfoTooltip>
        <InfoTooltip description={TOOLTIP_TEXT.deletePanel}>
          <HeaderIconButton
            aria-label={ARIA_LABEL_TEXT.deletePanel(title)}
            size="small"
            onClick={editHandlers.onDeletePanelClick}
          >
            <DeleteIcon fontSize="inherit" />
          </HeaderIconButton>
        </InfoTooltip>
        <InfoTooltip description={TOOLTIP_TEXT.movePanel}>
          <HeaderIconButton aria-label={ARIA_LABEL_TEXT.movePanel(title)} size="small">
            <DragIcon className="drag-handle" sx={{ cursor: 'grab' }} fontSize="inherit" />
          </HeaderIconButton>
        </InfoTooltip>
      </>
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
        <Stack direction="row">
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
          {/* Show the info tooltip when description is defined and is not all whitespace */}
          {description !== undefined && description.trim().length > 0 && (
            <InfoTooltip id={descriptionTooltipId} description={description} enterDelay={100}>
              <HeaderIconButton aria-label="panel description" size="small">
                <InformationOutlineIcon
                  aria-describedby="info-tooltip"
                  aria-hidden={false}
                  fontSize="inherit"
                  sx={{ color: (theme) => theme.palette.text.secondary }}
                />
              </HeaderIconButton>
            </InfoTooltip>
          )}
          {links !== undefined && links.length > 0 && <PanelLinks links={links} />}
        </Stack>
      }
      action={
        <HeaderActionWrapper direction="row" spacing={0.25} alignItems="center">
          {editHandlers === undefined && extra} {readActions} {editActions}
        </HeaderActionWrapper>
      }
      sx={combineSx(
        (theme) => ({
          padding: theme.spacing(1),
          borderBottom: `solid 1px ${theme.palette.divider}`,
          '.MuiCardHeader-content': {
            overflow: 'hidden',
          },
          '.MuiCardHeader-action': {
            // Overriding the negative margins from MUI's defaults, so we
            // can vertically center the icons. Moving these values to a wrapper
            // inside the action in `HeaderActionWrapper` below.
            // https://github.com/mui/material-ui/blob/master/packages/mui-material/src/CardHeader/CardHeader.js#L56-L58
            margin: 'auto',
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

const HeaderActionWrapper = styled(Stack)(() => ({
  // Adding back the negative margins from MUI's defaults for actions, so we
  // avoid increasing the header size when actions are present while also being
  // able to vertically center the actions.
  // https://github.com/mui/material-ui/blob/master/packages/mui-material/src/CardHeader/CardHeader.js#L56-L58
  marginTop: -4,
  marginBottom: -4,
}));
