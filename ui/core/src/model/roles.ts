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
import { Kind } from './kind';

export type Action = 'create' | 'read' | 'update' | 'delete' | '*';
export type Scope = Kind | '*';

export interface Permission {
  actions: Action[];
  scopes: Scope[];
}

export interface RoleSpec {
  permissions: Permission[];
}

/**
 * A role that belongs to a project.
 */
export interface RoleResource {
  kind: 'Role';
  metadata: ProjectMetadata;
  spec: RoleSpec;
}

/**
 * A global role that doesn´t belong to a project.
 */
export interface GlobalRoleResource {
  kind: 'GlobalRole';
  metadata: Metadata;
  spec: RoleSpec;
}

export type Role = RoleResource | GlobalRoleResource;
