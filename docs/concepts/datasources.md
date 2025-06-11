# Datasources

A **datasource** in Perses represents a connection configuration to an external system that provides observability data, such as metrics or traces. Datasources are there to allow retrieving data from different backends without hardcoding connection details everytime. They are thus reusable configuration objects that encapsulate how to query a specific data provider.

## Supported Backends

Perses currently supports several types of datasources, including:

- **Prometheus** – for time series metrics. Of course this also includes the Prometheus-compatible backends (e.g Thanos, Cortex..)
- **Tempo** – for distributed traces.

## Configuring a datasource

Datasources in Perses can be configured at different scopes. More details about that at [Datasource & Variable scopes](./datasource-and-variable-scopes.md).

## Related Documentation
- [Datasource API](../api/datasource.md)
- [Proxy](./proxy.md)
- [Datasource Discovery](../configuration/datasource-discovery.md)
