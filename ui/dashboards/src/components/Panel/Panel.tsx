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
import { PanelDefinition, PanelComponent } from '@perses-dev/plugin-system';
import { ErrorAlert } from '@perses-dev/components';
import { PluginBoundary } from '@perses-dev/plugin-system';
import useResizeObserver from 'use-resize-observer';
import { PanelContext, PanelContextType } from './PanelContext';

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

  // Context provided by the Panel component
  const context: PanelContextType = useMemo(() => {
    const contentDimensions = width !== undefined && height !== undefined ? { width, height } : undefined;
    return { contentDimensions };
  }, [width, height]);

  return (
    <Card
      sx={{
        ...others.sx,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexFlow: 'column nowrap',
        overflow: 'visible',
      }}
      variant="outlined"
      {...others}
    >
      <CardHeader
        title={
          <Typography
            component="h2"
            variant="body2"
            fontWeight={(theme) => theme.typography.fontWeightBold}
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {definition.display.name}
          </Typography>
        }
        sx={{
          display: 'block',
          padding: (theme) => theme.spacing(1, 2),
        }}
      />
      <CardContent
        sx={{
          position: 'relative',
          flexGrow: 1,
          padding: (theme) => theme.spacing(1, 2),
          // Override MUI default style for last-child
          ':last-child': {
            padding: (theme) => theme.spacing(1, 2),
          },
        }}
        ref={setContentElement}
      >
        {/* Actually render plugin with PanelContent component so we can wrap with a loading/error boundary */}
        <PanelContext.Provider value={context}>
          <PluginBoundary loadingFallback="Loading..." ErrorFallbackComponent={ErrorAlert}>
            <PanelComponent definition={definition} />
          </PluginBoundary>
        </PanelContext.Provider>
      </CardContent>
    </Card>
  );
}
