# Datasource

A **datasource** in Perses represents a connection configuration to an external system that provides observability data, such as metrics or traces. Datasources are there to allow retrieving data from different backends without hardcoding connection details everytime. They are thus reusable configuration objects that encapsulate how to query a specific data provider.

## Supported backends

Perses currently supports several types of datasources, including:

- **Prometheus** – for time series metrics. Of course this also includes the Prometheus-compatible backends (e.g Thanos, Cortex..)
- **Tempo** – for distributed traces.

## Configuring a datasource

Datasources in Perses can be configured at different scopes, providing flexibility for reuse and organization. More details about scopes at [Datasource & Variable scopes](./datasource-and-variable-scopes.md).

Creating a datasource is usually done through the Perses UI, but you also have the option to rely on:

- [Provisioning](../configuration/provisioning.md) to have datasources directly available at startup – you should provision correct [Datasource resources](../api/datasource.md) in this case.
- [Datasource Discovery](../configuration/datasource-discovery.md)

A datasource can configured to be accessed directly, but you may want to get it [proxied](./proxy.md) through the Perses backend for security reasons.
