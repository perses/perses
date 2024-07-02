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

import { GlobalDatasourceResource } from '@perses-dev/core';
import buildURL from './url-builder';
import { buildDatasourceQueryParameters } from './datasource-client';
import { fetchJson } from './fetch';

const globalDatasourceResource = 'globaldatasources';

export function fetchGlobalDatasourceList(kind?: string, defaultDatasource?: boolean, name?: string) {
  const url = buildURL({
    resource: globalDatasourceResource,
    queryParams: buildDatasourceQueryParameters(kind, defaultDatasource, name),
  });
  return fetchJson<GlobalDatasourceResource[]>(url);
}
