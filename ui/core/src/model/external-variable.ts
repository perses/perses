// Copyright 2025 The Perses Authors
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

import { VariableDefinition } from './variables';

/**
 * External variable definition that can be provided from an external source.
 * Multiple external variable definitions can be provided to a dashboard, and
 * the order of the sources is important as first one will take precedence on
 * the following ones, in case they have same names.
 */
export interface ExternalVariableDefinition {
  /**
   * Source identifier for this set of external variables
   */
  source: string;
  /**
   * Optional tooltip information for the external variables
   */
  tooltip?: {
    title?: string;
    description?: string;
  };
  /**
   * Optional link to edit these external variables
   */
  editLink?: string;
  /**
   * The variable definitions from this external source
   */
  definitions: VariableDefinition[];
}
