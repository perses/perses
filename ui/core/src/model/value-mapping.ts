// Copyright 2024 The Perses Authors
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

export type ValueMapping =
  | ValueMappingOptions
  | ValueMappingOptionsRange
  | ValueMappingOptionsRegex
  | ValueMappingOptionsMisc;

export interface ValueMappingOptions {
  kind: 'Value';
  spec: {
    value: string | number;
    result: MappedValue;
  };
}

export interface ValueMappingOptionsRange {
  kind: 'Range';
  spec: {
    from: number;
    to: number;
    result: MappedValue;
  };
}

export interface ValueMappingOptionsRegex {
  kind: 'Regex';
  spec: {
    pattern: string;
    result: MappedValue;
  };
}

export interface ValueMappingOptionsMisc {
  kind: 'Misc';
  spec: {
    value: 'empty' | 'null' | 'NaN' | 'true' | 'false';
    result: MappedValue;
  };
}

export interface MappedValue {
  value: number | string;
  color?: string;
}
