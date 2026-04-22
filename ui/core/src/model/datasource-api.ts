// Copyright 2025 The Perses Authors
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

import { DatasourceResource, DatasourceSelector, GlobalDatasourceResource } from './datasource';

/**
 * Parameters for building a datasource proxy URL
 */
export interface BuildDatasourceProxyUrlParams {
  project?: string;
  dashboard?: string;
  name: string;
  owner?: string | undefined;
}

/**
 * Function type for building datasource proxy URLs
 */
export type BuildDatasourceProxyUrlFunc = (params: BuildDatasourceProxyUrlParams) => string;

/**
 * The external API contract for fetching datasource resources.
 * This defines the interface that must be implemented to provide
 * datasource functionality to the dashboard.
 */
export interface DatasourceApi {
  /**
   * Optional function to build proxy URLs for datasources
   */
  buildProxyUrl?: BuildDatasourceProxyUrlFunc;
  /**
   * Get a datasource resource for a specific project
   */
  getDatasource: (project: string, selector: DatasourceSelector) => Promise<DatasourceResource | undefined>;
  /**
   * Get a global datasource resource
   */
  getGlobalDatasource: (selector: DatasourceSelector) => Promise<GlobalDatasourceResource | undefined>;
  /**
   * List all datasources for a project, optionally filtered by plugin kind
   */
  listDatasources: (project: string, pluginKind?: string) => Promise<DatasourceResource[]>;
  /**
   * List all global datasources, optionally filtered by plugin kind
   */
  listGlobalDatasources: (pluginKind?: string) => Promise<GlobalDatasourceResource[]>;
}
