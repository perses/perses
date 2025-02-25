// Copyright 2025 The Perses Authors
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

import { usePlugin, PanelProps } from '@perses-dev/plugin-system';
import { UnknownSpec, QueryDataType } from '@perses-dev/core';
import { ReactElement } from 'react';
import { Skeleton } from '@mui/material';

interface PanelPluginProps extends PanelProps<UnknownSpec, QueryDataType> {
  kind: string;
}

/**
 * PanelPluginLoader loads the panel plugin specified by the 'kind' prop from the plugin registry and
 * renders its PanelComponent.
 */
export function PanelPluginLoader(props: PanelPluginProps): ReactElement {
  const { kind, spec, contentDimensions, definition, queryResults } = props;
  const { data: plugin, isLoading: isPanelLoading } = usePlugin('Panel', kind, { throwOnError: true });
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
    throw new Error(`Missing PanelComponent from panel plugin for kind '${kind}'`);
  }

  for (const queryResult of queryResults) {
    if (!supportedQueryTypes.includes(queryResult.definition.kind)) {
      throw new Error(
        `This panel does not support queries of type '${queryResult.definition.kind}'. Supported query types: ${supportedQueryTypes.join(', ')}.`
      );
    }
  }

  return (
    <PanelComponent
      spec={spec}
      contentDimensions={contentDimensions}
      definition={definition}
      queryResults={queryResults}
    />
  );
}
