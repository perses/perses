Loading plugins
======================

In Perses, each plugin must be provided as an archive file containing the plugin's frontend and backend parts.

- The backend part is only the Cuelang schema that will be used to validate the plugin data model when a dashboard is
  stored.
- The frontend parts are the React components that will be used to render the plugin in the dashboard. These files
  should be built using `rsbuild`.

Regarding the archive formats, Perses only supports the following ones:

- .zip
- .tar
- .tar.gz

## Archive structure

The archive must have the following structure:

```plaintext
.
├── package.json # The plugin package.json file that contains the name of the module and the list of the plugins contained
├── mf-stats.json
├── mf-manifest.json # The manifest file required for the frontend
├── static # The frontend files
│   ├── css
│   ├── js
├── schemas # The schema files if required (depending on the plugin)
│   ├── schema.cue # The Cuelang schema file
│   ├── migrate
│   │   ├── migrate.cue # The Cuelang schema file for the migration from the associated Grafana plugin to the Perses version
├── cue.mod
│   ├── module.cue
│   ├── pkg # Folder containing the Cuelang dependencies if any are used by the schemas
```

The CLI can help you to respect and verify this structure with the commands `percli plugin build` and
`percli plugin validate`.
Check the associated [documentation](../cli.md) for more details.

## Backend side

Before being able to use a plugin, it must be recognized and loaded by the Perses backend.

When the Perses backend is starting, it will look at a specific folder that should contain any plugin archive file. This
folder can be set using the following configuration:

```yaml
plugin:
  archive_path: /path/to/archive/folder
```

By default, the plugin archive folder is set to `plugins-archive` or to `/etc/perses/plugins-archive` if it's running in
a container.

Perses will extract every archive contained in this folder and will put the data into another folder. This folder can be
set using the following configuration:

```yaml
plugin:
  path: /path/to/plugin/folder
```

By default, the plugin folder is set to `plugins` or to `/etc/perses/plugins` if it's running in a container.

Finally, Perses will look at any folder contained in the plugin folder and will load in memory every schema contained.
It will also generate a file `plugin-module.json` at the root of the plugin folder.
This file contains the list of the plugins that can be used by the frontend.

This file is used to serve the HTTP endpoint `/api/v1/plugins`. The frontend calls this endpoint to get the list of the
plugins to be loaded.

## Frontend side

TODO
