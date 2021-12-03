// Copyright 2021 The Perses Authors
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

import { usePluginRuntime } from '../context/PluginRuntimeContext';
import { AnyDatasourceSpecDefinition, DatasourceSpecDefinition, GlobalDatasourceModel } from '../model/datasource';
import { DatasourceSelector } from '../model/dashboard';

export function useDataSources(selector: DatasourceSelector): GlobalDatasourceModel[] {
  return usePluginRuntime('useDataSources')(selector);
}

export function useDataSourceConfig<T extends DatasourceSpecDefinition>(
  selector: DatasourceSelector,
  validate: (value: AnyDatasourceSpecDefinition) => value is T
): T {
  const datasources = useDataSources(selector);

  if (datasources.length !== 1 || datasources[0] === undefined) {
    throw new Error(`Could not find Datasource for selector ${selector}`);
  }

  if (validate(datasources[0].spec)) {
    return datasources[0].spec;
  }

  throw new Error(`Datasource spec for selector ${selector} is not valid`);
}
