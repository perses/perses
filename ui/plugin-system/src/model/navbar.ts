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

import { UnknownSpec } from '@perses-dev/core';
import { Plugin } from './plugin-base';

/**
 * Plugin for handling custom extensions in the top navigation bar like a new icon button.
 * It can also be used to place some fixed component on the screen like a chatbot, why not?
 */
export interface NavBarPlugin<Spec = UnknownSpec> extends Plugin<Spec> {
  Component: React.ComponentType;
}