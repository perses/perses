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

import * as echarts from 'echarts/core';
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { GaugeChart, GaugeSeriesOption } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

type LocalOption = echarts.ComposeOption<GaugeSeriesOption>;

@Component({
  selector: 'app-gauge-chart',
  templateUrl: './gauge-chart.component.html',
  styleUrls: ['./gauge-chart.component.scss']
})
export class GaugeChartComponent implements OnInit, AfterViewInit {
  @ViewChild('container') containerRef?: ElementRef<HTMLDivElement>;

  @Input()
  public set data(data: number) {
    const series = this.option.series as GaugeSeriesOption;
    if (series && series.data) {
      series.data[0] = data;
      this.localChart?.setOption(this.option);
    }
  }

  private localChart?: echarts.ECharts;

  private option: LocalOption = {
    series: {
      type: 'gauge',
      min: 0,
      max: 100,
      startAngle: 200,
      endAngle: -20,
      pointer: {
        show: true,
        itemStyle: {
          color: 'inherit'
        }
      },
      axisLine: {
        lineStyle: {
          color: [
            [0.6, '#11a304'],
            [0.9, '#F0B329'],
            [1, '#D30000']
          ],
          width: 8
        }
      },
      splitLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        show: false
      },
      anchor: {
        show: false
      },
      title: {
        show: false
      },
      detail: {
        formatter: '{value} %',
        fontWeight: 'bolder',
        color: 'inherit',
        overflow: 'truncate',
      },
      data: [0]
    },
  };

  constructor() {
  }

  ngOnInit(): void {
    echarts.use([GaugeChart, CanvasRenderer]);
  }

  ngAfterViewInit(): void {
    if (!this.containerRef) {
      throw new Error('expected echart container element to exist');
    }
    this.localChart = echarts.init(this.containerRef.nativeElement);
    this.localChart.setOption(this.option);
  }

}
