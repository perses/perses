# LineChart

## Usage

To use the LineChart component, begin by importing as shown:

```tsx
import { LineChart } from "@perses-dev/components";
// data mapping and prop definition goes here
<LineChart height={height} data={graphData} unit={unit} legend={legendOverrides} grid={gridOverrides} />
```

For a full example of one way to map the query data to an [ECharts-compatible format](https://echarts.apache.org/en/option.html#series-line.type), **see [this CodeSandbox link](https://codesandbox.io/s/perses-line-chart-component-using-echarts-1tg92v?file=/src/App.js)** as well as [these lines in plugins/line-chart](https://github.com/perses/perses/blob/v0.4.1/ui/panels-plugin/src/plugins/line-chart/LineChartContainer.tsx#L64).

*Note: the [sandbox example](https://codesandbox.io/s/perses-line-chart-component-using-echarts-1tg92v?file=/src/App.js) uses JS, but see [types defined here](https://github.com/perses/perses/blob/main/ui/components/src/model/graph.ts) for additional context.*
