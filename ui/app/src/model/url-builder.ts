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

import { PERSES_APP_CONFIG } from '../config';

const apiUrl = '/api/v1';

export type URLParams = {
  resource: string;
  name?: string;
  project?: string;
  folder?: string;
  pathSuffix?: string[];
  queryParams?: URLSearchParams;
  apiPrefix?: string;
  owner?: string;
  apiURL?: string;
};

export default function buildURL(params: URLParams): string {
  const basePath = params.apiPrefix !== undefined ? params.apiPrefix : PERSES_APP_CONFIG.api_prefix;
  let url = params.apiURL === undefined ? apiUrl : params.apiURL;

  if (params.owner !== undefined && params.owner.length > 0) {
    url = `${url}/owners/${encodeURIComponent(params.owner)}`;
  }
  if (params.project !== undefined && params.project.length > 0) {
    url = `${url}/projects/${encodeURIComponent(params.project)}`;
  }
  if (params.folder !== undefined && params.folder.length > 0) {
    url = `${url}/folders/${encodeURIComponent(params.folder)}`;
  }

  url = `${url}/${params.resource}`;
  if (params.name !== undefined && params.name.length > 0) {
    url = `${url}/${encodeURIComponent(params.name)}`;
  }

  if (params.pathSuffix && params.pathSuffix.length > 0) {
    url = `${url}/${params.pathSuffix.join('/')}`;
  }

  if (params.queryParams !== undefined) {
    url = `${url}?${params.queryParams.toString()}`;
  }
  return basePath + url;
}
