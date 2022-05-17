# Perses Components

This [package](https://www.npmjs.com/package/@perses-dev/components) includes individual components used in the Perses app and plugins. These components are broken up in a way that allows embedding in separate applications outside of Perses. For more info about corresponding packages see the [general UI README here](https://github.com/perses/perses/blob/main/ui/README.md).

### LineChart example

To use the LineChart component, begin by importing as shown:

```typescript
import { LineChart } from "@perses-dev/components";
```

For a full example of one way to map the query data to an [ECharts-compatible format](https://echarts.apache.org/en/option.html#series-line.type), **see [this CodeSandbox link](https://codesandbox.io/s/perses-line-chart-component-using-echarts-1tg92v?file=/src/App.js)**.

*Note: this example uses JS, but see [types defined here](https://github.com/perses/perses/blob/main/ui/components/src/model/graph-model.ts) for additional context.*
