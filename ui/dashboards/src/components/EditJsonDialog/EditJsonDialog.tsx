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

import { FormEvent, useState } from 'react';
import { FormControl } from '@mui/material';
import { Dialog, JSONEditor } from '@perses-dev/components';
import { useEditJsonDialog } from '../../context/DashboardProvider';
import { useDashboard } from '../../context/useDashboard';

export const EditJsonDialog = () => {
  const { editJsonDialog, closeEditJsonDialog } = useEditJsonDialog();

  return (
    <Dialog open={!!editJsonDialog?.isOpen} scroll="paper" fullWidth maxWidth="lg">
      <Dialog.Header onClose={() => closeEditJsonDialog()}>Edit Dashboard</Dialog.Header>
      {editJsonDialog?.isOpen && <EditJsonDialogForm />}
    </Dialog>
  );
};

const EditJsonDialogForm = () => {
  const { closeEditJsonDialog } = useEditJsonDialog();
  const { dashboard, setDashboard } = useDashboard();
  const [draftDashboard, setDraftDashboard] = useState(dashboard);

  const handleApply = (e: FormEvent) => {
    e.preventDefault();
    setDashboard(draftDashboard);
    closeEditJsonDialog();
  };

  return (
    <Dialog.Form onSubmit={handleApply}>
      <Dialog.Content sx={{ width: '100%' }}>
        <FormControl fullWidth>
          <JSONEditor
            minHeight="300px"
            maxHeight="700px"
            value={draftDashboard}
            onChange={(value) => setDraftDashboard(value)}
          />
        </FormControl>
      </Dialog.Content>
      <Dialog.Actions>
        <Dialog.PrimaryButton onClick={handleApply}>Apply</Dialog.PrimaryButton>
      </Dialog.Actions>
    </Dialog.Form>
  );
};
