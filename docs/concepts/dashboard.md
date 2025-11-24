# Dashboard

Dashboards are the central feature of Perses—the place where users spend most of their time exploring and understanding observability data. A dashboard brings together multiple visualizations on a single page, allowing you to monitor and investigate data from different sources without repeatedly typing queries. By saving these queries and their visual representations, dashboards make investigations faster and more consistent.

A dashboard can be created through the UI or managed [as-code](./dashboard-as-code.md) and it belongs to a [project](./project.md).

A dashboard relies on one or more [datasources](./datasource.md) to fetch its data. Datasources serve as the connection point between Perses and the observability backends.

A dashboard can include [variables](../concepts/variable.md), that allow users to interactively change the query scopes, filter data, or customize dashboard views without modifying the underlying dashboard configuration, making dashboards more flexible and reusable.

A dashboard's visual elements consist of a set of panels. Each panel displays specific data in the form of charts, tables, or other visualization types, allowing users to quickly interpret metrics, traces, logs or profiles. Panels are plugged to the datasources via their configured queries, which are written in the relevant datasource’s query language and specify the exact data to retrieve from this datasource. These queries can also make use of the configured variables to allow dynamic query scope for the end user.

The structured format of Perses dashboards is designed to provide an [open, standardized specification](./open-specification.md) that fosters interoperability across observability tools and serves as a solid foundation for managing dashboards as code.

Perses also supports [migration](../migration.md) from Grafana dashboards to its own data model, making it easy to onboard and reuse existing visualizations without starting from scratch.