# Creating a Perses plugin

## Plugin types

Perses supports the following types of plugins:

- **Datasource**: A datasource plugin is a plugin that can be used to fetch data from an external source. It can be used to
  connect to a database, an API, or any other data source. Requires a schema to validate the data model.
- **Query**: A query plugin is a plugin that binds datasources and panels together. It can be used to create queries that can
  be used to fetch data from a datasource and render it in a panel. Requires a schema to validate the data model.
- **Panel**: A panel plugin is a plugin that can be used to render data in a specific way. It can be used to create charts,
  tables, or any other type of visualization.
- **Variable**: A variable plugin is a plugin that can be used to create variables that can be used in queries. It can be used to
  fill data into dropdowns or replace variables in queries. Requires a schema to validate the data model.
- **Explore**: An explore plugin is a plugin that can be used to create an explore view. It can be used to create a view that allows
  users to explore data in a specific way. It is a special type of panel plugin that is used in the explore view.

One or many plugins can be distributed as a single Plugin Module. This allows to group plugins that are related to each other
and can be used together. For example, the Prometheus plugin module has a datasource plugin, an explore plugin, a query plugin and various variables plugins.

## Architecture

Perses plugins are built using the following architecture:

- **Backend**: The backend is responsible for validating the plugin data model using Cuelang schemas. It is also responsible
  for migrating the data model from a Grafana plugin to the Perses version.
- **Frontend**: The frontend is responsible for rendering the plugin using React components. It is also responsible for
  communicating with the backend to fetch data and send queries. The frontend is built using `rsbuild` and is served using
  remote module federation.

## Plugin module structure

In Perses, a plugin module must be provided as an archive file containing the plugins frontend and backend parts.

- The backend part is only the [Cuelang schema](./cue.md) that will be used to validate the plugin data model when a dashboard is
  stored. Is also used to migrate the data model from a Grafana plugin to the Perses version.
- The frontend parts are the React components that will be used to render the plugin in the dashboard or fetch data. These files
  should be built using `rsbuild`.

Regarding the archive formats, Perses only supports the following ones:

- .zip
- .tar
- .tar.gz

### Archive structure

The archive must have the following structure:

```plaintext
.
├── package.json # The plugin package.json file that contains the name of the module and the list of the plugins contained
├── mf-stats.json
├── mf-manifest.json # The manifest file required for the frontend
├── __mf # The frontend files for loading the plugin using remote module federation
│   ├── css
│   ├── font
│   ├── js
├── lib # The frontend files for loading the plugin as an npm dependency
│   ├── cjs
├── schemas # The schema files if required (depending on the type of plugin, see #Plugin types)
│   ├── <plugin-a>
│   │   ├── <plugin-a>.cue # The Cuelang schema file
│   │   ├── <plugin-a>.json # A JSON example of the schema
│   │   ├── migrate
│   │   │   ├── migrate.cue # The Cuelang schema file for the migration from the associated Grafana plugin to the Perses version
│   ├── <plugin-b>
│   │   ├── ...
├── cue.mod
│   ├── module.cue
│   ├── pkg # Folder containing the Cuelang dependencies if any are used by the schemas, usually installed with the `percli plugin build` command
```

## Perses CLI plugin commands

Perses CLI (`percli`) has a plugin option that helps you create and manage your plugins with the following commands:

- `percli plugin generate --module.org=<plugin module org> --module.name=<plugin module name> --plugin.type=<plugin type> --plugin.name=<plugin name> [<plugin module directory>]`: Creates a new plugin module if does not exist and generates a plugin inside it. This command can be used several times to add more plugins to the same module. A single plugin can be generated at a time.
  - `--module.name`: The plugin module name, required only when the module does not exist, ignored otherwise.
  - `--module.org`: The organization name on which the plugin module will be created, useful for publising the plugin. This is required only when the module does not exist, ignored otherwise.
  - `--plugin.name`: The plugin name. A pascal case and kebab case variants will be generated inside the templates. If a plugin with the same name already exists, it will be overwritten.
  - `--plugin.type`: The plugin type can be one of
    `Datasource`, `TimeSeriesQuery`, `Variable`, `Panel`, or `Explore`.
  - `--plugin.display-name`: The more human name of the plugin to be used in the UI. If not provided, the plugin name will be used.
  - `[<plugin module directory>]`: The plugin module directory is optional and the current directory will be used if not provided.
- `percli plugin build`: Build the plugin module and create the archive file.

Check the [CLI documentation](../cli.md) for more details.

## Steps to create a plugin

1. Create a new plugin module and plugin using the `percli plugin generate` command. This will create a new folder with the required structure and files.
2. Optionally, add more plugins to the module using the `percli plugin generate` command. This will edit and add the necessary files, keeping the required plugin module structure.
3. Implement the plugin:
   - For a Datasource plugin:
     - Edit the datasource client to connect it to your datasource.
     - Edit the Cuelang schema file in the `schemas/datasources/<plugin-name>` folder. This file will be used to validate the plugin data model when a datasource is stored.
     - Edit the JSON example of the schema in the same folder.
     - If migration is required, create a `schemas/datasources/<plugin-name>/migrate` folder and add the migration Cuelang schema file.
   - For a Query plugin:
     - Edit the Cuelang schema file in the `schemas/queries/<plugin-name>` folder. This file will be used to validate the plugin data model when a dashboard is stored.
     - Edit the JSON example of the schema in the same folder.
     - If migration is required, create a `schemas/queries/<plugin-name>/migrate` folder and add the migration Cuelang schema file.
   - For a Variable plugin:
     - Edit the Cuelang schema file in the `schemas/variables/<plugin-name>` folder. This file will be used to validate the plugin data model when a variable is stored.
     - Edit the JSON example of the schema in the same folder.
     - If migration is required, create a `schemas/variables/<plugin-name>/migrate` folder and add the migration Cuelang schema file.
   - For a Panel plugin:
     - Implement your panel as a React component located in the `panels/<plugin-name>` folder.
   - For a Explore plugin:
     - Implement your explore panel as a React component located in the `explore/<plugin-name>` folder.
4. Test your plugin using the `percli plugin start` command. This will start a local server that will serve your plugin and allow you to test it in the Perses UI.
5. Build your plugin using the `percli plugin build` command. This will create an archive file containing your plugin ready for distribution.

## Types of integrations

There are two main types of integrations:

- **Install in a Perses server**: After creating a plugin you can install it in a Perses server, so its avaiable in the Perses UI. When running from Perses UI the plugin is loaded using module federation.
- **Embed in a React application**: You can also embed a plugin and parts of the Perses UI in your own React application. This is useful if you want to create a custom dashboard or application that uses Perses plugins. See the [Embedding documentation](../embedding-panels.md) for more details.

## Examples

See the [Examples repository](http://github.com/perses/plugin-examples) or the core [Perses plugins repository](http://github.com/perses/plugins)
