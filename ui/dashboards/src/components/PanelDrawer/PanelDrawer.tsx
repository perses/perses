/* eslint-disable @typescript-eslint/no-empty-function */
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

import { useState } from 'react';
import { Drawer } from '@perses-dev/components';
import { PanelEditorValues, usePanelEditor } from '../../context';
import { PanelEditorForm } from './PanelEditorForm';

/**
 * The Add/Edit panel drawer for editing a panel's options.
 */
export const PanelDrawer = () => {
  const panelEditor = usePanelEditor();

  // When the user clicks close, start closing but don't call the store yet to keep values stable during animtation
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => {
    setIsClosing(true);
  };

  // Drawer is open if we have a model and we're not transitioning out
  const isOpen = panelEditor !== undefined && isClosing === false;

  function handleSave(values: PanelEditorValues) {
    // This shouldn't happen since we don't render the submit button until we have a model, but check to make TS happy
    if (panelEditor === undefined || values === undefined) {
      throw new Error('Cannot apply changes');
    }
    panelEditor.applyChanges(values);
    setIsClosing(true);
  }

  // Disables closing on click out. This is a quick-win solution to avoid losing draft changes.
  // -> TODO find a way to enable closing by clicking-out in edit view, with a discard confirmation modal popping up
  const handleClickOut = () => {
    /* do nothing */
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClickOut} data-testid="panel-editor">
      {/* When the drawer is opened, we should have panel editor state (this also ensures the form state gets reset between opens) */}
      {panelEditor && (
        <PanelEditorForm
          initialAction="update"
          initialValues={panelEditor.initialValues}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}
    </Drawer>
  );
};
