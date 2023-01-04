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

import { DashboardResource } from '@perses-dev/core';
import { useContext } from 'react';
import { StoreApi } from 'zustand';
import { DashboardContext, DashboardStoreState } from '../context';
import testDashboard from './testDashboard';

/**
 * Helper to get a test dashboard resource.
 */
export function getTestDashboard(): DashboardResource {
  // TODO: Should we be cloning this to create a new object each time?
  return testDashboard;
}

/**
 * Test helper to create a "spy" component that will capture the DashboardProvider's store, allowing you to inspect
 * its state in tests. Be sure to render the DashboardProviderSpy component that's returned in the component test
 * underneath the DashboardProvider.
 */
export function createDashboardProviderSpy() {
  const store: { value?: StoreApi<DashboardStoreState> } = {};

  // Spy component just captures the store value so it can be inspected in tests
  function DashboardProviderSpy() {
    const ctx = useContext(DashboardContext);
    store.value = ctx;
    return null;
  }

  return {
    DashboardProviderSpy,
    store,
  };
}
