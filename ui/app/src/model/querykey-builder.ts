// Copyright The Perses Authors
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

import type { QueryKey } from '@tanstack/react-query';

export interface QueryKeyParams {
  resource: string;
  parent?: string;
  name?: string;
}

/**
 * The query key is designed to store a resource in the cache, to be reused or invalidated.
 * This function is used to build a query key for a resource, with the following format: [resource, parent?, name?].
 * Invalidating a query key invalidates every query whose key starts with it.
 * Ref: https://tanstack.com/query/v4/docs/framework/react/guides/query-invalidation#query-matching-with-invalidatequeries
 *
 * e.g:
 *   When you do PUT /api/v1/projects/myProject/variables/myVar, invalidating the query key [variables, myProject]
 *   invalidates the caches with keys
 *   - [variables, myProject]
 *   - [variables, myProject, myVar]
 *   but not [variables], the list of the variables of all the projects, which must be invalidated separately.
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
