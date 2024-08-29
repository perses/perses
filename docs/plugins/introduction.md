# About plugins

In Perses, the following object types are available as plugins:
- Panel
- Datasource
- Query
- Variable

The objective with this is to eventually empower users to seamlessly enhance Perses' native capabilities through custom plugins, allowing them to:
- Add panel plugins for more diverse data visualization options. See [Panel plugins](./panels.md) for more details.
- Add datasource plugins to access data from new types of sources.
- Add query plugins to retrieve data from supported sources in additional ways.
- Add variable plugins to build variables for supported sources in additional ways.

While Panel plugins are relatively self-sufficient, a datasource plugin requires one or more corresponding query and/or variable plugin to be actually usable, and vice versa. For instance, the native support for Prometheus is essentially a comprehensive package that includes all three types of plugins. For more details, refer to [Prometheus-related plugins](./prometheus.md).

Also, any plugin is made of two parts:
- The "backend" part, which is the CUE schema that defines the model for the plugin and is used by Perses' backend for validation. Please refer to [CUE in Perses](./cue.md) for more details.
- The "frontend" part, a.k.a all the frontend code responsible of bringing the plugin to life in the Perses UI.
