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

import { useState } from 'react';
import { Stack, Box, Button, Typography } from '@mui/material';
import { Drawer } from '@perses-dev/components';
import { useDashboardApp } from '../../context';
import { usePanelDrawerModel } from './panel-editor-form-model';
import { PanelEditorForm, panelEditorFormId, PanelEditorFormProps } from './PanelEditorForm';

export const PanelDrawer = () => {
  const { closePanelDrawer } = useDashboardApp();
  const model = usePanelDrawerModel();

  // When the user clicks close, start closing but don't call the store yet to keep values stable during animtation
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => setIsClosing(true);

  // Don't call closeDrawer on the store until the Drawer has completely transitioned out
  const handleExited = () => {
    closePanelDrawer();
    setIsClosing(false);
  };

  // Drawer is open if we have a model and we're not transitioning out
  const isOpen = model !== undefined && isClosing === false;

  const handleSubmit: PanelEditorFormProps['onSubmit'] = (values) => {
    // This shouldn't happen since we don't render the submit button until we have a model, but check to make TS happy
    if (model === undefined) {
      throw new Error('Cannot apply changes');
    }
    model.applyChanges(values);
    handleClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} SlideProps={{ onExited: handleExited }}>
      {/* When the drawer is opened, we should have a model */}
      {model !== undefined && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: (theme) => theme.spacing(2),
              paddingBottom: (theme) => theme.spacing(2),
              borderBottom: (theme) => `1px solid ${theme.palette.grey[100]}`,
            }}
          >
            <Typography variant="h2">{model.drawerTitle}</Typography>
            <Stack direction="row" spacing={1} sx={{ marginLeft: 'auto' }}>
              {/** Using the 'form' attribute lets us have a submit button outside the form element */}
              <Button type="submit" variant="contained" form={panelEditorFormId}>
                {model.submitButtonText}
              </Button>
              <Button variant="outlined" onClick={handleClose}>
                Cancel
              </Button>
            </Stack>
          </Box>
          <PanelEditorForm onSubmit={handleSubmit} initialValues={model.initialValues} />
        </>
      )}
    </Drawer>
  );
};
