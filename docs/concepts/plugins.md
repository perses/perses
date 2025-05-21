# Plugins

In Perses, the following object types are available as plugins:

- Panel
- Datasource
- Query
- Variable
- Explorer

The goal with this is to eventually empower users to seamlessly enhance Perses' native capabilities through custom
plugins, allowing them to:

- Add panel plugins for more diverse data visualization options.
- Add datasource plugins to access data from new types of sources.
- Add query plugins to retrieve data from supported sources in additional ways.
- Add variable plugins to build variables for supported sources in additional ways.
- Add explorer view to customize the explorer page.

While Panel plugins are relatively self-sufficient, a datasource plugin requires one or more corresponding query and/or
variable plugin to be actually usable, and vice versa.
For instance, the native support for Prometheus is essentially a comprehensive package that includes all three types of
plugins.

A plugin is made of two parts:

- The "backend" part, which is the CUE schema that defines the model for the plugin and is used by Perses' backend for
  validation. Please refer to [CUE in Perses](../plugins/cue.md) for more details.
- The "frontend" part, a.k.a. all the frontend code responsible for bringing the plugin to life in the Perses UI.

See [Plugin creation](../plugins/creation.md) for more details on how to generate and integrate a plugin.
