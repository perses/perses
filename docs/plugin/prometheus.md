# Prometheus Plugin

This documentation is providing the definition of the different plugin related to Prometheus

## Datasource

```yaml
kind: "PrometheusDatasource"
spec: <prometheus_plugin_spec>
```

### Plugin Specification

Prometheus as a datasource is basically an HTTP server. So we need to define an HTTP config.

```yaml
  # It is the url of the datasource.
  # Leave it empty if you don't want to access the datasource directly from the UI.
  # You should define a proxy if you want to access the datasource through the Perses' server.
  [ directUrl: <url> ]

  # It is the http configuration that will be used by the Perses' server to redirect to the datasource any query sent by the UI.
  [ proxy: <HTTP Proxy specification> ]
  
  [ scrapeInterval: <duration> ]
```

#### HTTP Proxy specification

```yaml
kind: "HTTPProxy"
spec:
  # URL is the url of datasource. It is not the url of the proxy.
  url: <url>

  # It is a tuple list of http methods and http endpoints that will be accessible.
  # Leave it empty if you don't want to restrict the access to the datasource.
  allowedEndpoints:
    - [ <Allowed Endpoints specification> ]

  # It can be used to provide additional headers that need to be forwarded when requesting the datasource
  headers:
    [ <string>: <string> ]
  # This is the name of the secret that should be used for the proxy or discovery configuration
  # It will contain any sensitive information such as password, token, certificate.
  # Please read the documentation about secrets to understand how to create one
  [ secret: <string> ]
```

##### Allowed Endpoints specification

```yaml
endpointPattern: <RegExp>
method: <enum | possibleValue = 'POST' | 'PUT' | 'PATCH' | 'GET' | 'DELETE'>
```

### Example

A simple Prometheus datasource would be

```yaml
kind: "Datasource"
metadata:
  name: "PrometheusDemo"
  project: "perses"
spec:
  default: true
  plugin:
    kind: "PrometheusDatasource"
    spec:
      directUrl: "https://prometheus.demo.do.prometheus.io"
```

A more complex one:

```yaml
kind: "Datasource"
metadata:
  name: "PrometheusDemo"
  project: "perses"
spec:
  default: true
  plugin:
    kind: "PrometheusDatasource"
    spec:
      proxy:
        kind: "HTTPProxy"
        spec:
          url: "https://prometheus.demo.do.prometheus.io"
          allowedEndpoints:
            - endpointPattern: "/api/v1/labels"
              method: "POST"
            - endpointPattern: "/api/v1/series"
              method: "POST"
            - endpointPattern: "/api/v1/metadata"
              method: "GET"
            - endpointPattern: "/api/v1/query"
              method: "POST"
            - endpointPattern: "/api/v1/query_range"
              method: "POST"
            - endpointPattern: "/api/v1/label/([a-zA-Z0-9_-]+)/values"
              method: "GET"
          secret: "prometheus_secret_config"
```

## Query

We are only supporting one kind of query for Prometheus: `PrometheusTimeSeriesQuery`. Others will come in the future.

```yaml
kind: "PrometheusTimeSeriesQuery"
spec: <Timeseries Query specification>
```

### Timeseries Query specification

```yaml
  #`query` is the promQL expression.
  query: <string>

  # `datasource` is a datasource selector. If not provided, the default PrometheusDatasource is used.
  # See the documentation about the datasources to understand how it is selected.
  [ datasource: <Datasource selector> ]
  [ seriesNameFormat: <string> ]

  # `minStep` is the minimum time interval you want between each data points.
  [ minStep: <duration> ]
  [ resolution: number ]
```

#### Example

A simple one:

```yaml
kind: "TimeSeriesQuery"
spec:
  plugin:
    kind: "PrometheusTimeSeriesQuery"
    spec:
      query: "rate(caddy_http_response_duration_seconds_sum[$interval])"
```

## Variable

### PrometheusLabelNamesVariable

```yaml
kind: "PrometheusLabelNamesVariable"
spec: <Prometheus Label Names specification>
```

#### Prometheus Label Names specification

```yaml
  # `datasource` is a datasource selector. If not provided, the default PrometheusDatasource is used.
  # See the documentation about the datasources to understand how it is selected.
  [ datasource: <datasource_selector> ]
  matchers:
   [ - <string> ]
```

#### Example

A simple Prometheus LabelNames variable would be

```yaml
kind: "Variable"
metadata:
  name: "labelNames"
  project: "perses"
spec:
  kind: "ListVariable"
  spec:
    plugin:
      kind: "PrometheusLabelNamesVariable"
```

A more complex one

```yaml
kind: "Variable"
metadata:
  name: "labelNames"
  project: "perses"
spec:
  kind: "ListVariable"
  spec:
    allowMultiple: false
    allowAllValue: false
    plugin:
      kind: "PrometheusLabelNamesVariable"
      spec:
        datasource:
          kind: "PrometheusDatasource"
          name: "PrometheusDemo"
        matchers:
          - "up"
```

### PrometheusLabelValuesVariable

```yaml
kind: "PrometheusLabelValuesVariable"
spec: <Prometheus Label Values specification>
```

#### Prometheus Label Values specification

```yaml
  # `datasource` is a datasource selector. If not provided, the default PrometheusDatasource is used.
  # See the documentation about the datasources to understand how it is selected.
  [ datasource: <Datasource selector> ]
  labelName: <string>
  matchers:
   [ - <string> ]
```

#### Example

A simple Prometheus LabelValues variable would be

```yaml
kind: "Variable"
metadata:
  name: "job"
  project: "perses"
spec:
  kind: "ListVariable"
  spec:
    allowMultiple: false
    allowAllValue: false
    plugin:
      kind: "PrometheusLabelValuesVariable"
      spec:
        labelName: "job"
```

A more complex one

```yaml
kind: "Variable"
metadata:
  name: "instance"
  project: "perses"
spec:
  kind: "ListVariable"
  spec:
    allowMultiple: false
    allowAllValue: false
    plugin:
      kind: "PrometheusLabelValuesVariable"
      spec:
        datasource:
          kind: "PrometheusDatasource"
          name: "PrometheusDemo"
        labelName: "instance"
        matchers:
        - "up{job=~\"$job\"}"
```

### PrometheusPromQLVariable

```yaml
kind: "PrometheusPromQLVariable"
spec: <Prometheus PromQL specification>
```

#### Prometheus PromQL specification

```yaml
  # `datasource` is a datasource selector. If not provided, the default PrometheusDatasource is used.
  # See the documentation about the datasources to understand how it is selected.
  [ datasource: <Datasource selector> ]

  # The promql expression
  expr: <string>
  [ labelName: <string> ]
```

### Datasource selector

```yaml
  kind: "PrometheusDatasource"

  # The name of the datasource regardless its level
  [ name: <string> ]
```
