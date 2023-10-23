# API

This section will give you an insight on every resource supported by the Perses API. While it can give you some
explanations about the purpose of each resource, this documentation is mainly for users that would like to interact
directly with the API and manipulate the resources without using the UI.

On the different documentations, you will find the definition of each resource in the yaml format.
Brackets indicate that a parameter is optional.

Generic placeholders are defined as follows:

* `<boolean>`: a boolean that can take the values `true` or `false`
* `<duration>`: a duration matching the regular
  expression `((([0-9]+)y)?(([0-9]+)w)?(([0-9]+)d)?(([0-9]+)h)?(([0-9]+)m)?(([0-9]+)s)?(([0-9]+)ms)?|0)`,
  e.g. `1d`, `1h30m`, `5m`, `10s`
* `<filename>`: a valid path in the current working directory
* `<path>`: a valid URL path
* `<int>`: an integer value
* `<secret>`: a regular string that is a secret, such as a password
* `<string>`: a regular string

## Table of contents

1. [Project](./project.md)
2. [Dashboard](./dashboard.md)
   1. [Specification](./dashboard.md#dashboard-specification)
   2. [API definition](./dashboard.md#api-definition)
3. [Datasource](./datasource.md)
   1. [Choose a scope](./datasource.md#choose-a-scope)
   2. [Specification](./datasource.md#datasource-specification)
   3. [API definition](./datasource.md#api-definition)
4. [Secret](./secret.md)
   1. [Specification](./secret.md#secret-specification)
   2. [API definition](./secret.md#api-definition)
5. [User](./user.md)
   1. [Specification](./user.md#user-specification)
   2. [API definition](./user.md#api-definition)
6. [Variable](./variable.md)
   1. [Choose a scope](./variable.md#choose-a-scope)
   2. [Specification](./variable.md#variable-specification)
   3. [API definition](./variable.md#api-definition)
7. Plugin
   1. [Panel](./plugin/panel.md)
      1. [BarChart](./plugin/panel.md#barchart)
      2. [GaugeChart](./plugin/panel.md#gaugechart)
      3. [Markdown](./plugin/panel.md#markdown)
      4. [StatChart](./plugin/panel.md#statchart)
      5. [TimeSeriesChart](./plugin/panel.md#timeserieschart)
   2. [Prometheus](./plugin/prometheus.md)
      1. [Datasource](./plugin/prometheus.md#datasource)
      2. [Query](./plugin/prometheus.md#query)
      3. [Variable](./plugin/prometheus.md#variable)
