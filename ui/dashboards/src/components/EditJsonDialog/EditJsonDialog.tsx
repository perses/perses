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
import { Alert, FormControl } from '@mui/material';
import { Dialog, JSONEditor } from '@perses-dev/components';
import { useTimeRange } from '@perses-dev/plugin-system';
import { useEditJsonDialog } from '../../context/DashboardProvider';
import { useDashboard } from '../../context/useDashboard';

export interface EditJsonDialogProps {
  disableMetadataEdition?: boolean;
}

export const EditJsonDialog = (props: EditJsonDialogProps) => {
  const { disableMetadataEdition } = props;
  const { editJsonDialog, closeEditJsonDialog } = useEditJsonDialog();

  return (
    <Dialog open={!!editJsonDialog?.isOpen} scroll="paper" fullWidth maxWidth="lg">
      <Dialog.Header onClose={() => closeEditJsonDialog()}>Edit Dashboard JSON</Dialog.Header>
      {editJsonDialog?.isOpen && <EditJsonDialogForm disableMetadataEdition={disableMetadataEdition} />}
    </Dialog>
  );
};

const EditJsonDialogForm = (props: EditJsonDialogProps) => {
  const { disableMetadataEdition } = props;
  const { closeEditJsonDialog } = useEditJsonDialog();
  const { setTimeRange, setRefreshInterval } = useTimeRange();
  const { dashboard, setDashboard } = useDashboard();
  const [draftDashboard, setDraftDashboard] = useState(dashboard);

  const handleApply = (e: FormEvent) => {
    e.preventDefault();
    setDashboard(draftDashboard);
    setTimeRange({ pastDuration: draftDashboard.spec.duration });
    setRefreshInterval(draftDashboard.spec.refreshInterval ?? '0s');
    closeEditJsonDialog();
  };

  return (
    <Dialog.Form onSubmit={handleApply}>
      <Dialog.Content sx={{ width: '100%' }}>
        {disableMetadataEdition && (
          <Alert sx={{ marginBottom: (theme) => theme.spacing(1) }} severity="warning">
            Metadata cannot be modified or saved.
          </Alert>
        )}
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
