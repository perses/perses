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

import { Metadata, ProjectMetadata } from './resource';

export interface BasicAuth {
  username: string;
  password?: string;
  passwordFile?: string;
}

export interface Authorization {
  type?: string;
  credentials?: string;
  credentialsFile?: string;
}

export interface TLSConfig {
  ca?: string;
  cert?: string;
  key?: string;
  caFile?: string;
  certFile?: string;
  keyFile?: string;
  serverName?: string;
  insecureSkipVerify?: boolean;
}

export interface SecretSpec {
  basicAuth?: BasicAuth;
  authorization?: Authorization;
  tlsConfig?: TLSConfig;
}

/**
 * A secret that belongs to a project.
 */
export interface SecretResource {
  kind: 'Secret';
  metadata: ProjectMetadata;
  spec: SecretSpec;
}

/**
 * A global secret that doesn´t belong to a project.
 */
export interface GlobalSecretResource {
  kind: 'GlobalSecret';
  metadata: Metadata;
  spec: SecretSpec;
}

export type Secret = SecretResource | GlobalSecretResource;
