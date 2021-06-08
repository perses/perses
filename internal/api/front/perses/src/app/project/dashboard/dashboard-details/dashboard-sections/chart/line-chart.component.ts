import { Component, ElementRef, Input, NgZone } from '@angular/core';
import * as echarts from 'echarts/core';
import { LineChart, LineSeriesOption } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import {
  DataZoomInsideComponent,
  GridComponent,
  GridComponentOption,
  LegendComponent,
  LegendComponentOption,
  TooltipComponent,
  TooltipComponentOption
} from 'echarts/components';
import { BaseChartComponent } from './base-chart.component';

type LocalOption = echarts.ComposeOption<LineSeriesOption | TooltipComponentOption | GridComponentOption | LegendComponentOption>;

@Component({
  selector: 'app-line-chart',
  template: '',
})
export class LineChartComponent extends BaseChartComponent<LocalOption> {
  @Input()
  showLegend = false;

  @Input()
  public set data(data: Record<string, [Date, number][]> | undefined) {
    if (!data) {
      return
    }
    const lines: LineSeriesOption[] = []

    for (const [name, series] of Object.entries(data)) {
      const echartSeries: LineSeriesOption = {
        name: name,
        type: 'line',
        symbol: 'none',
        data: series
      }
      lines.push(echartSeries)
    }
    this.option.series = lines
    this.localChart?.setOption(this.option, true);
  }

  private option: LocalOption = {
    xAxis: {
      show: true,
      type: 'time',
    },
    yAxis: {
      type: 'value',
      show: true,
    },
    dataZoom: [{
      type: 'inside',
      throttle: 50,
    }],
    legend: {
      type: 'scroll',
      orient: 'vertical',
      height: '75%',
      right: 0,
      textStyle: {
        overflow: 'truncate'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
  }

  private echartsExtensions = [LineChart, LegendComponent, TooltipComponent, GridComponent, DataZoomInsideComponent, CanvasRenderer]

  constructor(el: ElementRef,
              ngZone: NgZone) {
    super(el, ngZone)
  }

  // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
  ngOnInit() {
    super.ngOnInit();
    if (!this.showLegend) {
      this.option.legend = undefined;
    }
  }

  getOption(): LocalOption {
    return this.option
  }

  getEchartsExtensions(): any[] {
    return this.echartsExtensions
  }
}
