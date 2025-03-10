Plugin structure
================

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
