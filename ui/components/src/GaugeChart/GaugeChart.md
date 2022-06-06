# GaugeChart

## Usage

See below for an example of how to use the [ECharts gauge](https://echarts.apache.org/examples/en/index.html#chart-type-gauge) series type as a Perses React component.

Note: axisLine prop supports same options as [corresponding ECharts property here](https://echarts.apache.org/en/option.html#series-gauge.axisLine).

```tsx
<GaugeChart
  width={contentDimensions.width}
  height={contentDimensions.height}
  data={chartData}
  unit={unit}
  axisLine={axisLine}
/>
```
