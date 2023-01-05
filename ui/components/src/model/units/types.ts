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

// Common types needed across individual unit groups and the overall combined
// units.

export const UNIT_GROUPS = ['Time', 'Percent', 'Decimal', 'Bytes'] as const;
export type UnitGroup = typeof UNIT_GROUPS[number];

/**
 * Configuration for rendering units that are part of a group.
 */
export type UnitGroupConfig = {
  /**
   * The label that is shown in the UI.
   */
  label: string;
  /**
   * When true, the unit group supports setting decimal places.
   */
  decimal_places?: boolean;
  /**
   * When true, the unit group supports enabling abbreviate.
   */
  abbreviate?: boolean;
};

/**
 * Configuration for rendering a specific unit.
 */
export type UnitConfig = {
  /**
   * The group the unit is part of. This will inform common rendering behavior.
   */
  group: UnitGroup;

  /**
   * When true, this unit will not be displayed in the unit selector. This is
   * useful for units that are shorthand variants of other units.
   */
  disableSelectorOption?: boolean;

  /**
   * The label that is shown in the UI.
   */
  label: string;
};
