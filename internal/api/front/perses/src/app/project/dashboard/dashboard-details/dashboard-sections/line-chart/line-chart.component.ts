import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
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

type LocalOption = echarts.ComposeOption<LineSeriesOption | TooltipComponentOption | GridComponentOption | LegendComponentOption>;

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnInit, AfterViewInit {
  @ViewChild('container') containerRef?: ElementRef<HTMLDivElement>;

  @Input()
  showLegend = false;

  @Input()
  public set data(data: [Date, number][][] | undefined) {
    if (!data) {
      return
    }
    const lines: LineSeriesOption[] = []
    let i = 0;
    for (const series of data) {
      const echartSeries: LineSeriesOption = {
        name: String(i),
        type: 'line',
        symbol: 'none',
        data: series
      }
      i++
      lines.push(echartSeries)
    }
    this.option.series = lines
    this.localChart?.setOption(this.option);
  }

  private localChart?: echarts.ECharts;

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
      right: 0,
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

  constructor() {
  }

  ngOnInit(): void {
    echarts.use([LineChart, LegendComponent, TooltipComponent, GridComponent, DataZoomInsideComponent, CanvasRenderer]);
    if (!this.showLegend) {
      this.option.legend = undefined;
    }
  }

  ngAfterViewInit(): void {
    if (!this.containerRef) {
      throw new Error('expected echart container element to exist');
    }
    this.localChart = echarts.init(this.containerRef.nativeElement);
    this.localChart.setOption(this.option);
  }

}
