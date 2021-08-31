import { useState } from 'react';
import {
  Box,
  Card,
  CardProps,
  CardHeader,
  CardContent,
  Typography,
} from '@material-ui/core';
import { AnyPanelDefinition } from '@perses-ui/core';
import { PluginBoundary, usePanelComponent } from '../context/plugin-registry';
import { PanelContextProvider } from '../context/PanelContextProvider';
import AlertErrorFallback from './AlertErrorFallback';

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
