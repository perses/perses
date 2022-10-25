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

/**
 * The middleware applied to the DashboardStore (can be used as generic argument in StateCreator).
 */
export type Middleware = [['zustand/immer', never], ['zustand/devtools', never]];

declare global {
  // eslint-disable-next-line no-var
  var dashboardStoreId: number | undefined;
}

/**
 * Helper function to generate unique IDs for things in the dashboard store that don't have a "natural" ID.
 */
export function generateId() {
  if (globalThis.dashboardStoreId === undefined) {
    globalThis.dashboardStoreId = -1;
  }
  return globalThis.dashboardStoreId++;
}
