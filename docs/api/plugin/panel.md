# Panel

This is the list of every panel plugin we are supporting.

## BarChart

```yaml
kind: "BarChart"
spec:
  calculation: <calculation_spec>
  [ format: <format_spec> ]
  [ sort: <enum = "asc" | "desc"> ]
  [ mode: <enum = "value" | "percentage"> ]
```

## GaugeChart

```yaml
kind: "GaugeChart"
spec:
  calculation: <calculation_spec>
  [ format: <format_spec> ]
  [ thresholds: <thresholds_spec> ]
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
  calculation: <calculation_spec>
  [ format: <format_spec> ]
  [ thresholds: <thresholds_spec> ]
  [ sparkline: <sparkline_spec> ]
  [ valueFontSize: <int> ]
```

### `<sparkline_spec>`

```yaml
  [ color: <string> ]
  [ width: <int> ]
```

## TimeSeriesChart

```yaml
kind: "TimeSeriesChart"
spec:
  [ legend: <legend_spec> ]
    [ tooltip: <tooltip_spec> ]
    [ yAxis: <yAxis_spec> ]
    [ thresholds: <thresholds_spec> ]
    [ visual: <visual_spec> ]
```

### `<legend_spec>`

```yaml
position: <enum = "bottom" | "right">
            [ mode: <enum = "list" | "table" ]
  [ size: <enum = "small" | "medium" ]
values:
  - [ <calculation> ]
```

### `<tooltip_spec>`

```yaml
[ enablePinning: <boolean | default = false> ]
```

### `<yAxis_spec>`

```yaml
  [ show: <boolean> ]
  [ label: <string> ]
  [ format: <format_spec> ]
  [ min: <int> ]
  [ max: <int> ]
```

### `<visual_spec>`

```yaml
  [ display: <enum = "line" | "bar"> ]
  # Must be between 0.25 and 3
  [ lineWidth: <int> ]
  # Must be between 0 and 1
  [ areaOpacity: <int> ]
  [ showPoints: <enum = "auto" | "always"> ]
  [ palette: <palette_spec> ]
  # Must be between 0 and 6
  [ pointRadius: <number> ]
  [ stack: <enum = "all" | "percent"> ]
  [ connectNulls: boolean | default = false ]
```

#### `<palette_spec>`

```yaml
  mode: <enum = "auto" | "categorical">
```

## Common definition

### `<calculation_spec>`

It's an enum. Possible values are:

- `first`
- `last`
- `first-number`
- `last-number`
- `mean`
- `sum`
- `min`
- `max`

### `<format_spec>`

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

### `<thresholds_spec>`

```yaml
  [ mode: <enum = "percent" | "absolute"> ]
  [ defaultColor: string ]
  steps:
    - [ <step_spec> ]
```

#### `<step_spec>`

```yaml
  value: <int>
  [ color: <string> ]
  [ name: <string> ]
```
