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

import { DispatchWithPromise, VariableDefinition, Variable, getVariableProject } from '@perses-dev/core';
import React, { Dispatch, DispatchWithoutAction, useEffect, useMemo, useState } from 'react';
import { DatasourceStoreProvider, TemplateVariableProvider } from '@perses-dev/dashboards';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import {
  Action,
  PluginRegistry,
  TimeRangeProvider,
  useInitialTimeRange,
  VariableEditorForm,
} from '@perses-dev/plugin-system';
import { bundledPluginLoader } from '../../model/bundled-plugins';
import { CachedDatasourceAPI, HTTPDatasourceAPI } from '../../model/datasource-api';
import { DeleteVariableDialog } from '../dialogs/DeleteVariableDialog';

interface VariableDrawerProps<T extends Variable> {
  variable: T;
  isOpen: boolean;
  action: Action;
  onSave: Dispatch<T>;
  onDelete?: DispatchWithPromise<T>;
  onClose: DispatchWithoutAction;
}

export function VariableDrawer<T extends Variable>(props: VariableDrawerProps<T>) {
  const { variable, isOpen, action, onSave, onDelete, onClose } = props;
  const projectName = getVariableProject(variable);
  const [isDeleteVariableDialogStateOpened, setDeleteVariableDialogStateOpened] = useState<boolean>(false);

  const [datasourceApi] = useState(() => new CachedDatasourceAPI(new HTTPDatasourceAPI()));
  useEffect(() => {
    // warm up the caching of the datasources
    if (projectName) datasourceApi.listDatasources(projectName);
    datasourceApi.listGlobalDatasources();
  }, [datasourceApi, projectName]);

  const variableDef = useMemo(() => {
    const result = structuredClone(variable.spec);
    result.spec.name = variable.metadata.name;
    return result;
  }, [variable]);

  const handleSave = (definition: VariableDefinition) => {
    variable.spec = definition;
    variable.metadata.name = definition.spec.name;
    if (onSave) {
      onSave(variable);
    }
  };

  const initialTimeRange = useInitialTimeRange('1h');

  // Disables closing on click out. This is a quick-win solution to avoid losing draft changes.
  // -> TODO find a way to enable closing by clicking-out in edit view, with a discard confirmation modal popping up
  const handleClickOut = () => {
    /* do nothing */
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClickOut} data-testid="variable-editor">
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <PluginRegistry
          pluginLoader={bundledPluginLoader}
          defaultPluginKinds={{
            Panel: 'TimeSeriesChart',
            TimeSeriesQuery: 'PrometheusTimeSeriesQuery',
          }}
        >
          <DatasourceStoreProvider datasourceApi={datasourceApi} projectName={projectName}>
            <TimeRangeProvider initialTimeRange={initialTimeRange} enabledURLParams={true}>
              <TemplateVariableProvider initialVariableDefinitions={[]}>
                <VariableEditorForm
                  initialVariableDefinition={variableDef}
                  initialAction={action}
                  onSave={handleSave}
                  onClose={onClose}
                  onDelete={onDelete ? () => setDeleteVariableDialogStateOpened(true) : undefined}
                />
              </TemplateVariableProvider>
            </TimeRangeProvider>
          </DatasourceStoreProvider>
        </PluginRegistry>
        {onDelete && (
          <DeleteVariableDialog
            open={isDeleteVariableDialogStateOpened}
            onClose={() => setDeleteVariableDialogStateOpened(false)}
            onSubmit={(v) =>
              onDelete(v).then(() => {
                setDeleteVariableDialogStateOpened(false);
                onClose();
              })
            }
            variable={variable}
          />
        )}
      </ErrorBoundary>
    </Drawer>
  );
}
