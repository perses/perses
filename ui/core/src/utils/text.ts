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

import { Resource } from '../model';

/**
 * If the resource has a display name, return the variable display name
 * Else, only return the resource metdata name
 */
export function getResourceDisplayName<T extends Resource>(resource: T): string {
  // Variables
  if (resource.spec.spec?.display?.name) {
    return resource.spec.spec.display.name;
  }

  // Other resources with display
  if (resource.spec.display?.name) {
    return resource.spec.display.name;
  }

  return resource.metadata.name;
}

/**
 * If the resource has a display name, return the resource display name with the resource name too
 * Else, only return the resource name
 */
export function getResourceExtendedDisplayName<T extends Resource>(resource: T): string {
  // Variables
  if (resource.spec.spec?.display?.name) {
    return `${resource.spec.spec.display.name} (ID: ${resource.metadata.name})`;
  }

  // Other resources with display
  if (resource.spec.display?.name) {
    return `${resource.spec.display.name} (ID: ${resource.metadata.name})`;
  }

  return resource.metadata.name;
}
