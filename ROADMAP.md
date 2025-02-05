# ROADMAP

## Plugin system

When this document was created (in March 2024), we mentioned that we were going to entirely review the plugin system.

Indeed, this has been reviewed but not yet released. We are very close to providing a first version.
We are still working on this as we are missing a few things, like documentation, the ability to use it in the explorer,
and basically cleaning the old system.

You can follow this issue to get updates on where we stand: https://github.com/perses/perses/issues/1543

### Plugin Versioning

In the second version of the new plugin system, we are going to tackle the topic of how plugins can be versioned and
upgraded.

Discussion is already ongoing on this topic: https://github.com/perses/perses/discussions/1186

### More data-sources to come

Once the new plugin system is released, we will unblock the possibility to support other data sources besides Prometheus
and Tempo.

1. We are going to support Logs Datasource, starting with OpenSearch and Loki.

2. We are currently discussing whether we should support ClickHouse in the core plugins or if we should let ClickHouse
   support Perses on their own side.
   Please follow [this issue](https://github.com/perses/perses/issues/1778)
   if you are interested in this topic or if you want to give your opinion.

3. We are also considering supporting Jaeger as a data source.
   This is still in the discussion phase. If you are interested, please let us know.

### More panels to come

We are willing to add more panels.
For the moment we are considering adding a panel to display native
histogram: https://github.com/perses/perses/issues/2601

## Marketplace

At some point, Perses will need a Marketplace to share which plugins, dashboards, and Dashboard as Code libraries are
available.

We haven't started working on it yet. Discussion is ongoing here: https://github.com/perses/perses/discussions/2439

## Alert view

We are considering creating an alert view in the Perses application. There is no current work in this area at the
moment. It will come once the above goals are finished.

If you would like to start working on that, no worries, probably opening a discussion to propose a design would be a
start.
