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

import { usePlugin, PanelProps } from '@perses-dev/plugin-system';
import { Skeleton } from '@mui/material';

export interface PanelContentProps extends PanelProps<unknown> {
  panelPluginKind: string;
}

/**
 * A small wrapper component that renders the appropriate PanelComponent from a Panel plugin based on the panel
 * definition's kind. Used so that an ErrorBoundary can be wrapped around this.
 */
export function PanelContent(props: PanelContentProps) {
  const { panelPluginKind, contentDimensions, ...others } = props;
  const { data: plugin, isLoading } = usePlugin('Panel', panelPluginKind, { useErrorBoundary: true });
  const PanelComponent = plugin?.PanelComponent;

  if (isLoading) {
    return <Skeleton variant="rectangular" width={contentDimensions?.width} height={contentDimensions?.height} />;
  }

  if (PanelComponent === undefined) {
    throw new Error(`Missing PanelComponent from panel plugin for kind '${panelPluginKind}'`);
  }

  return <PanelComponent {...others} contentDimensions={contentDimensions} />;
}
