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
import useResizeObserver from 'use-resize-observer';
import { useInView } from 'react-intersection-observer';
import { ErrorBoundary, ErrorAlert, combineSx } from '@perses-dev/components';
import { PanelDefinition } from '@perses-dev/core';
import { Card, CardProps, CardContent } from '@mui/material';
import { useId } from '../../utils/component-ids';
import { PanelHeader, PanelHeaderProps } from './PanelHeader';
import { PanelContent } from './PanelContent';

export interface PanelProps extends CardProps<'section'> {
  definition: PanelDefinition;
  editHandlers?: PanelHeaderProps['editHandlers'];
}

/**
 * Renders a PanelDefinition's content inside of a Card.
 */
export function Panel(props: PanelProps) {
  const { definition, editHandlers, onMouseEnter, onMouseLeave, sx, ...others } = props;

  // Make sure we have an ID we can use for aria attributes
  const generatedPanelId = useId('Panel');
  const headerId = `${generatedPanelId}-header`;

  const [contentElement, setContentElement] = useState<HTMLElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { width, height } = useResizeObserver({ ref: contentElement });

  const contentDimensions = useMemo(() => {
    if (width === undefined || height === undefined) return undefined;
    return { width, height };
  }, [width, height]);

  const { ref, inView } = useInView({
    threshold: 0.3,
    initialInView: false,
    triggerOnce: true,
  });

  // TODO: adjust padding for small panels, consistent way to determine isLargePanel here and in StatChart
  const panelPadding = 1.5;

  const handleMouseEnter: CardProps['onMouseEnter'] = (e) => {
    setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave: CardProps['onMouseLeave'] = (e) => {
    setIsHovered(false);
    onMouseLeave?.(e);
  };

  return (
    <Card
      ref={ref}
      component="section"
      sx={combineSx(
        {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexFlow: 'column nowrap',
        },
        sx
      )}
      variant="outlined"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-labelledby={headerId}
      aria-describedby={headerId}
      {...others}
    >
      <PanelHeader
        id={headerId}
        title={definition.spec.display.name}
        description={definition.spec.display.description}
        editHandlers={editHandlers}
        isHovered={isHovered}
        sx={{ paddingX: (theme) => theme.spacing(panelPadding) }}
      />
      <CardContent
        component="figure"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          flexGrow: 1,
          margin: 0,
          padding: (theme) => theme.spacing(panelPadding),
          // Override MUI default style for last-child
          ':last-child': {
            padding: (theme) => theme.spacing(panelPadding),
          },
        }}
        ref={setContentElement}
      >
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          {inView === true && (
            <PanelContent
              panelPluginKind={definition.spec.plugin.kind}
              spec={definition.spec.plugin.spec}
              contentDimensions={contentDimensions}
            />
          )}
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
}
