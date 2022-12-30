Perses CLI (percli)
==================

On top of the application, we also provide a CLI named `percli`. This tool can be used to interact with the backend REST
API to manage the resources such as dashboard, datasource, project etc.

The CLI is available in the docker image or in the archive we created during each release.

## Tips

This CLI provides its own documentation using the --help option. This is the main source of truth for documentation,
while this page is here to provide some examples of how to use the main commands, tips & tricks etc.

Example:

```bash
$ percli --help

Command line interface to interact with the Perses API

Usage:
  percli [command]

Available Commands:
  apply       Create or update resources through a file. JSON or YAML format supported
  completion  Generate the autocompletion script for the specified shell
  delete      Delete resources
  describe    Show details of a specific resource
  get         Retrieve any kind of resource from the API.
  help        Help about any command
  lint        Static check of the resources
  login       Log in to the Perses API
  migrate     migrate a Grafana dashboard to the Perses format
  project     Select the project used by default.
  version     Display client version.

Flags:
  -h, --help                  help for percli
      --log.level string      Set the log verbosity level. Possible values: panic, fatal, error, warning, info, debug, trace (default "info")
      --percliconfig string   Path to the percliconfig file to use for CLI requests. (default "/Users/ahusson/.perses/config.json")

Use "percli [command] --help" for more information about a command.
```

## Getting started

### Login

Most of the command required a connexion to the Perses API. So the first thing you should do is to use the `login`
command.

The only parameter required to use this command is the URL to the API.

```bash
$ percli login https://perses.dev
```

The URL will be stored in JSON file that is by default `<UserHome>/.perses/config.json`.

Note: you can change the location of this file using the global flag `--percliconfig`.

### Project

Most of the data belong to a project. You can see a project as a workspace where you will be able to create some
dashboards or datasources.

#### Get the list of your projects

To know what are the existing project, you can use the following command:

```bash
$ percli get project

        NAME        |   AGE
--------------------+----------
  IncredibleProject | 106751d
  perses            | 106751d
```

#### Select the project

In order to select a project to be used as the default one when running commands, you can use the following command:

```bash
$ percli project perses

project perses selected
```

## Resource Management Commands

### Apply data

To create or update any data in the Perses API, you can use the `apply` command. This command can receive the data to
create/update from a file or from stdin.

for example if you want to create a project, you can proceed like that:

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

To retrieve the data you can use the `get` command :

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

**Note**: This command can be used with the --output flag in order to get the list either in Json or Yaml format. This
option can be used to export the resources into a file in order to mass update them.

### Describe data

The `describe` command allows you to print the complete definition of an object. By default, the definition will be
printed with the Yaml format, but you can print it using the Json format too.

```bash
$ percli describe dts PrometheusDemo

kind: Datasource
metadata:
  name: PrometheusDemo
  created_at: 0001-01-01T00:00:00Z
  updated_at: 0001-01-01T00:00:00Z
  project: perses
spec:
  default: false
  plugin:
    kind: PrometheusDatasource
    spec:
      proxy:
        kind: HTTPProxy
        spec:
          allowed_endpoints:
          - endpoint_pattern: /api/v1/labels
            method: POST
          - endpoint_pattern: /api/v1/series
            method: POST
          - endpoint_pattern: /api/v1/metadata
            method: GET
          - endpoint_pattern: /api/v1/query
            method: POST
          - endpoint_pattern: /api/v1/query_range
            method: POST
          - endpoint_pattern: /api/v1/label/([a-zA-Z0-9_-]+)/values
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
    "created_at": "0001-01-01T00:00:00Z",
    "updated_at": "0001-01-01T00:00:00Z",
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
            "allowed_endpoints": [
              {
                "endpoint_pattern": "/api/v1/labels",
                "method": "POST"
              },
              {
                "endpoint_pattern": "/api/v1/series",
                "method": "POST"
              },
              {
                "endpoint_pattern": "/api/v1/metadata",
                "method": "GET"
              },
              {
                "endpoint_pattern": "/api/v1/query",
                "method": "POST"
              },
              {
                "endpoint_pattern": "/api/v1/query_range",
                "method": "POST"
              },
              {
                "endpoint_pattern": "/api/v1/label/([a-zA-Z0-9_-]+)/values",
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
use a remote Perses server for additional validation. For example, when it will have to validate a dashboard, it will
use the endpoint `/api/validate/dashboards`. That can be useful if you want to be sure that your dashboard is compatible
with the server (because it will use the remote CUE schemas instead of the local one)

### Migrate from Grafana dashboard to Perses format

The command `migrate` is for the moment only use to translate a Grafana dashboard to the Perses format. This command
cannot be run offline. It requires an active connection to a remote Perses server that holds the translation logic.

If the command runs successfully, it will return the dashboard in the Perses format.

```bash
$ percli migrate -f ./grafana_dashboard.json

kind: Dashboard
metadata:
  name: rYdddlPWk
  created_at: 0001-01-01T00:00:00Z
  updated_at: 0001-01-01T00:00:00Z
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
      allow_all_value: false
      allow_multiple: false
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
      allow_all_value: false
      allow_multiple: false
      plugin:
        kind: PrometheusLabelValuesVariable
        spec:
          label_name: job
          matchers: []
[...]
```
