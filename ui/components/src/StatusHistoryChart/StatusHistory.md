# Status History Chart
It allows you to visualize the status of various metrics over time.

## Usage

```tsx
<StatusHistoryChart
    xAxisCategories={xAxisCategories}
    yAxisCategories={yAxisCategories}
    data={chartData}
    timeScale={timeScale}
    height={contentDimensions.height}
/>
```

## Example

Here is an example configuration for the custom Status History panel:

```tsx
const xAxisCategories = [1627849200000, 1627852800000, 1627856400000];
const yAxisCategories = ['Service A', 'Service B', 'Service C'];
const chartData = [
  [0, 0, 1],
  [0, 1, 2],
  [0, 2, 0],
];
const timeScale = {
  startMs: 1627849200000,
  endMs: 1627856400000,
  stepMs: 3600000,
};

<StatusHistoryChart
    xAxisCategories={xAxisCategories}
    yAxisCategories={yAxisCategories}
    data={chartData}
    timeScale={timeScale}
    height={400}
/>
```