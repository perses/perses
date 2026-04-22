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

export interface TransformCommonSpec {
  disabled?: boolean;
}

export interface JoinByColumnValueTransform {
  kind: 'JoinByColumnValue';
  spec: TransformCommonSpec & {
    columns: string[];
  };
}

export interface MergeColumnsTransform {
  kind: 'MergeColumns';
  spec: TransformCommonSpec & {
    columns: string[];
    name: string;
  };
}

export interface MergeIndexedColumnsTransform {
  kind: 'MergeIndexedColumns';
  spec: TransformCommonSpec & {
    column: string;
  };
}

export interface MergeSeriesTransform {
  kind: 'MergeSeries';
  spec: TransformCommonSpec;
}

export type Transform =
  | JoinByColumnValueTransform
  | MergeColumnsTransform
  | MergeIndexedColumnsTransform
  | MergeSeriesTransform;

// Can be moved somewhere else
export const TRANSFORM_TEXT = {
  JoinByColumnValue: 'Join by column value',
  MergeColumns: 'Merge columns',
  MergeIndexedColumns: 'Merge indexed columns',
  MergeSeries: 'Merge series',
};
