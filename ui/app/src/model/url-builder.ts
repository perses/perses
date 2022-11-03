// Copyright 2022 The Perses Authors
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

const apiPrefix = '/api/v1';

export type URLParams = {
  resource: string;
  name?: string;
  project?: string;
  queryParams?: Record<string, string | boolean>;
};

function buildQueryParams(queryParams?: Record<string, string | boolean>): string | undefined {
  if (queryParams === undefined || Object.keys(queryParams).length === 0) {
    return undefined;
  }
  let result = '';
  let i = 0;
  const queryParamsKeys = Object.keys(queryParams);
  while (i < queryParamsKeys.length) {
    const k = queryParamsKeys[i];
    if (k === undefined) {
      continue;
    }
    const v = queryParams[k];
    if (v === undefined) {
      continue;
    }
    result = `${result}${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
    if (i < queryParamsKeys.length - 1) {
      result = `${result}&`;
    }
    i++;
  }
  return result;
}

export default function buildURL(params: URLParams): string {
  let url = apiPrefix;
  if (params.project !== undefined && params.project.length > 0) {
    url = `${url}/projects/${encodeURIComponent(params.project)}`;
  }
  url = `${url}/${params.resource}`;
  if (params.name !== undefined && params.name.length > 0) {
    url = `${url}/${encodeURIComponent(params.name)}`;
  }

  const queryParams = buildQueryParams(params.queryParams);
  if (queryParams !== undefined) {
    url = `${url}?${queryParams}`;
  }
  return url;
}
