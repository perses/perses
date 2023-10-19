# Prometheus

This documentation is providing the definition of the different plugin related to Prometheus

## Datasource

```yaml
kind: "PrometheusDatasource"
spec: <prometheus_plugin_spec>
```

### Plugin Specification

Prometheus as a datasource is basically an HTTP server. So we need to define am HTTP config.

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
