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

import type {
  EChartsOption,
  BarSeriesOption,
  LineSeriesOption,
  GaugeSeriesOption,
  TitleComponentOption,
  ComposeOption,
  XAXisComponentOption,
  YAXisComponentOption,
} from 'echarts';

export interface PersesChartsTheme {
  echartsTheme: EChartsTheme;
  noDataOption: NoDataOption;
  sparkline: {
    width: number;
    color: string;
  };
  /**
   * Theming for the container that wraps a chart.
   */
  container: {
    /**
     * Padding in pixels.
     */
    padding: {
      default: number;
    };
  };
  thresholds: ThresholdColorPalette;
}

// https://github.com/apache/echarts/issues/12489#issuecomment-643185207
export interface EChartsTheme extends EChartsOption {
  bar?: BarSeriesOption;
  line?: LineSeriesOption;
  gauge?: GaugeSeriesOption;
}

export interface ThresholdColorPalette {
  defaultColor: string;
  palette: string[];
}

export type NoDataOption = ComposeOption<TitleComponentOption | XAXisComponentOption | YAXisComponentOption>;
