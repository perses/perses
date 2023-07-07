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

import { Datasource } from '@perses-dev/core';
import { DispatchWithoutAction, useState } from 'react';
import { DiscardChangesConfirmationDialog, Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { PluginRegistry } from '@perses-dev/plugin-system';
import { bundledPluginLoader } from '../../model/bundled-plugins';
import { DeleteDatasourceDialog } from '../dialogs/DeleteDatasourceDialog';
import { DatasourceEditorForm } from './DatasourceEditorForm';

interface DatasourceDrawerProps {
  datasource: Datasource;
  isOpen: boolean;
  saveAction: string;
  onSave: (datasource: Datasource) => void;
  onClose: DispatchWithoutAction;
}

export function DatasourceDrawer(props: DatasourceDrawerProps) {
  const { datasource, isOpen, saveAction, onSave, onClose } = props;
  const [isDeleteDatasourceDialogStateOpened, setDeleteDatasourceDialogStateOpened] = useState<boolean>(false);
  const [isDiscardDialogStateOpened, setDiscardDialogStateOpened] = useState<boolean>(false);
  const [hasDraftChanges, setHasDraftChanges] = useState<boolean>(false);

  const handleSave = (datasource: Datasource) => {
    setHasDraftChanges(false);
    onSave(datasource);
  };

  const handleClose = () => {
    if (hasDraftChanges) {
      setDiscardDialogStateOpened(true);
    } else {
      onClose();
    }
  };

  const handleDelete = () => {
    setHasDraftChanges(false);
    onClose();
  };

  const handleDiscard = () => {
    setHasDraftChanges(false);
    setDiscardDialogStateOpened(false);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} data-testid="datasource-editor">
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <PluginRegistry
          pluginLoader={bundledPluginLoader}
          // TODO this required field is useless here
          defaultPluginKinds={{
            Panel: 'TimeSeriesChart',
            TimeSeriesQuery: 'PrometheusTimeSeriesQuery',
          }}
        >
          {isOpen && (
            <DatasourceEditorForm
              initialDatasource={datasource}
              saveAction={saveAction}
              flagAsDraft={() => setHasDraftChanges(true)}
              onSave={handleSave}
              onCancel={handleClose}
              onDelete={saveAction == 'Update' ? () => setDeleteDatasourceDialogStateOpened(true) : undefined}
            />
          )}
        </PluginRegistry>
        <DeleteDatasourceDialog
          open={isDeleteDatasourceDialogStateOpened}
          onClose={() => setDeleteDatasourceDialogStateOpened(false)}
          onDelete={handleDelete}
          datasource={datasource}
        />
        <DiscardChangesConfirmationDialog
          description="Are you sure you want to discard your changes? Changes cannot be recovered."
          isOpen={isDiscardDialogStateOpened}
          onCancel={() => setDiscardDialogStateOpened(false)}
          onDiscardChanges={handleDiscard}
        />
      </ErrorBoundary>
    </Drawer>
  );
}
