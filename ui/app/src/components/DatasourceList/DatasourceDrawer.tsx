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

import { Datasource, DispatchWithPromise } from '@perses-dev/core';
import { Dispatch, DispatchWithoutAction, useCallback, useState } from 'react';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { PluginRegistry } from '@perses-dev/plugin-system';
import { bundledPluginLoader } from '../../model/bundled-plugins';
import { DeleteDatasourceDialog } from '../dialogs/DeleteDatasourceDialog';
import { Action, DatasourceEditorForm } from './DatasourceEditorForm';

interface DatasourceDrawerProps<T extends Datasource> {
  datasource: T;
  isOpen: boolean;
  action: Action;
  onSave: Dispatch<T>;
  onDelete?: DispatchWithPromise<T>;
  onClose: DispatchWithoutAction;
}

export function DatasourceDrawer<T extends Datasource>(props: DatasourceDrawerProps<T>) {
  const { datasource, isOpen, action, onSave, onClose, onDelete } = props;
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
              action={action}
              onSave={onSave}
              onClose={onClose}
              onDelete={action == 'update' && onDelete ? () => setDeleteDatasourceDialogStateOpened(true) : undefined}
            />
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
