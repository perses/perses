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

import { PanelGroupItemId, useEditMode, usePanel, usePanelActions } from '../../context';
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
  const { isEditMode } = useEditMode();
  const { openEditPanel, openDeletePanelDialog } = usePanelActions(panelGroupItemId);

  // Provide actions to the panel when in edit mode
  let editHandlers: PanelProps['editHandlers'] = undefined;
  if (isEditMode) {
    editHandlers = {
      onEditPanelClick: openEditPanel,
      onDeletePanelClick: openDeletePanelDialog,
    };
  }

  return <Panel definition={panelDefinition} editHandlers={editHandlers} />;
}
