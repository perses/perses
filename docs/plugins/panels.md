# Panel plugins

This documentation provides an exhaustive list of the panel plugins supported by Perses.

## BarChart

```yaml
kind: "BarChart"
spec:
  calculation: <Calculation specification>
  format: <Format specification> # Optional
  sort: <enum = "asc" | "desc"> # Optional
  mode: <enum = "value" | "percentage"> # Optional
```

## GaugeChart

```yaml
kind: "GaugeChart"
spec:
  calculation: <Calculation specification>
  format: <Format specification> # Optional
  thresholds: <Thresholds specification> # Optional
  max: <int> # Optional
```

## Markdown

```yaml
kind: "Markdown"
spec:
  text: <string>
```

## PieChart

```yaml
kind: "PieChart"
# TODO document the spec of PieChart
```

## StatChart

```yaml
kind: "StatChart"
spec:
  calculation: <Calculation specification>
  format: <Format specification> # Optional
  thresholds: <Thresholds specification> # Optional
  sparkline: <Sparkline specification> # Optional
  valueFontSize: <int> # Optional
```

### Sparkline specification

```yaml
color: <string> # Optional
width: <int> # Optional
```

## ScatterChart

```yaml
kind: "ScatterChart"
spec: # TODO document the spec of ScatterChart
```

## Table

```yaml
kind: "Table"
spec:
  density: <enum = "compact" | "standard" | "comfortable"> # Optional
  columnSettings: <Column Settings specification> # Optional
```

### Column Settings specification

```yaml
name:  <string>
header:  <string> # Optional
headerDescription:  <string> # Optional
cellDescription: <string> # Optional
align: <enum = "left" | "center" | "right"> # Optional
enableSorting: <boolean> # Optional
width: <number | "auto"> # Optional
hide: <boolean> # Optional
```

## TimeSeriesChart

```yaml
kind: "TimeSeriesChart"
spec:
  legend: <Legend specification> # Optional
  tooltip: <Tooltip specification> # Optional
  yAxis: <YAxis specification> # Optional
  thresholds: <Thresholds specification> # Optional
  visual: <Visual specification> # Optional
  querySettings:
  - <Query Settings specification> # Optional
```

### Legend specification

```yaml
position: <enum = "bottom" | "right">
mode: <enum = "list" | "table"> # Optional
size: <enum = "small" | "medium"> # Optional
values:
  - <calculation> # Optional
```

### Tooltip specification

```yaml
enablePinning: <boolean | default = false> # Optional
```

### YAxis specification

```yaml
show: <boolean> # Optional
label: <string> # Optional
format: <format_spec> # Optional
min: <int> # Optional
max: <int> # Optional
```

### Visual specification

```yaml
display: <enum = "line" | "bar"> # Optional
# Must be between 0.25 and 3
lineWidth: <int> # Optional
# Must be between 0 and 1
areaOpacity: <int> # Optional
showPoints: <enum = "auto" | "always"> # Optional
palette: <Palette specification> # Optional
# Must be between 0 and 6
pointRadius: <number> # Optional
stack: <enum = "all" | "percent"> # Optional
connectNulls: boolean | default = false # Optional
```

#### Palette specification

```yaml
mode: <enum = "auto" | "categorical">
```

### Query Settings specification

```yaml
# queryIndex is an unsigned integer that should match an existing index in the panel's `queries` array
queryIndex: <number>
# colorMode represents the coloring strategy to use
# - "fixed":        for any serie returned by the query, apply the colorValue defined
# - "fixed-single": if only one serie returned by the query, apply the colorValue defined, otherwise do nothing
colorMode: <enum = "fixed" | "fixed-single">
# colorValue is an hexadecimal color code
colorValue: <string>
```

## TimeSeriesTable

```yaml
kind: "TimeSeriesTable"
# TODO document the spec of TimeSeriesTable
```

## TraceTable

```yaml
kind: "TraceTable"
# TODO document the spec of TraceTable
```

## TracingGanttChart

```yaml
kind: "TracingGanttChart"
# TODO document the spec of TracingGanttChart
```

## Common definitions

### Calculation specification

It's an enum. Possible values are:

- `first`
- `last`
- `first-number`
- `last-number`
- `mean`
- `sum`
- `min`
- `max`

### Format specification

The format spec is one of the following:

#### Time format

```yaml
unit: <enum = "milliseconds" | "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years">
decimalPlaces: <int> # Optional
```

#### Percent format

```yaml
unit: <enum =  "percent" | "percent-decimal">
decimalPlaces: <int> # Optional
```

#### Decimal format

```yaml
unit: "decimal"
decimalPlaces: <int> # Optional
shortValues: <boolean> | default = false # Optional
```

#### Bytes format

```yaml
unit: "bytes"
decimalPlaces: <int> # Optional
shortValues: <boolean> | default = false # Optional
```

#### Throughput format

```yaml
unit: < enum = "counts/sec" | "events/sec" | "messages/sec" | "ops/sec" | "packets/sec" | "reads/sec" | "records/sec" | "requests/sec" | "rows/sec" | "writes/sec">
decimalPlaces: <int> # Optional
shortValues: <boolean> | default = false # Optional
```

### Thresholds specification

```yaml
mode: <enum = "percent" | "absolute"> # Optional
defaultColor: string # Optional
steps:
  - <Step specification> # Optional
```

#### Step specification

```yaml
value: <int>
color: <string> # Optional
name: <string> # Optional
```
