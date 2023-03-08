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

import { QueryDefinition } from '@perses-dev/core';
import { DataQueriesProvider } from '@perses-dev/plugin-system';
import { useRef } from 'react';
import useResizeObserver from 'use-resize-observer';
import { PanelGroupItemId, useEditMode, usePanel, usePanelActions } from '../../context';
import { useSuggestedStepMs } from '../../utils';
import { Panel, PanelProps } from '../Panel/Panel';

export interface GridItemContentProps {
  panelGroupItemId: PanelGroupItemId;
}

/**
 * Resolves the reference to panel content in a GridItemDefinition and renders the panel.
 */
export function GridItemContent(props: GridItemContentProps) {
  const { panelGroupItemId } = props;
  const panelDefinition = usePanel(panelGroupItemId);
  const {
    spec: { queries },
  } = panelDefinition;
  const { isEditMode } = useEditMode();
  const { openEditPanel, openDeletePanelDialog, duplicatePanel } = usePanelActions(panelGroupItemId);

  // Provide actions to the panel when in edit mode
  let editHandlers: PanelProps['editHandlers'] = undefined;
  if (isEditMode) {
    editHandlers = {
      onEditPanelClick: openEditPanel,
      onDuplicatePanelClick: duplicatePanel,
      onDeletePanelClick: openDeletePanelDialog,
    };
  }

  // calculate width for suggestedStepMs
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { width } = useResizeObserver({ ref: panelRef.current });
  const suggestedStepMs = useSuggestedStepMs(width);

  if (queries) {
    // map TimeSeriesQueryDefinition to Definition<UnknownSpec>
    const definitions = queries.map((query: QueryDefinition) => {
      return {
        kind: query.spec.plugin.kind,
        spec: query.spec.plugin.spec,
      };
    });

    return (
      <DataQueriesProvider definitions={definitions} options={{ suggestedStepMs }}>
        <Panel ref={panelRef} definition={panelDefinition} editHandlers={editHandlers} />
      </DataQueriesProvider>
    );
  }

  return <Panel ref={panelRef} definition={panelDefinition} editHandlers={editHandlers} />;
}
