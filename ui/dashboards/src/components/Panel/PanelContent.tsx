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

import { usePanelPlugin, PanelProps } from '@perses-dev/plugin-system';

export type PanelContentProps = PanelProps<unknown>;

/**
 * A small wrapper component that renders the appropriate PanelComponent from a Panel plugin based on the panel
 * definition's kind. Used so that a PluginLoadingBoundary can be wrapped around this for fallback UI while
 * the plugin is loading.
 */
export function PanelContent(props: PanelContentProps) {
  const { PanelComponent } = usePanelPlugin(props.definition.spec.panelPlugin.kind);
  return <PanelComponent {...props} />;
}
