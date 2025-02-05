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

import { usePlugin, PanelProps, QueryData, PanelPlugin } from '@perses-dev/plugin-system';
import { UnknownSpec, PanelDefinition, QueryDataType } from '@perses-dev/core';
import { ReactElement } from 'react';
import { LoadingOverlay } from '@perses-dev/components';
import { Skeleton } from '@mui/material';

export interface PanelContentProps extends Omit<PanelProps<UnknownSpec>, 'queryResults'> {
  panelPluginKind: string;
  definition?: PanelDefinition<UnknownSpec>;
  queryResults: QueryData[];
}

/**
 * A small wrapper component that renders the appropriate PanelComponent from a Panel plugin based on the panel
 * definition's kind. Used so that an ErrorBoundary can be wrapped around this.
 */
export function PanelContent(props: PanelContentProps): ReactElement {
  const { panelPluginKind, definition, queryResults, spec, contentDimensions } = props;
  const { data: plugin, isLoading: isPanelLoading } = usePlugin('Panel', panelPluginKind, { throwOnError: true });

  const PanelComponent = plugin?.PanelComponent;
  const supportedQueryTypes = plugin?.supportedQueryTypes || [];

  // Show fullsize skeleton if the panel plugin is loading.
  if (isPanelLoading) {
    return (
      <Skeleton
        variant="rectangular"
        width={contentDimensions?.width}
        height={contentDimensions?.height}
        aria-label="Loading..."
      />
    );
  }

  if (PanelComponent === undefined) {
    throw new Error(`Missing PanelComponent from panel plugin for kind '${panelPluginKind}'`);
  }

  // Render the panel if any query has data, or the panel doesn't have a query attached (for example MarkdownPanel).
  // Loading indicator or errors of other queries are shown in the panel header.
  const queryResultsWithData = queryResults.flatMap((q) =>
    q.data && supportedQueryTypes.includes(q.definition.kind) ? [{ data: q.data, definition: q.definition }] : []
  );
  if (queryResultsWithData.length > 0 || queryResults.length === 0) {
    return (
      <PanelComponent
        spec={spec}
        contentDimensions={contentDimensions}
        definition={definition}
        queryResults={queryResultsWithData}
      />
    );
  }

  // No query has data, show loading overlay if any query is fetching data.
  if (queryResults.some((q) => q.isFetching)) {
    return <PanelLoading plugin={plugin} spec={spec} definition={definition} contentDimensions={contentDimensions} />;
  }

  // No query has data or is loading, show the error if any query has an error.
  // The error will be catched in <ErrorBoundary> of <Panel>.
  const queryError = queryResults.find((q) => q.error);
  if (queryError) {
    throw queryError.error;
  }

  // At this point, one or more queries are defined, but no query has data, is loading, or has an error.
  // This can happen if all queries are disabled (e.g. dependent dashboard variables are loading, or they are not in the viewport of the browser).
  // Most likely, some query will be enabled later. Render the panel loading skeleton.
  return <PanelLoading plugin={plugin} spec={spec} definition={definition} contentDimensions={contentDimensions} />;
}

interface PanelLoadingProps extends Pick<PanelContentProps, 'spec' | 'definition' | 'contentDimensions'> {
  plugin?: PanelPlugin<UnknownSpec, PanelProps<UnknownSpec, QueryDataType>>;
}

function PanelLoading({ plugin, spec, definition, contentDimensions }: PanelLoadingProps): ReactElement {
  if (plugin?.LoadingComponent) {
    return (
      <plugin.LoadingComponent
        spec={spec}
        contentDimensions={contentDimensions}
        definition={definition}
        queryResults={[]}
      />
    );
  }
  return <LoadingOverlay />;
}
