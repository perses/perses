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

import { useState } from 'react';
import { Card, CardProps, CardHeader, CardContent, Typography } from '@mui/material';
import { AnyPanelDefinition } from '@perses-ui/core';
import { PluginBoundary, usePanelComponent } from '../../context/plugin-registry';
import AlertErrorFallback from '../../components/AlertErrorFallback';
import { PanelContextProvider } from './PanelContextProvider';

export interface PanelProps extends CardProps {
  definition: AnyPanelDefinition;
}

/**
 * Provides the common UI elements that are "wrapped around" the content for
 * rendering a PanelDefinition.
 */
function Panel(props: PanelProps) {
  const { definition, ...others } = props;
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null);

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
        <PanelContextProvider contentElement={contentElement}>
          <PluginBoundary loadingFallback="Loading..." ErrorFallbackComponent={AlertErrorFallback}>
            <PanelContent definition={definition} />
          </PluginBoundary>
        </PanelContextProvider>
      </CardContent>
    </Card>
  );
}

export default Panel;

interface PanelContentProps {
  definition: AnyPanelDefinition;
}

// Render the actual panel's content using a Plugin
function PanelContent(props: PanelContentProps) {
  const { definition } = props;
  const PanelComponent = usePanelComponent(definition);
  return <PanelComponent definition={definition} />;
}
