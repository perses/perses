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
import {
  Box,
  Card,
  CardProps,
  CardHeader,
  CardContent,
  Typography,
} from '@mui/material';
import { AnyPanelDefinition } from '@perses-ui/core';
import {
  PluginBoundary,
  usePanelComponent,
} from '../../context/plugin-registry';
import AlertErrorFallback from '../../components/AlertErrorFallback';
import { PanelContextProvider } from './PanelContextProvider';

const CONTENT_HEIGHT = 152;

export interface PanelProps extends CardProps {
  definition: AnyPanelDefinition;
}

/**
 * Provides the common UI elements that are "wrapped around" the content for
 * rendering a PanelDefinition.
 */
function Panel(props: PanelProps) {
  const { definition, ...others } = props;
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(
    null
  );

  return (
    <Card variant="outlined" {...others}>
      <CardHeader
        title={
          <Typography
            component="h2"
            variant="body1"
            fontWeight={(theme) => theme.typography.fontWeightBold}
          >
            {definition.display.name}
          </Typography>
        }
        sx={{
          padding: (theme) => theme.spacing(1, 2),
        }}
      />
      <CardContent
        sx={{
          position: 'relative',
          overflow: 'hidden',
          height: CONTENT_HEIGHT,
          padding: 0,
          // Override MUI default style for last-child
          ':last-child': {
            padding: 0,
          },
        }}
      >
        <Box
          component="div"
          ref={(el) => setContentElement(el as HTMLDivElement | null)}
          sx={{
            // Use absolute positioning to prevent panel content from
            // overflowing the container and breaking the layout
            position: 'absolute',
            width: (theme) => `calc(100% - ${theme.spacing(2)})`,
            height: (theme) => `calc(100% - ${theme.spacing(1)})`,
            top: 0,
            left: (theme) => theme.spacing(1),
            overflow: 'hidden',
          }}
        >
          {/* Actually render plugin with PanelContent component so we can wrap with a loading/error boundary */}
          <PanelContextProvider contentElement={contentElement}>
            <PluginBoundary
              loadingFallback="Loading..."
              ErrorFallbackComponent={AlertErrorFallback}
            >
              <PanelContent definition={definition} />
            </PluginBoundary>
          </PanelContextProvider>
        </Box>
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
