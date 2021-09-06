// Copyright 2021 The Perses Authors
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

// TODO: Revisit whether something like danfo.js is appropriate to use here once
// they've finished their Typescript rewrite (https://danfo.jsdata.org/)
export interface DataFrame {
  name: string;
  columns: Series[];
}

type SeriesMap = {
  Date: UnixTimeMs;
  String: string;
  Number: number;
};

export type UnixTimeMs = number;

export type SeriesType = keyof SeriesMap;

export interface Series<T extends SeriesType = SeriesType> {
  seriesType: T;
  name: string;
  values: Array<SeriesMap[T]>;
}
