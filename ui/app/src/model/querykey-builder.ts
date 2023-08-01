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

import { QueryKey } from '@tanstack/react-query';

export interface QueryKeyParams {
  resource: string;
  parent?: string;
  name?: string;
}

/**
 * The query key is designed to store a resource in the cache, to be reused or invalidated.
 * This function is used to build a query key for a resource, with the following format: [resource, parent?, name?].
 * Doing this, if we modify a resource from a resource, we'll use this queryKey for the cache: [resource, parent, name],
 * and it will invalidate cache for [resource, parent, name], [resource, parent] and [resource].
 * Ref: https://tanstack.com/query/v4/docs/react/guides/query-keys
 *
 * e.g:
 *   When you do PUT /api/v1/projects/myProject/variables/myVar, you build such a query key :
 *   [variables, myProject, myVar]
 *   and it will invalidate caches with keys
 *   - [variables, myProject, myVar]
 *   - [variables, myProject]
 *   - [variables]
 *
 * NB: We can do this because, in the backend, all resources that can be in a parent always have a parent
 *   => you cannot update a variable resource with PUT /api/v1/variables/myVar,
 *      so we cannot build a query key like this [variables, myVar]
 * @param params
 */
export function buildQueryKey(params: QueryKeyParams): QueryKey {
  const key = [params.resource];
  if (params.parent) {
    key.push(params.parent);
  }
  if (params.name) {
    key.push(params.name);
  }
  return key;
}

export default buildQueryKey;
