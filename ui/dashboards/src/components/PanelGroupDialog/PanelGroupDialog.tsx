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

import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';
import { useState } from 'react';
import { usePanelGroupEditor } from '../../context';
import { PanelGroupEditorForm, panelGroupEditorFormId, PanelGroupEditorFormProps } from './PanelGroupEditorForm';

/**
 * A dialog for adding or editing a Panel Group. Open and initial state is controlled by the DashboardStore.
 */
export function PanelGroupDialog() {
  const panelGroupEditor = usePanelGroupEditor();

  // When the user clicks close, start closing but don't call the store yet to keep values stable during animtation
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => setIsClosing(true);

  // Don't call close on the store until the Dialog has completely transitioned out
  const handleExited = () => {
    panelGroupEditor?.close();
    setIsClosing(false);
  };

  // Dialog is open if we have a model and we're not transitioning out
  const isOpen = panelGroupEditor !== undefined && isClosing === false;

  const handleSubmit: PanelGroupEditorFormProps['onSubmit'] = (values) => {
    // This shouldn't happen since we don't render the submit button until we have a model, but check to make TS happy
    if (panelGroupEditor === undefined) {
      throw new Error('Cannot apply changes');
    }
    panelGroupEditor.applyChanges(values);
    handleClose();
  };

  return (
    <Dialog open={isOpen} TransitionProps={{ onExited: handleExited }}>
      {panelGroupEditor !== undefined && (
        <>
          <DialogTitle>{panelGroupEditor.mode} Panel Group</DialogTitle>
          <IconButton
            aria-label="Close"
            onClick={panelGroupEditor.close}
            sx={(theme) => ({
              position: 'absolute',
              top: theme.spacing(0.5),
              right: theme.spacing(0.5),
            })}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent sx={{ width: '500px' }}>
            <PanelGroupEditorForm initialValues={panelGroupEditor.initialValues} onSubmit={handleSubmit} />
          </DialogContent>
          <DialogActions>
            <Button variant="contained" type="submit" form={panelGroupEditorFormId}>
              {panelGroupEditor.mode === 'Edit' ? 'Apply' : 'Add'}
            </Button>
            <Button onClick={panelGroupEditor.close}>Cancel</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
