# Perses CLI (percli)

Besides the Perses application, we also provide a CLI named `percli`. This tool can be used to interact with the backend REST
API to manage resources such as dashboards, datasources, projects, etc.

The CLI is available in the archives created at each [release](https://github.com/perses/perses/releases), as well as in the [docker images](https://hub.docker.com/r/persesdev/perses/tags).

## Tips

This CLI provides its own documentation using the --help option. This is the main source of truth for documentation,
while this page is here to provide some examples of how to use the main commands, tips & tricks, etc.

Example:

```bash
$ percli --help

Command line interface to interact with the Perses API

Usage:
  percli [command]

Available Commands:
  apply       Create or update resources through a file. JSON or YAML format supported
  completion  Generate the autocompletion script for the specified shell
  config      display local or remote config
  dac         Commands related to Dashboard-as-Code
  delete      Delete resources
  describe    Show details of a specific resource
  get         Retrieve any kind of resource from the API.
  help        Help about any command
  lint        Static check of the resources
  login       Log in to the Perses API
  migrate     migrate a Grafana dashboard to the Perses format
  plugin      Commands related to plugins development
  project     Select the project used by default.
  refresh     refresh the access token when it expires
  version     Display client version.
  whoami      Display current user used

Flags:
  -h, --help                  help for percli
      --log.level string      Set the log verbosity level. Possible values: panic, fatal, error, warning, info, debug, trace (default "info")
      --percliconfig string   Path to the percliconfig file to use for CLI requests. (default "/Users/ahusson/.perses/config.json")

Use "percli [command] --help" for more information about a command.
```

## Getting started

### Login

Multiple commands require a connection to the Perses API. The first thing you should do is then to use the `login`
command.

The only parameter required to use this command is the URL to the API.

```bash
$ percli login https://demo.perses.dev
```

If the server requires an authentication, you will have to provide either:

- a token: `--token` can be used to set a Bearer JWT token.
- a user + password: `--username` and `--password` can be used to set a username & password. The command will contact the Perses server
  with the credential(s). It will return a Bearer JWT token which expires after 1h.
- delegated auth information: if the server relies on an external OIDC/OAuth provider for authentication, use `--client-id` and `--client-secret` to pass the client credentials, plus `--provider` to pass the identifier of the external provider (e.g `google`, `azure`..).

The URL and the token will be stored in JSON file that is by default `<UserHome>/.perses/config.json`.

Note: you can change the location of this file using the global flag `--percliconfig`.

### Project

Most of the data belong to a project. You can see a project as a workspace where you will be able to create some
dashboards or datasources.

#### Get the list of your projects

To know what are the existing projects, you can use the following command:

```bash
$ percli get project

        NAME        |   AGE
--------------------+----------
  IncredibleProject | 106751d
  perses            | 106751d
```

#### Select the project

The project to be used by default when running commands can be set with:

```bash
$ percli project perses

project perses selected
```

## Resource Management Commands

### Apply data

To create or update any data in the Perses API, you can use the `apply` command. This command can receive the data to
create/update from a file or from stdin.

for example, you can proceed like that to create a project:

```bash
project='{
  "kind": "Project",
  "metadata": {
    "name": "MyProject"
  }
}'
echo ${project} | percli apply -f -

object "Project" "MyProject" has been applied
```

### Get data

To retrieve the data, you can use the `get` command :

```bash
$ percli get project

        NAME        |   AGE
--------------------+----------
  IncredibleProject | 106751d
  MyProject         | 58s
  perses            | 106751d
```

```bash
$ percli get dashboard

    NAME    | PROJECT | AGE
------------+---------+------
  Benchmark | perses  | 3d
  Demo      | perses  | 9d
```

**Note**: This command can be used with the --output flag to get the list either in JSON or YAML format. This
option can be used to export the resources into a file to mass update them.

### Describe data

The `describe` command allows you to print the complete definition of an object. By default, the definition will be
printed with the YAML format, but you can print it using the JSON format too.

```bash
$ percli describe dts PrometheusDemo

kind: Datasource
metadata:
  name: PrometheusDemo
  createdAt: 0001-01-01T00:00:00Z
  updatedAt: 0001-01-01T00:00:00Z
  project: perses
spec:
  default: false
  plugin:
    kind: PrometheusDatasource
    spec:
      proxy:
        kind: HTTPProxy
        spec:
          allowedEndpoints:
          - endpointPattern: /api/v1/labels
            method: POST
          - endpointPattern: /api/v1/series
            method: POST
          - endpointPattern: /api/v1/metadata
            method: GET
          - endpointPattern: /api/v1/query
            method: POST
          - endpointPattern: /api/v1/query_range
            method: POST
          - endpointPattern: /api/v1/label/([a-zA-Z0-9_-]+)/values
            method: GET
          url: https://prometheus.demo.do.prometheus.io
```

Or in JSON:

```bash
$ percli describe dts PrometheusDemo -ojson | jq

{
  "kind": "Datasource",
  "metadata": {
    "name": "PrometheusDemo",
    "createdAt": "0001-01-01T00:00:00Z",
    "updatedAt": "0001-01-01T00:00:00Z",
    "project": "perses"
  },
  "spec": {
    "default": false,
    "plugin": {
      "kind": "PrometheusDatasource",
      "spec": {
        "proxy": {
          "kind": "HTTPProxy",
          "spec": {
            "allowedEndpoints": [
              {
                "endpointPattern": "/api/v1/labels",
                "method": "POST"
              },
              {
                "endpointPattern": "/api/v1/series",
                "method": "POST"
              },
              {
                "endpointPattern": "/api/v1/metadata",
                "method": "GET"
              },
              {
                "endpointPattern": "/api/v1/query",
                "method": "POST"
              },
              {
                "endpointPattern": "/api/v1/query_range",
                "method": "POST"
              },
              {
                "endpointPattern": "/api/v1/label/([a-zA-Z0-9_-]+)/values",
                "method": "GET"
              }
            ],
            "url": "https://prometheus.demo.do.prometheus.io"
          }
        }
      }
    }
  }
}
```

### Delete data

To remove a resource, you can use the `delete` command :

```bash
$ percli delete dashboard Demo

Dashboard Demo has been deleted
```

## Advanced Commands

### Linter

The CLI provides a command `lint` that is able to validate any data supported by Perses.

Note that it doesn't necessary mean you won't face any issues when applying them.

```bash
$ percli lint -f ./resource.json
```

By default, the command doesn't require any remote server. We are providing a flag `--online` that will tell the CLI to
use a remote Perses server for additional validation. For example, when it has to validate a dashboard, it will
use the endpoint `/api/validate/dashboards`. That can be useful if you want to be sure that your dashboard is compatible
with the server (because it will match the plugins known by the server instead of the local ones)

### Migrate from Grafana dashboard to Perses format

The command `migrate` is for the moment only used to translate a Grafana dashboard to the Perses format. This command
has two modes:

1. An online mode that requires an active connection to a remote Perses server that holds the translation logic.
2. An offline mode that requires three different folders:
   - charts folders
   - queries folders
   - variables folders

Each of the above folders should contain a file named `migrate.cue`, that holds the logic of the migration for each
plugin. For more information about these files, please read the documentation about [CUE in Perses](../plugins/cue.md).

In both modes, if the command runs successfully, it will return the dashboard in the Perses format.

For example:

```bash
$ percli migrate -f ./grafana_dashboard.json --online

kind: Dashboard
metadata:
  name: rYdddlPWk
  createdAt: 0001-01-01T00:00:00Z
  updatedAt: 0001-01-01T00:00:00Z
  project: ""
spec:
  display:
    name: Node Exporter Full
  duration: 1h
  variables:
  - kind: ListVariable
    spec:
      name: DS_PROMETHEUS
      display:
        name: datasource
        hidden: false
      allowAllValue: false
      allowMultiple: false
      plugin:
        kind: StaticListVariable
        spec:
          values:
          - grafana
          - migration
          - not
          - supported
  - kind: ListVariable
    spec:
      name: job
      display:
        name: Job
        hidden: false
      allowAllValue: false
      allowMultiple: false
      plugin:
        kind: PrometheusLabelValuesVariable
        spec:
          labelName: job
          matchers: []
[...]
```

### Dashboard-as-Code

The CLI also comes in handy when you want to create & manage dashboards as code. For this topic please refer to [DaC user guide](../user-guides/dashboard-as-code.md).
