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

import { useState, useMemo } from 'react';
import { PluginBoundary, PanelComponent } from '@perses-dev/plugin-system';
import { ErrorAlert } from '@perses-dev/components';
import { PanelDefinition } from '@perses-dev/core';
import { Box, Card, CardProps, CardHeader, CardContent, Typography } from '@mui/material';
import InformationOutlineIcon from 'mdi-material-ui/InformationOutline';
import useResizeObserver from 'use-resize-observer';
import Tooltip, { TooltipPlacement } from './Tooltip';

export interface PanelProps extends CardProps {
  definition: PanelDefinition;
}

/**
 * Renders a PanelDefinition's content inside of a Card.
 */
export function Panel(props: PanelProps) {
  const { definition, ...others } = props;
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null);
  const isStatsChart = definition.kind === 'StatChart';
  const panelPadding = isStatsChart ? 0 : 2;

  const { width, height } = useResizeObserver({ ref: contentElement });

  const contentDimensions = useMemo(() => {
    if (width === undefined || height === undefined) return undefined;
    return { width, height };
  }, [width, height]);

  return (
    <Card
      sx={{
        ...others.sx,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexFlow: 'column nowrap',
      }}
      variant="outlined"
      {...others}
    >
      <CardHeader
        title={
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography
                component="h2"
                variant="body2"
                fontWeight={(theme) => theme.typography.fontWeightMedium}
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {definition.display.name}
              </Typography>
              {definition.display.description && (
                <Tooltip description={definition.display.description} placement={TooltipPlacement.Right}>
                  <InformationOutlineIcon
                    sx={{ fontSize: '1rem', position: 'relative', left: '4px', cursor: 'pointer' }}
                  />
                </Tooltip>
              )}
            </Box>
          </>
        }
        sx={{
          display: 'block',
          padding: (theme) => theme.spacing(1, 2),
          borderBottom: (theme) => `solid 1px ${theme.palette.divider}`,
        }}
      />
      <CardContent
        sx={{
          position: 'relative',
          overflow: 'hidden',
          flexGrow: 1,
          padding: (theme) => theme.spacing(panelPadding),
          // Override MUI default style for last-child
          ':last-child': {
            padding: (theme) => theme.spacing(panelPadding),
          },
        }}
        ref={setContentElement}
      >
        <PluginBoundary loadingFallback="Loading..." ErrorFallbackComponent={ErrorAlert}>
          <PanelComponent definition={definition} contentDimensions={contentDimensions} />
        </PluginBoundary>
      </CardContent>
    </Card>
  );
}
