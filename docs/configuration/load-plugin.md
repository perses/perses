How to load a plugin
====================
Before being able to use a plugin, it must be recognized and loaded by the Perses backend.

When the Perses backend is starting, it will look at a specific folder that should contain any plugin archive file. This
folder can be set using the following configuration:

```yaml
plugin:
  archive_path: /path/to/archive/folder
```

Note: to know how to build a plugin archive, please refer to
the [plugin creation documentation](../plugins/creation.md).

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

## Load plugin in development mode

While you are implementing a plugin, you probably would like to see it alive in Perses using the dev server of
`rsbuild`.

Perses is able to load a plugin served by the `rsbuild` dev server. To do so, you should use the CLI like this:

```bash
# Log in to the Perses backend
percli login http://localhost:8080
# Start the plugin in development mode
percli plugin start ./path/to/plugin
```

It will start the dev server of `rsbuild` and will also register the plugin in the Perses backend.

Refer to the help of the `percli plugin start` command to see all the options available.
