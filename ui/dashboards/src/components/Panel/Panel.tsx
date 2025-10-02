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
import { useDataQueriesContext, usePluginRegistry } from '@perses-dev/plugin-system';
import { ReactNode, memo, useMemo, useState, useEffect } from 'react';
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
  viewQueriesHandler?: PanelHeaderProps['viewQueriesHandler'];
}

export type PanelOptions = {
  /**
   * Allow you to hide the panel header if desired.
   * This can be useful in embedded mode for example.
   */
  hideHeader?: boolean;
  /**
   * Whether to show panel icons always, or only when hovering over the panel.
   * Default: if the dashboard is in editing mode or the panel is in fullscreen mode: 'always', otherwise 'hover'
   */
  showIcons?: 'always' | 'hover';
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
 *
 * Internal structure:
 * <Panel>                  // renders an entire panel, incl. header and action buttons
 *   <PanelContent>         // renders loading, error or panel based on the queries' status
 *     <PanelPluginLoader>  // loads a panel plugin from the plugin registry and renders the PanelComponent with data from props.queryResults
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
    viewQueriesHandler,
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
  const { getPlugin } = usePluginRegistry();

  const panelPropsForActions = useMemo(() => {
    return {
      spec: definition.spec.plugin.spec,
      queryResults: queryResults.map((query) => ({
        definition: query.definition,
        data: query.data,
      })),
      contentDimensions,
      definition,
    };
  }, [definition, contentDimensions, queryResults]);

  // Load plugin actions from the plugin
  const [pluginActions, setPluginActions] = useState<ReactNode[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadPluginActions = async (): Promise<void> => {
      const panelPluginKind = definition.spec.plugin.kind;
      const panelProps = panelPropsForActions;

      if (!panelPluginKind || !panelProps) {
        if (!cancelled) {
          setPluginActions([]);
        }
        return;
      }

      try {
        // Add defensive check for getPlugin availability
        if (!getPlugin || typeof getPlugin !== 'function') {
          if (!cancelled) {
            setPluginActions([]);
          }
          return;
        }

        const plugin = await getPlugin('Panel', panelPluginKind);

        if (cancelled) return;

        // More defensive checking for plugin and actions
        if (
          !plugin ||
          typeof plugin !== 'object' ||
          !plugin.actions ||
          !Array.isArray(plugin.actions) ||
          plugin.actions.length === 0
        ) {
          if (!cancelled) {
            setPluginActions([]);
          }
          return;
        }

        // Render plugin actions in header location
        const headerActions = plugin.actions
          .filter((action) => !action.location || action.location === 'header')
          .map((action, index): ReactNode | null => {
            const ActionComponent = action.component;
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return <ActionComponent key={`plugin-action-${index}`} {...(panelProps as any)} />;
            } catch (error) {
              console.warn(`Failed to render plugin action ${index}:`, error);
              return null;
            }
          })
          .filter((item): item is ReactNode => Boolean(item));

        if (!cancelled) {
          setPluginActions(headerActions);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to load plugin actions:', error);
          setPluginActions([]);
        }
      }
    };

    // Use setTimeout to defer the async operation to the next tick
    const timeoutId = setTimeout(() => {
      loadPluginActions();
    }, 0);

    return (): void => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [definition.spec.plugin.kind, panelPropsForActions, getPlugin]);

  const handleMouseEnter: CardProps['onMouseEnter'] = (e) => {
    onMouseEnter?.(e);
  };

  const handleMouseLeave: CardProps['onMouseLeave'] = (e) => {
    onMouseLeave?.(e);
  };

  // default value for showIcons: if the dashboard is in editing mode or the panel is in fullscreen mode: 'always', otherwise 'hover'
  const showIcons = panelOptions?.showIcons ?? (editHandlers || readHandlers?.isPanelViewed ? 'always' : 'hover');

  return (
    <Card
      component="section"
      sx={combineSx(
        {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexFlow: 'column nowrap',
          ':hover': { '--panel-hover': 'block' },
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
          queryResults={queryResults}
          readHandlers={readHandlers}
          editHandlers={editHandlers}
          viewQueriesHandler={viewQueriesHandler}
          links={definition.spec.links}
          pluginActions={pluginActions}
          showIcons={showIcons}
          sx={{ paddingX: `${chartsTheme.container.padding.default}px` }}
          dimension={contentDimensions}
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
        <ErrorBoundary FallbackComponent={ErrorAlert} resetKeys={[definition.spec, queryResults]}>
          <PanelContent
            definition={definition}
            panelPluginKind={definition.spec.plugin.kind}
            spec={definition.spec.plugin.spec}
            contentDimensions={contentDimensions}
            queryResults={queryResults}
          />
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
});
