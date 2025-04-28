# Plugins

The Perses server provides an API endpoint to retrieve the list of plugins it currently supports.

## API definition

```bash
GET /api/v1/plugins
```

No query parameters.

The server response looks like the following:

```json
[
    {
        "kind": "PluginModule",
        "metadata": {
            "name": "TimeSeriesChart",
            "version": "0.5.0"
        },
        "spec": {
            "schemasPath": "schemas",
            "plugins": [
                {
                    "kind": "Panel",
                    "spec": {
                        "display": {
                            "name": "Time Series Chart"
                        },
                        "name": "TimeSeriesChart"
                    }
                }
            ]
        }
    },
    {
        "kind": "PluginModule",
        "metadata": {
            "name": "Prometheus",
            "version": "0.6.0"
        },
        "spec": {
            "schemasPath": "schemas",
            "plugins": [
                {
                    "kind": "Datasource",
                    "spec": {
                        "display": {
                            "name": "Prometheus Datasource"
                        },
                        "name": "PrometheusDatasource"
                    }
                },
                {
                    "kind": "TimeSeriesQuery",
                    "spec": {
                        "display": {
                            "name": "Prometheus Time Series Query"
                        },
                        "name": "PrometheusTimeSeriesQuery"
                    }
                },
                {
                    "kind": "Variable",
                    "spec": {
                        "display": {
                            "name": "Prometheus PromQL Variable"
                        },
                        "name": "PrometheusPromQLVariable"
                    }
                },
                {
                    "kind": "Explore",
                    "spec": {
                        "display": {
                            "name": "Prometheus Explorer"
                        },
                        "name": "PrometheusExplorer"
                    }
                }
            ]
        }
    },
    {
        "kind": "PluginModule",
        "metadata": {
            "name": "ScatterChart",
            "version": "0.5.0"
        },
        "spec": {
            "schemasPath": "schemas",
            "plugins": [
                {
                    "kind": "Panel",
                    "spec": {
                        "display": {
                            "name": "Scatter Chart"
                        },
                        "name": "ScatterChart"
                    }
                }
            ]
        }
    },
    {
        "kind": "PluginModule",
        "metadata": {
            "name": "Table",
            "version": "0.5.0"
        },
        "spec": {
            "schemasPath": "schemas",
            "plugins": [
                {
                    "kind": "Panel",
                    "spec": {
                        "display": {
                            "name": "Table"
                        },
                        "name": "Table"
                    }
                }
            ]
        }
    }
]
```
