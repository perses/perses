# Prometheus

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
  [ proxy: <http_proxy_spec> ]
  
  [ scrapeInterval: <duration> ]
```

#### `<http_proxy_spec>`

```yaml
kind: "HTTPProxy"
spec:
  # URL is the url of datasource. It is not the url of the proxy.
  url: <url>

  # It is a tuple list of http methods and http endpoints that will be accessible.
  # Leave it empty if you don't want to restrict the access to the datasource.
  allowedEndpoints:
    - [ <allowedEndpoints_spec> ]

  # It can be used to provide additional headers that need to be forwarded when requesting the datasource
  headers:
    [ <string>: <string> ]
  # This is the name of the secret that should be used for the proxy or discovery configuration
  # It will contain any sensitive information such as password, token, certificate.
  # Please read the documentation about secrets to understand how to create one
  [ secret: <string> ]
```

##### `<allowedEndpoints_spec>`

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

## Variable

### PrometheusLabelNamesVariable

```yaml
kind: "PrometheusLabelNamesVariable"
spec: <prometheus_label_names_spec>
```

#### `<prometheus_label_names_spec>`

```yaml
  # If empty, then the default PrometheusDatasource is chosen
  # See the documentation about the datasources to understand how it is selected.
  [ datasource: <datasource_selector> ]
  matchers:
   [ - <string> ]
```

#### Example

A simple Prometheus LabelValues variable would be

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
spec: <prometheus_label_values_spec>
```

#### `<prometheus_label_values_spec>`

```yaml
  # If empty, then the default PrometheusDatasource is chosen
  # See the documentation about the datasources to understand how it is selected.
  [ datasource: <datasource_selector> ]
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
spec: <prometheus_promql_spec>
```
#### `<prometheus_promql_spec>`

```yaml
  # If empty, then the default PrometheusDatasource is chosen
  # See the documentation about the datasources to understand how it is selected.
  [ datasource: <datasource_selector> ]

  # The promql expression
  expr: <string>
  [ labelName: <string> ]
```

### `<datasource_selector>`

```yaml
  kind: "PrometheusDatasource"

  # The name of the datasource regardless its level
  [ name: <string> ]
```
