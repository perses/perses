// Copyright 2021 The Perses Authors
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
import { Card, CardProps, CardHeader, CardContent, Typography } from '@mui/material';
import { PluginBoundary, PanelComponent } from '@perses-dev/plugin-system';
import { ErrorAlert } from '@perses-dev/components';
import useResizeObserver from 'use-resize-observer';
import { PanelDefinition } from '@perses-dev/core';

export interface PanelProps extends CardProps {
  definition: PanelDefinition;
}

/**
 * Renders a PanelDefinition's content inside of a Card.
 */
export function Panel(props: PanelProps) {
  const { definition, ...others } = props;
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null);

  const { width, height } = useResizeObserver({ ref: contentElement });

  const contentDimensions = useMemo(() => {
    if (width === undefined || height === undefined) return undefined;
    return { width, height };
  }, [width, height]);

  console.log(width);
  const panelPadding = width !== undefined && width > 100 ? 2 : 1;

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
        }
        sx={{
          display: 'block',
          padding: (theme) => theme.spacing(1, panelPadding),
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
