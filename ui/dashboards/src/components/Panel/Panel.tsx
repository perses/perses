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

import { Card, CardContent, CardProps } from '@mui/material';
import { ErrorAlert, ErrorBoundary, combineSx, useChartsTheme, useId } from '@perses-dev/components';
import { PanelDefinition } from '@perses-dev/core';
import { useDataQueriesContext } from '@perses-dev/plugin-system';
import { ReactNode, memo, useMemo, useState } from 'react';
import useResizeObserver from 'use-resize-observer';
import { PanelGroupItemId } from '../../context';
import { PanelContent } from './PanelContent';
import { PanelHeader, PanelHeaderProps } from './PanelHeader';

export interface PanelProps extends CardProps<'section'> {
  definition: PanelDefinition;
  readHandlers?: PanelHeaderProps['readHandlers'];
  editHandlers?: PanelHeaderProps['editHandlers'];
  panelOptions?: PanelOptions;
  panelGroupItemId?: PanelGroupItemId;
}

export type PanelOptions = {
  /**
   * Allow you to hide the panel header if desired.
   * This can be useful in embedded mode for example.
   */
  hideHeader?: boolean;
  /**
   * Content to render in right of the panel header. (top right of the panel)
   * It will only be rendered when the panel is in edit mode.
   */
  extra?: (props: PanelExtraProps) => ReactNode;
};

export type PanelExtraProps = {
  /**
   * The PanelDefinition for the panel.
   */
  panelDefinition?: PanelDefinition;
  /**
   * The PanelGroupItemId for the panel.
   */
  panelGroupItemId?: PanelGroupItemId;
};

/**
 * Renders a PanelDefinition's content inside of a Card.
 */
export const Panel = memo(function Panel(props: PanelProps) {
  const {
    definition,
    readHandlers,
    editHandlers,
    onMouseEnter,
    onMouseLeave,
    sx,
    panelOptions,
    panelGroupItemId,
    ...others
  } = props;

  // Make sure we have an ID we can use for aria attributes
  const generatedPanelId = useId('Panel');
  const headerId = `${generatedPanelId}-header`;

  const [contentElement, setContentElement] = useState<HTMLElement | null>(null);

  const { width, height } = useResizeObserver({ ref: contentElement });

  const contentDimensions = useMemo(() => {
    if (width === undefined || height === undefined) return undefined;
    return { width, height };
  }, [width, height]);

  const chartsTheme = useChartsTheme();

  const { queryResults } = useDataQueriesContext();

  const handleMouseEnter: CardProps['onMouseEnter'] = (e) => {
    onMouseEnter?.(e);
  };

  const handleMouseLeave: CardProps['onMouseLeave'] = (e) => {
    onMouseLeave?.(e);
  };

  return (
    <Card
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
      data-testid="panel"
      {...others}
    >
      {!panelOptions?.hideHeader && (
        <PanelHeader
          extra={panelOptions?.extra?.({ panelDefinition: definition, panelGroupItemId })}
          id={headerId}
          title={definition.spec.display.name}
          description={definition.spec.display.description}
          readHandlers={readHandlers}
          editHandlers={editHandlers}
          queryResults={queryResults}
          links={definition.spec.links}
          sx={{ paddingX: `${chartsTheme.container.padding.default}px` }}
        />
      )}
      <CardContent
        component="figure"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          flexGrow: 1,
          margin: 0,
          padding: 0,
          // Override MUI default style for last-child
          ':last-child': {
            padding: 0,
          },
        }}
        ref={setContentElement}
      >
        <ErrorBoundary FallbackComponent={ErrorAlert} resetKeys={[definition.spec]}>
          <PanelContent
            definition={definition}
            panelPluginKind={definition.spec.plugin.kind}
            queryResults={queryResults}
            spec={definition.spec.plugin.spec}
            contentDimensions={contentDimensions}
          />
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
});
