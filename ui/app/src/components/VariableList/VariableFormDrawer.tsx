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

import { VariableDefinition, VariableResource } from '@perses-dev/core';
import React, { DispatchWithoutAction, useEffect, useMemo, useState } from 'react';
import { Action, DatasourceStoreProvider, TemplateVariableProvider, VariableEditForm } from '@perses-dev/dashboards';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { PluginRegistry, TimeRangeProvider, useInitialTimeRange } from '@perses-dev/plugin-system';
import { bundledPluginLoader } from '../../model/bundled-plugins';
import { CachedDatasourceAPI, HTTPDatasourceAPI } from '../../model/datasource-api';

interface VariableFormDrawerProps {
  variable: VariableResource;
  isOpen: boolean;
  onChange?: (variable: VariableResource) => void;
  onClose: DispatchWithoutAction;
  projectName?: string;
  action: Action;
}

export function VariableFormDrawer(props: VariableFormDrawerProps) {
  const { variable, isOpen, onChange, onClose, projectName, action } = props;

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

  const handleChange = (definition: VariableDefinition) => {
    variable.spec = definition;
    variable.metadata.name = definition.spec.name;
    if (onChange) {
      onChange(variable);
    }
  };

  const initialTimeRange = useInitialTimeRange('1h');

  return (
    <Drawer isOpen={isOpen} onClose={onClose} data-testid="variable-editor">
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
                <VariableEditForm
                  initialVariableDefinition={variableDef}
                  onChange={handleChange}
                  onCancel={onClose}
                  action={action}
                />
              </TemplateVariableProvider>
            </TimeRangeProvider>
          </DatasourceStoreProvider>
        </PluginRegistry>
      </ErrorBoundary>
    </Drawer>
  );
}
