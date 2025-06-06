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

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactNode } from 'react';
import { ContextOptions, getTestContextWrapper } from './utils';

/**
 * Test helper to render a React component with some common app-level providers, as well as the PluginRegistry
 * wrapped around it.
 */
export function renderWithContext(
  ui: ReactNode,
  renderOptions?: Omit<RenderOptions, 'queries'>,
  contextOptions?: ContextOptions
): RenderResult {
  const Wrapper = getTestContextWrapper(contextOptions);
  return render(<Wrapper>{ui}</Wrapper>, renderOptions);
}
