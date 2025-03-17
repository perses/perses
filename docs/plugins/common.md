# Common definitions

Standard definitions that plugins can use.

## Calculation specification

Calculation is defined as:

```yaml
<enum = "first" | "last" | "first-number" | "last-number" | "mean" | "sum" | "min" | "max"> # "last" is the default
```

## Format specification

The format spec is defined as:

```yaml
<enum = <Time format> | <Percent format> | <Decimal format> | <Bytes format> | <Throughput format>>
```

### Time format

```yaml
unit: <enum = "milliseconds" | "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years">
decimalPlaces: <int> # Optional
```

### Percent format

```yaml
unit: <enum =  "percent" | "percent-decimal">
decimalPlaces: <int> # Optional
```

### Decimal format

```yaml
unit: "decimal"
decimalPlaces: <int> # Optional
shortValues: <boolean> | default = false # Optional
```

### Bytes format

```yaml
unit: "bytes"
decimalPlaces: <int> # Optional
shortValues: <boolean> | default = false # Optional
```

### Throughput format

```yaml
unit: < enum = "counts/sec" | "events/sec" | "messages/sec" | "ops/sec" | "packets/sec" | "reads/sec" | "records/sec" | "requests/sec" | "rows/sec" | "writes/sec">
decimalPlaces: <int> # Optional
shortValues: <boolean> | default = false # Optional
```

## Thresholds specification

```yaml
mode: <enum = "percent" | "absolute"> # Optional
defaultColor: string # Optional
steps:
  - <Step specification> # Optional
```

### Step specification

```yaml
value: <int>
color: <string> # Optional
name: <string> # Optional
```
