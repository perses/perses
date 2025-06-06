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
<anyOf = Time format | Percent format | Decimal format | Bytes format | Throughput format>
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

## Legend specification

```yaml
position: <enum = "bottom" | "right">
mode: <enum = "list" | "table"> # Optional
size: <enum = "small" | "medium"> # Optional
```


## Legend-with-values specification

```yaml
<Legend specification>
values:
  - <Calculation specification> # Optional
```

## Mapping specification

```yaml
<anyOf = Value condition | Range condition | Regex condition | Misc condition>
```

### Value condition

```yaml
kind: "Value"
spec:
  value: <string>
  result: <Mapping result>
```

### Range condition

```yaml
kind: "Range"
spec:
  from?: <number>
  to?: <number>
  result: <Mapping result>
```

### Regex condition

```yaml
kind: "Regex"
spec:
  pattern: <string>
  result: <Mapping result>
```

### Misc condition

```yaml
kind: "Misc"
spec:
  value: <enum = "empty" | "null" | "NaN" | "true" | "false">
  result: <Mapping result>
```

### Mapping result

```yaml
value: <string>
color: <string> # Optional
```

## Proxy specification

### HTTP Proxy specification

```yaml
kind: "HTTPProxy"
spec:
  # URL is the url of datasource. It is not the url of the proxy.
  url: <url>

  # It is a tuple list of http methods and http endpoints that will be accessible.
  # Leave it empty if you don't want to restrict the access to the datasource.
  allowedEndpoints:
    - <Allowed Endpoints specification> # Optional

  # It can be used to provide additional headers that need to be forwarded when requesting the datasource
  headers:
    <string>: <string> # Optional

  # This is the name of the secret that should be used for the proxy or discovery configuration
  # It will contain any sensitive information such as password, token, certificate.
  # Please read the documentation about secrets to understand how to create one
  secret: <string> # Optional
```

#### Allowed Endpoints specification

```yaml
endpointPattern: <RegExp>
method: <enum | possibleValue = 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE'>
```

## Thresholds specification

```yaml
mode: <enum = "percent" | "absolute"> # Optional
defaultColor: <string> # Optional
steps:
  - <Step specification> # Optional
```

### Step specification

```yaml
value: <int>
color: <string> # Optional
name: <string> # Optional
```

## Transform specification

```yaml
<anyOf = Join-by-column-value transform | Merge-columns transform | Merge-indexed-columns transform | Merge-series transform>
```

### Join-by-column-value transform

```yaml
kind: "JoinByColumnValue"
spec:
  columns: [string]
  disabled?: bool
```

### Merge-columns transform

```yaml
kind: "MergeColumns"
spec:
  columns: [string]
  name: <string>
  disabled: bool # Optional
```

### Merge-indexed-columns transform

```yaml
kind: "MergeIndexedColumns"
spec:
  column: <string>
  disabled: bool # Optional
```

### Merge-series transform

```yaml
kind: "MergeSeries"
spec:
  disabled: bool # Optional
```

### Merge-series transform

```yaml
kind: "MergeSeries"
spec:
  disabled: bool # Optional
```
