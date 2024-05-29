# Panel Plugin

This is the list of every panel plugin we are supporting.

## BarChart

```yaml
kind: "BarChart"
spec:
  calculation: <Calculation specification>
  [ format: <Format specification> ]
  [ sort: <enum = "asc" | "desc"> ]
  [ mode: <enum = "value" | "percentage"> ]
```

## GaugeChart

```yaml
kind: "GaugeChart"
spec:
  calculation: <Calculation specification>
  [ format: <Format specification> ]
  [ thresholds: <Thresholds specification> ]
  [ max: <int> ]
```

## Markdown

```yaml
kind: "Markdown"
spec:
  text: <string>
```

## StatChart

```yaml
kind: "StatChart"
spec:
  calculation: <Calculation specification>
  [ format: <Format specification> ]
  [ thresholds: <Thresholds specification> ]
  [ sparkline: <Sparkline specification> ]
  [ valueFontSize: <int> ]
```

### Sparkline specification

```yaml
[ color: <string> ]
[ width: <int> ]
```

## ScatterChart

```yaml
kind: "ScatterChart"
spec: # TODO document the spec of ScatterChart
```

## TimeSeriesChart

```yaml
kind: "TimeSeriesChart"
spec:
  [ legend: <Legend specification> ]
  [ tooltip: <Tooltip specification> ]
  [ yAxis: <YAxis specification> ]
  [ thresholds: <Thresholds specification> ]
  [ visual: <Visual specification> ]
```

### Legend specification

```yaml
position: <enum = "bottom" | "right">
[ mode: <enum = "list" | "table"> ]
[ size: <enum = "small" | "medium"> ]
values:
  - [ <calculation> ]
```

### Tooltip specification

```yaml
[ enablePinning: <boolean | default = false> ]
```

### YAxis specification

```yaml
[ show: <boolean> ]
[ label: <string> ]
[ format: <format_spec> ]
[ min: <int> ]
[ max: <int> ]
```

### Visual specification

```yaml
[ display: <enum = "line" | "bar"> ]
# Must be between 0.25 and 3
[ lineWidth: <int> ]
# Must be between 0 and 1
[ areaOpacity: <int> ]
[ showPoints: <enum = "auto" | "always"> ]
[ palette: <Palette specification> ]
# Must be between 0 and 6
[ pointRadius: <number> ]
[ stack: <enum = "all" | "percent"> ]
[ connectNulls: boolean | default = false ]
```

#### Palette specification

```yaml
mode: <enum = "auto" | "categorical">
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
[ decimalPlaces: <int> ]
```

#### Percent format

```yaml
unit: <enum =  "percent" | "percent-decimal">
[ decimalPlaces: <int> ]
```

#### Decimal format

```yaml
unit: "decimal"
[ decimalPlaces: <int> ]
[ shortValues: <boolean> | default = false ]
```

#### Bytes format

```yaml
unit: "bytes"
[ decimalPlaces: <int> ]
[ shortValues: <boolean> | default = false ]
```

#### Throughput format

```yaml
unit: < enum = "counts/sec" | "events/sec" | "messages/sec" | "ops/sec" | "packets/sec" | "reads/sec" | "records/sec" | "requests/sec" | "rows/sec" | "writes/sec">
[ decimalPlaces: <int> ]
[ shortValues: <boolean> | default = false ]
```

### Thresholds specification

```yaml
[ mode: <enum = "percent" | "absolute"> ]
[ defaultColor: string ]
steps:
  - [ <Step specification> ]
```

#### Step specification

```yaml
value: <int>
[ color: <string> ]
[ name: <string> ]
```
