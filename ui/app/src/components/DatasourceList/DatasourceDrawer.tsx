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
import { DispatchWithoutAction, useCallback, useState } from 'react';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { PluginRegistry } from '@perses-dev/plugin-system';
import { bundledPluginLoader } from '../../model/bundled-plugins';
import { DeleteDatasourceDialog } from '../dialogs/DeleteDatasourceDialog';
import { DatasourceEditorForm } from './DatasourceEditorForm';

export type ActionStr = 'Create' | 'Update';

interface DatasourceDrawerProps {
  datasource: Datasource;
  isOpen: boolean;
  saveActionStr: ActionStr;
  onSave: (datasource: Datasource) => void;
  onClose: DispatchWithoutAction;
}

export function DatasourceDrawer(props: DatasourceDrawerProps) {
  const { datasource, isOpen, saveActionStr, onSave, onClose } = props;
  const [isDeleteDatasourceDialogStateOpened, setDeleteDatasourceDialogStateOpened] = useState<boolean>(false);

  // When user clicks out of the drawer, do not close it, just do nothing
  // This is a quick-win solution to avoid losing draft changes
  // -> TODO allow closing by clicking-out without being too sensitive to missclicks
  const handleClickOut = useCallback(() => {
    return;
  }, []);

  return (
    <Drawer isOpen={isOpen} onClose={handleClickOut} data-testid="datasource-editor">
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
              saveActionStr={saveActionStr}
              onSave={onSave}
              onClose={onClose}
              onDelete={saveActionStr == 'Update' ? () => setDeleteDatasourceDialogStateOpened(true) : undefined}
            />
          )}
        </PluginRegistry>
        <DeleteDatasourceDialog
          open={isDeleteDatasourceDialogStateOpened}
          onClose={() => setDeleteDatasourceDialogStateOpened(false)}
          onDelete={onClose}
          datasource={datasource}
        />
      </ErrorBoundary>
    </Drawer>
  );
}
