/* eslint-disable @typescript-eslint/no-empty-function */
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

import { useCallback, useState } from 'react';
import { Stack, Box, Button, Typography } from '@mui/material';
import { Drawer } from '@perses-dev/components';
import { PanelEditorValues, useDiscardChangesConfirmationDialog, usePanelEditor } from '../../context';
import { PanelEditorForm, PanelEditorFormProps } from './PanelEditorForm';

/**
 * The Add/Edit panel drawer for editing a panel's options.
 */
export const PanelDrawer = () => {
  const panelEditor = usePanelEditor();
  const { openDiscardChangesConfirmationDialog, closeDiscardChangesConfirmationDialog } =
    useDiscardChangesConfirmationDialog();

  const [values, setValues] = useState<PanelEditorValues | undefined>(undefined);

  // When the user clicks close, start closing but don't call the store yet to keep values stable during animtation
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => {
    const isModified = JSON.stringify(panelEditor?.initialValues) !== JSON.stringify(values);
    if (isModified) {
      openDiscardChangesConfirmationDialog({
        onDiscardChanges: () => {
          closeDiscardChangesConfirmationDialog();
          setIsClosing(true);
        },
        onCancel: () => {
          closeDiscardChangesConfirmationDialog();
        },
        description:
          'You have unapplied changes in this panel. Are you sure you want to discard these changes? Changes cannot be recovered.',
      });
    } else {
      setIsClosing(true);
    }
  };

  // Don't call closeDrawer on the store until the Drawer has completely transitioned out
  const handleExited = () => {
    panelEditor?.close();
    setIsClosing(false);
  };

  // Drawer is open if we have a model and we're not transitioning out
  const isOpen = panelEditor !== undefined && isClosing === false;

  const handleSubmit = () => {
    // This shouldn't happen since we don't render the submit button until we have a model, but check to make TS happy
    if (panelEditor === undefined || values === undefined) {
      throw new Error('Cannot apply changes');
    }
    panelEditor.applyChanges(values);
    setIsClosing(true);
  };

  const handleChange: PanelEditorFormProps['onChange'] = useCallback((values) => {
    setValues(values);
  }, []);

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} SlideProps={{ onExited: handleExited }} data-testid="panel-editor">
      {/* When the drawer is opened, we should have panel editor state (this also ensures the form state gets reset between opens) */}
      {panelEditor !== undefined && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: (theme) => theme.spacing(1, 2),
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h2">{panelEditor.mode} Panel</Typography>
            <Stack direction="row" spacing={1} marginLeft="auto">
              {/* Using the 'form' attribute lets us have a submit button like this outside the form element */}
              <Button type="submit" variant="contained" onClick={handleSubmit}>
                {panelEditor.mode === 'Add' ? 'Add' : 'Apply'}
              </Button>
              <Button color="secondary" variant="outlined" onClick={handleClose}>
                Cancel
              </Button>
            </Stack>
          </Box>
          <PanelEditorForm initialValues={panelEditor.initialValues} onChange={handleChange} />
        </>
      )}
    </Drawer>
  );
};
