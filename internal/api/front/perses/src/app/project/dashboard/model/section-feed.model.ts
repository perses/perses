// Copyright 2021 Amadeus s.a.s
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

/*
 * These interfaces are used to map the section feeds information received from
 * the backend.
 */

export interface Serie {
  metric: Record<string, string>;
  values: [number, string][];
}

export interface Result {
  result: Serie[];
  err?: string;
}

export interface Panel {
  name: string;
  order: number;
  results: Result[];
}

export interface SectionFeedModel {
  name: string;
  order: number;
  panels: Panel[];
}
