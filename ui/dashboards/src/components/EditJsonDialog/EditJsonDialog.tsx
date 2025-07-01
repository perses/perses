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

import { FormEvent, ReactElement, useState } from 'react';
import { Alert, FormControl } from '@mui/material';
import { Dialog, JSONEditor } from '@perses-dev/components';
import { /*useDatasourceStore,*/ useTimeRange } from '@perses-dev/plugin-system';
import { useEditJsonDialog, useDashboard } from '../../context';

export interface EditJsonDialogProps {
  isReadonly: boolean;
  disableMetadataEdition?: boolean;
}

export const EditJsonDialog = (props: EditJsonDialogProps): ReactElement => {
  const { isReadonly, disableMetadataEdition } = props;
  const { editJsonDialog, closeEditJsonDialog } = useEditJsonDialog();

  return (
    <Dialog open={!!editJsonDialog?.isOpen} scroll="paper" fullWidth maxWidth="lg">
      <Dialog.Header onClose={() => closeEditJsonDialog()}>{!isReadonly && 'Edit '} Dashboard JSON</Dialog.Header>
      {editJsonDialog?.isOpen && (
        <EditJsonDialogForm isReadonly={isReadonly} disableMetadataEdition={disableMetadataEdition} />
      )}
    </Dialog>
  );
};

const EditJsonDialogForm = (props: EditJsonDialogProps): ReactElement => {
  const { isReadonly, disableMetadataEdition } = props;
  const { closeEditJsonDialog } = useEditJsonDialog();
  const { setTimeRange, setRefreshInterval } = useTimeRange();
  const { dashboard, setDashboard } = useDashboard();
  /* TODO: 3059 */
  // const { setLocalDatasources } = useDatasourceStore();
  const [draftDashboard, setDraftDashboard] = useState(dashboard);

  const handleApply = (e: FormEvent): void => {
    e.preventDefault();
    setDashboard(draftDashboard);
    setTimeRange({ pastDuration: draftDashboard.spec.duration });
    setRefreshInterval(draftDashboard.spec.refreshInterval ?? '0s');
    /* TODO: 3059 */
    // setLocalDatasources(draftDashboard.spec.datasources ?? {});
    closeEditJsonDialog();
  };

  const completeDraftDashboard = (dashboard: string | undefined): void => {
    try {
      const json = JSON.parse(dashboard ?? '{}');
      setDraftDashboard(json);
    } catch (_) {
      // do nothing
    }
  };

  return (
    <Dialog.Form onSubmit={handleApply}>
      <Dialog.Content sx={{ width: '100%' }}>
        {disableMetadataEdition && !isReadonly && (
          <Alert sx={{ marginBottom: (theme) => theme.spacing(1) }} severity="warning">
            Metadata cannot be modified or saved.
          </Alert>
        )}
        {draftDashboard.kind === 'EphemeralDashboard' && (
          <Alert sx={{ marginBottom: 1 }} severity="warning">
            Time-to-live cannot be modified or saved from here. Go to the project view to modify it.
          </Alert>
        )}
        <FormControl fullWidth>
          <JSONEditor
            minHeight="300px"
            maxHeight="70vh"
            value={draftDashboard}
            onChange={(value: string) => completeDraftDashboard(value)}
            readOnly={isReadonly}
          />
        </FormControl>
      </Dialog.Content>
      {!isReadonly && (
        <Dialog.Actions>
          <Dialog.PrimaryButton onClick={handleApply}>Apply</Dialog.PrimaryButton>
        </Dialog.Actions>
      )}
    </Dialog.Form>
  );
};
