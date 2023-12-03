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

import { Action, Datasource, DatasourceSpec, DispatchWithPromise } from '@perses-dev/core';
import { DispatchWithoutAction, useState } from 'react';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { DatasourceEditorForm, PluginRegistry } from '@perses-dev/plugin-system';
import { DatasourceStoreProvider } from '@perses-dev/dashboards';
import { bundledPluginLoader } from '../../model/bundled-plugins';
import { DeleteDatasourceDialog } from '../dialogs/DeleteDatasourceDialog';
import { HTTPDatasourceAPI } from '../../model/datasource-api';

interface DatasourceDrawerProps<T extends Datasource> {
  datasource: T;
  isOpen: boolean;
  action: Action;
  isReadonly?: boolean;
  shouldTest?: boolean;
  onSave: DispatchWithPromise<T>;
  onDelete?: DispatchWithPromise<T>;
  onClose: DispatchWithoutAction;
}

export function DatasourceDrawer<T extends Datasource>(props: DatasourceDrawerProps<T>) {
  const { datasource, isOpen, action, isReadonly, onSave, onClose, onDelete } = props;
  const [isDeleteDatasourceDialogStateOpened, setDeleteDatasourceDialogStateOpened] = useState<boolean>(false);

  // Disables closing on click out. This is a quick-win solution to avoid losing draft changes.
  // -> TODO find a way to enable closing by clicking-out in edit view, with a discard confirmation modal popping up
  const handleClickOut = () => {
    /* do nothing */
  };

  const handleSave = async (name: string, spec: DatasourceSpec) => {
    datasource.spec = spec;
    datasource.metadata.name = name;
    return onSave(datasource);
  };

  const [datasourceApi] = useState(() => new HTTPDatasourceAPI());

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
            <DatasourceStoreProvider datasourceApi={datasourceApi}>
              <DatasourceEditorForm
                initialName={datasource.metadata.name}
                initialSpec={datasource.spec}
                initialAction={action}
                isDraft={false}
                isReadonly={isReadonly}
                shouldTest={true}
                onSave={handleSave}
                onClose={onClose}
                onDelete={onDelete ? () => setDeleteDatasourceDialogStateOpened(true) : undefined}
              />
            </DatasourceStoreProvider>
          )}
        </PluginRegistry>
        {onDelete && (
          <DeleteDatasourceDialog
            open={isDeleteDatasourceDialogStateOpened}
            onClose={() => setDeleteDatasourceDialogStateOpened(false)}
            onSubmit={(d) =>
              onDelete(d).then(() => {
                setDeleteDatasourceDialogStateOpened(false);
                onClose();
              })
            }
            datasource={datasource}
          />
        )}
      </ErrorBoundary>
    </Drawer>
  );
}
