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

import { getPanelKeyFromRef, GridItemDefinition } from '@perses-dev/core';
import { usePanels } from '../../context';
import { Panel } from '../Panel/Panel';

export interface GridItemContentProps {
  groupIndex: number;
  itemIndex: number;
  content: GridItemDefinition['content'];
}

/**
 * Resolves the reference to panel content in a GridItemDefinition and renders the panel.
 */
export function GridItemContent(props: GridItemContentProps) {
  const { content, groupIndex, itemIndex } = props;

  // Find the panel referenced in content in the store
  const { panels } = usePanels();
  const panelKey = getPanelKeyFromRef(content);
  const panelDefinition = panels[panelKey];
  if (panelDefinition === undefined) {
    throw new Error(`Panel with key '${panelKey}' was not found`);
  }
  return <Panel definition={panelDefinition} groupIndex={groupIndex} itemIndex={itemIndex} />;
}
