// Copyright 2025 The Perses Authors
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

import { CardHeader, CardHeaderProps, Stack, Typography } from '@mui/material';
import { InfoTooltip, combineSx } from '@perses-dev/components';
import { Link } from '@perses-dev/core';
import { useReplaceVariablesInString } from '@perses-dev/plugin-system';
import InformationOutlineIcon from 'mdi-material-ui/InformationOutline';
import { ReactElement, ReactNode } from 'react';
import { HEADER_ACTIONS_CONTAINER_NAME } from '../../constants';
import { PanelActions, PanelActionsProps } from './PanelActions';
import { PanelLinks } from './PanelLinks';
import { HeaderIconButton } from './HeaderIconButton';

type OmittedProps = 'children' | 'action' | 'title' | 'disableTypography';

export interface PanelHeaderProps extends Omit<CardHeaderProps, OmittedProps> {
  id: string;
  title: string;
  description?: string;
  links?: Link[];
  extra?: ReactNode;
  readHandlers?: PanelActionsProps['readHandlers'];
  editHandlers?: PanelActionsProps['editHandlers'];
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
      action={<PanelActions title={title} readHandlers={readHandlers} editHandlers={editHandlers} extra={extra} />}
      sx={combineSx(
        (theme) => ({
          containerType: 'inline-size',
          containerName: HEADER_ACTIONS_CONTAINER_NAME,
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
