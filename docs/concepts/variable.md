# Variable

A **variable** in Perses is a dynamic configuration element that allows you to create interactive and reusable dashboards. Variables act as parameters that can be modified by users to filter data, change query scopes, or customize dashboard views without editing the underlying dashboard configuration.

![variables](https://github.com/user-attachments/assets/62d5d94b-7ceb-4bfc-ad38-a577a724b419)

## Variable types

Perses supports several types of variables to meet different use cases:

- **Text Variable** – for static string values that can be constant or user-editable.
- **List Variable** – for dynamic dropdown selections, powered by [plugins](../plugins).

## Configuring variables

Variables are generally defined as part of a dashboard, but you also have the option to configure them at higher scopes for reusability. More details about scopes at [Datasource & Variable scopes](./datasource-and-variable-scopes.md).

## Using variables

Once defined, variables can be used in places like:
- **Query expressions** – reference variables using `$variableName` syntax.
- **Panel titles and descriptions** – for dynamic content based on current selections.
- **Other variables** – create cascading dropdowns where one variable filters another.
