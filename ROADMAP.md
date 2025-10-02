# ROADMAP

## More data sources

Since the release v0.51 and its revamped plugin architecture, we have unblocked the possibility to support other data
sources. New plugins to handle Loki for logs & Pyroscope for profiles have been released in v0.52, and we are still
considering other technologies like Opensearch, Jaeger and Splunk.

Clickhouse plugin has been implemented by @appscode and will be available in the next release v0.53.

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
