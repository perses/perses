# ROADMAP

## More data sources

With the new plugin system now available, we have unblocked the possibility to support other data sources besides
Prometheus
and Tempo.

1. We are working on supporting Logs Datasource, starting with OpenSearch and Loki.

2. We are currently discussing whether we should support ClickHouse in the core plugins or if we should let ClickHouse
   support Perses on their own side.
   Please follow [this issue](https://github.com/perses/perses/issues/1778)
   if you are interested in this topic or if you want to give your opinion.

3. We are also considering supporting Jaeger as a data source.
   This is still in the discussion phase. If you are interested, please let us know.

## Marketplace

A plugin and dashboard marketplace is planned to facilitate community sharing of:

- Plugins
- Dashboards
- Dashboard-as-Code libraries

Development hasn't started yet. Join the discussion: https://github.com/perses/perses/discussions/2439

## Alert View

An integrated alert view is under consideration for future releases. This feature will be prioritized after completing
the current roadmap items.

Interested in contributing? Start by opening a discussion with your design proposal.

## Dropping support for React 17

We are planning to drop support for React 17 the 15th of July 2026. It will help us to keep our dependencies up to date
and to be able to use libraries that only support React 18 and above.
