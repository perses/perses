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

export interface Span {
  resource: Resource;
  spanId: string;
  parentSpanId?: string;
  spanName: string;
  startTimeUnixNano: number;
  endTimeUnixNano: number;
  attributes?: Attribute[];

  parent?: Span;
  children: Span[];
}

export interface Resource {
  serviceName: string;
  color: string;
  attributes: Attribute[];
}

export interface Attribute {
  key: string;
  value: AttributeValue;
}

export type AttributeValue =
  | { stringValue: string }
  | { intValue: string }
  | { boolValue: boolean }
  | { arrayValue: { values: AttributeValue[] } };

/**
 * Viewport contains the current zoom, i.e. which timeframe of the trace should be visible
 */
export interface Viewport {
  startTimeUnixNano: number;
  endTimeUnixNano: number;
}
