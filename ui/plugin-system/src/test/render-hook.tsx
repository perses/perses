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

import { renderHook, RenderHookOptions, RenderHookResult } from '@testing-library/react';
import { ContextOptions, getTestContextWrapper } from './utils';

/**
 * Test helper to render a React hook with common app-level providers, including the PluginRegistry,
 * wrapped around it. Useful for testing hooks that rely on context such as QueryClientProvider or PluginRegistry.
 */
export function renderHookWithContext<TProps, TResult>(
  callback: (props: TProps) => TResult,
  contextOptions?: ContextOptions,
  renderHookOptions?: Omit<RenderHookOptions<TProps>, 'wrapper'>
): RenderHookResult<TResult, TProps> {
  const wrapper = getTestContextWrapper(contextOptions);
  return renderHook(callback, { wrapper, ...renderHookOptions });
}
