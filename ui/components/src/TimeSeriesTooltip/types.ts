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

import { ECharts as EChartsInstance } from 'echarts/core';
import { TimeSeriesMetadata } from '@perses-dev/core';

export interface NearbySeriesInfo {
  seriesIdx: number | null;
  datumIdx: number | null;
  seriesName: string;
  date: number;
  markerColor: string;
  x: number;
  y: number;
  formattedY: string;
  isClosestToCursor: boolean;
  isSelected: boolean;
  metadata?: TimeSeriesMetadata;
}

export type NearbySeriesArray = NearbySeriesInfo[];

export type Candidate = Omit<NearbySeriesInfo, 'isClosestToCursor' | 'seriesIdx' | 'datumIdx'> & {
  seriesIdx: number;
  datumIdx: number;
  visualY: number;
  distance: number;
  isSelected: boolean;
};

export type CalculateVisualYForSeriesParams = {
  rawY: number;
  stackId?: string;
  stackTotals: Map<string, number>;
};

export type CalculateBarBandwidthParams = {
  timestampCenterX: number;
  prevTimestamp: number | undefined;
  nextTimestamp: number | undefined;
  chart: EChartsInstance;
  defaultBandwidth?: number;
};

export type CalculateBarSegmentBoundsParams = {
  timestampCenterX: number;
  bandwidth: number;
  seriesIdx: number;
  barSeriesOrder: number[];
};

export type BarSegmentBounds = {
  segLeft: number;
  segRight: number;
};

export type CalculateBarYBoundsParams = {
  visualY: number;
  rawY: number;
  isStacked: boolean;
};

export type BarYBounds = {
  base: number;
  lower: number;
  upper: number;
};

/**
 * Parameters for isWithinPercentageRange function
 */
export type IsWithinPercentageRangeParams = {
  valueToCheck: number;
  baseValue: number;
  percentage: number;
};

/**
 * Parameters for getYBuffer function
 */
export type GetYBufferParams = {
  yInterval: number;
  totalSeries: number;
  showAllSeries?: boolean;
};
