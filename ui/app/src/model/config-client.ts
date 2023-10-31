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

import { useMutation, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { DashboardSelector, fetchJson } from '@perses-dev/core';
import { useMemo } from 'react';
import { marked } from 'marked';
import * as DOMPurify from 'dompurify';
import { useSnackbar } from '@perses-dev/components';
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
}

export interface Database {
  file?: DatabaseFile;
  sql?: DatabaseSQL;
}

export interface ProvisioningConfig {
  interval: string;
  folders: string[];
}

export interface SecurityConfig {
  readonly: boolean;
  activate_permission: boolean;
  encryption_key?: string;
  encryption_key_file?: string;
}

export interface ConfigModel {
  security: SecurityConfig;
  database: Database;
  schemas: ConfigSchemasModel;
  important_dashboards: DashboardSelector[];
  information: string;
  provisioning?: ProvisioningConfig;
}

type ConfigOptions = Omit<UseQueryOptions<ConfigModel, Error>, 'queryKey' | 'queryFn'>;

export function useConfig(options?: ConfigOptions) {
  return useQuery<ConfigModel, Error>(
    [resource],
    () => {
      return fetchConfig();
    },
    options
  );
}

export function useGetConfigMutation() {
  return useMutation<ConfigModel, Error>({
    mutationKey: [resource],
    mutationFn: () => {
      return fetchConfig();
    },
  });
}

export function fetchConfig() {
  const url = buildURL({ resource: resource, apiPrefix: '/api' });
  return fetchJson<ConfigModel>(url);
}

export function useIsReadonly() {
  const { exceptionSnackbar } = useSnackbar();
  const { data, isLoading } = useConfig({ onError: exceptionSnackbar });
  if (isLoading || data === undefined) {
    return undefined;
  }
  return data.security.readonly;
}

export function useImportantDashboardSelectors() {
  const { exceptionSnackbar } = useSnackbar();
  const { data, isLoading } = useConfig({ onError: exceptionSnackbar });
  return { data: data?.important_dashboards || [], isLoading: isLoading };
}

export function useInformation() {
  const { exceptionSnackbar } = useSnackbar();
  const { data, isLoading } = useConfig({ onError: exceptionSnackbar });

  const html = useMemo(() => marked.parse(data?.information || '', { gfm: true }), [data?.information]);
  const sanitizedHTML = useMemo(() => DOMPurify.sanitize(html), [html]);

  return { data: sanitizedHTML, isLoading: isLoading };
}
