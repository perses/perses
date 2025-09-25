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

import { ReactElement, useState, useMemo, ReactNode, useCallback } from 'react';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { PanelEditorValues } from '@perses-dev/core';
import { useVariableValues, VariableContext } from '@perses-dev/plugin-system';
import { usePanelEditor } from '../../context';
import { PanelEditorForm } from './PanelEditorForm';

/**
 * The Add/Edit panel drawer for editing a panel's options.
 */
export const PanelDrawer = (): ReactElement => {
  const panelEditor = usePanelEditor();

  // When the user clicks close, start closing but don't call the store yet to keep values stable during animtation
  const [isClosing, setIsClosing] = useState(false);

  // Drawer is open if we have a model and we're not transitioning out
  const isOpen = panelEditor !== undefined && !isClosing;

  const handleSave = useCallback(
    (values: PanelEditorValues) => {
      // This shouldn't happen since we don't render the submit button until we have a model, but check to make TS happy
      if (panelEditor === undefined || values === undefined) {
        throw new Error('Cannot apply changes');
      }
      panelEditor.applyChanges(values);
      setIsClosing(true);
    },
    [panelEditor]
  );

  const handleClose = (): void => {
    setIsClosing(true);
  };

  // Don't call closeDrawer on the store until the Drawer has completely transitioned out and reset close state
  const handleExited = useCallback(() => {
    panelEditor?.close();
    setIsClosing(false);
  }, [panelEditor]);

  // Disables closing on click out. This is a quick-win solution to avoid losing draft changes.
  // -> TODO find a way to enable closing by clicking-out in edit view, with a discard confirmation modal popping up
  const handleClickOut = (): void => {
    /* do nothing */
  };

  const drawer = useMemo(() => {
    return (
      <Drawer
        isOpen={isOpen}
        onClose={handleClickOut}
        SlideProps={{ onExited: handleExited }}
        data-testid="panel-editor"
      >
        {/* When the drawer is opened, we should have panel editor state (this also ensures the form state gets reset between opens) */}
        {panelEditor && (
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <PanelEditorForm
              initialAction={panelEditor.mode}
              initialValues={panelEditor.initialValues}
              onSave={handleSave}
              onClose={handleClose}
            />
          </ErrorBoundary>
        )}
      </Drawer>
    );
  }, [handleExited, handleSave, isOpen, panelEditor]);

  // If the panel editor is using a repeat variable, we need to wrap the drawer in a VariableContext.Provider
  if (panelEditor?.panelGroupItemId?.repeatVariable) {
    return (
      <RepeatVariableWrapper repeatVariable={panelEditor.panelGroupItemId.repeatVariable}>
        {drawer}
      </RepeatVariableWrapper>
    );
  }

  return drawer;
};

// Wraps the drawer in a VariableContext.Provider to provide the repeat variable value
// This is necessary for previewing panels that use repeat variables and query editor
function RepeatVariableWrapper({
  repeatVariable,
  children,
}: {
  repeatVariable: [string, string];
  children: ReactNode;
}): ReactElement {
  const variables = useVariableValues();

  return (
    <VariableContext.Provider
      value={{ state: { ...variables, [repeatVariable[0]]: { value: repeatVariable[1], loading: false } } }}
    >
      {children}
    </VariableContext.Provider>
  );
}
