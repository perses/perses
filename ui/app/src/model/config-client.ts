// Copyright 2024 The Perses Authors
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

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { DashboardSelector, DurationString, fetchJson, Permission, StatusError } from '@perses-dev/core';
import buildURL from './url-builder';

const resource = 'config';

export interface ConfigSchemasModel {
  panels_path: string;
  queries_path: string;
  datasources_path: string;
  variables_path: string;
  interval: string;
}

export interface DatabaseFile {
  folder: string;
  extension: 'yaml' | 'json';
  case_sensitive: boolean;
}

export interface TLSConfig {
  ca?: string;
  ca_file?: string;
  cert?: string;
  cert_file?: string;
  key?: string;
  key_file?: string;
  server_name?: string;
  insecure_skip_verify: boolean;
  min_version: string;
  max_version: string;
}

export interface DatabaseSQL {
  tls_config?: TLSConfig;
  user?: string;
  password?: string;
  password_file?: string;
  net?: string;
  addr?: string;
  db_name?: string;
  collation?: string;
  max_allowed_packet?: number;
  server_pub_key?: string;
  timeout?: string;
  read_timeout?: string;
  write_timeout?: string;
  allow_all_files: boolean;
  allow_cleartext_passwords: boolean;
  allow_fallback_to_plaintext: boolean;
  allow_native_passwords: boolean;
  allow_old_passwords: boolean;
  check_conn_liveness: boolean;
  client_found_rows: boolean;
  columns_with_alias: boolean;
  interpolate_params: boolean;
  multi_statements: boolean;
  parse_time: boolean;
  reject_read_only: boolean;
  case_sensitive: boolean;
}

export interface Database {
  file?: DatabaseFile;
  sql?: DatabaseSQL;
}

export interface ProvisioningConfig {
  interval: string;
  folders: string[];
}

export interface AuthorizationConfig {
  check_latest_update_interval: Duration;
  guest_permissions: Permission[];
}

export interface OIDCProvider {
  slug_id: string;
  name: string;
  issuer: string;
  redirect_uri: string;
  scopes: string[];
  url_params: Record<string, string>;
}

export interface OauthProvider {
  slug_id: string;
  name: string;
  redirect_uri: string;
  scopes: string[];
  auth_url: string;
  token_url: string;
  logout_url: string;
  user_infos_url: string;
}

export interface AuthProviders {
  enable_native: boolean;
  oauth: OauthProvider[];
  oidc: OIDCProvider[];
}

export interface AuthenticationConfig {
  access_token_ttl: string;
  refresh_token_ttl: string;
  disable_sign_up: boolean;
  providers: AuthProviders;
}

export interface SecurityConfig {
  readonly: boolean;
  encryption_key?: string;
  encryption_key_file?: string;
  enable_auth: boolean;
  authorization: AuthorizationConfig;
  authentication: AuthenticationConfig;
}

export interface ExplorerConfig {
  enable: boolean;
}

export interface TimeRangeConfig {
  disable_custom: boolean;
  options: DurationString[];
}

export interface FrontendConfig {
  important_dashboards?: DashboardSelector[];
  information?: string;
  explorer: ExplorerConfig;
  time_range: TimeRangeConfig;
}

export interface EphemeralDashboardConfig {
  enable: boolean;
  cleanup_interval: string;
}

export interface GlobalVariableConfig {
  disable: boolean;
}

export interface ProjectVariableConfig {
  disable: boolean;
}

export interface VariableConfig {
  global: GlobalVariableConfig;
  project: ProjectVariableConfig;
  disable_local: boolean;
}

export interface GlobalDatasourceConfig {
  disable: boolean;
}

export interface ProjectDatasourceConfig {
  disable: boolean;
}

export interface DatasourceConfig {
  global: GlobalDatasourceConfig;
  project: ProjectDatasourceConfig;
  disable_local: boolean;
}

export interface ConfigModel {
  security: SecurityConfig;
  database: Database;
  schemas: ConfigSchemasModel;
  provisioning?: ProvisioningConfig;
  datasource: DatasourceConfig;
  variable: VariableConfig;
  ephemeral_dashboard: EphemeralDashboardConfig;
  frontend: FrontendConfig;
}

type ConfigOptions = Omit<UseQueryOptions<ConfigModel, StatusError>, 'queryKey' | 'queryFn'>;

export function useConfig(options?: ConfigOptions): UseQueryResult<ConfigModel, StatusError> {
  return useQuery<ConfigModel, StatusError>({
    queryKey: [resource],
    queryFn: () => {
      return fetchConfig();
    },
    ...options,
  });
}

export function fetchConfig(): Promise<ConfigModel> {
  const url = buildURL({ resource: resource, apiPrefix: '/api' });
  return fetchJson<ConfigModel>(url);
}
