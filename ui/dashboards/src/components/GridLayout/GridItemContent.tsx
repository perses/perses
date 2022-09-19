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

import { ErrorAlert } from '@perses-dev/components';
import { DashboardSpec, GridItemDefinition, resolvePanelRef } from '@perses-dev/core';
import { Panel } from '../Panel/Panel';

export interface GridItemContentProps {
  spec: DashboardSpec;
  content: GridItemDefinition['content'];
  groupIndex: number;
}

/**
 * Resolves the reference to panel content in a GridItemDefinition and renders the panel.
 */
export function GridItemContent(props: GridItemContentProps) {
  const { content, spec, groupIndex } = props;
  try {
    const { panelDefinition, panelsKey } = resolvePanelRef(spec, content);
    return <Panel definition={panelDefinition} groupIndex={groupIndex} panelRef={panelsKey} />;
  } catch (err) {
    return <ErrorAlert error={err as Error} />;
  }
}
