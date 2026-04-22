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

/// <reference types="@playwright/test" />

// Minimum implementation to get happo working with TS.
// https://github.com/happo/happo-playwright

declare module 'happo-playwright' {
  export function init(contextOrPage: ContextOrPage): Promise<void>;
  export function finish(): Promise<void>;
  export function screenshot(
    page: Page,
    handleOrLocator: HandleOrLocator,
    { component: string, variant: string }
  ): Promise<void>;
}
