# Perses Upgrade Guide

This document provides instructions for upgrading Perses specially when dealing with breaking changes. As Perses is a
rapidly evolving project, it's important to keep your installation up to date to benefit from the latest features and
improvements.

Then, upgrading Perses is also depending on your usage as Perses can be used in different ways (e.g. as a standalone
application, as a library, etc.). Therefore, the upgrade process may vary based on your specific use case.

## Perses application

### Upgrading from v0.52.0 to v0.53.0

#### User change in container image

In order to simplify the build of the docker image, we have changed the default user used in the container from `nobody`
to `nonroot`. As a based image we are using now `gcr.io/distroless/static-debian12:non-root` instead of
`ggcr.io/distroless/static-debian12:latest`, which gives us a non-root user by default.

This change can impact users that is using as a database the file system inside the container, specially when running
the container with docker (not within Kubernetes). In that case, you should ensure that the `nonroot` user has the right
permissions to read and write into the database folder. If this is not the case, when upgrading the image, you will face
permission errors when Perses is trying to load the data coming from the file system.

You should not be impacted if you have overridden the user used in the container or if you are using a SQL database to
store the Perses data.²

#### TLS config changes

We are introducing a breaking change in the TLS configuration to have a consistent syntax to define TLS settings across
all data-sources specifications and across all backend sub configurations.

The previous version was mixing two syntaxes to set TLS across the various possible configuration that could lead to
confusion (camelCase and snake_case).
This breaking change is impacting only the SQL database configuration.

In the SQL configuration, if the tls_config is used, then you should change your config like that:

```txt
ca_file -> caFile
cert_file -> certFile
key_file -> keyFile
server_name -> serverName
insecure_skip_verify -> insecureSkipVerify
min_version -> minVersion
max_version -> maxVersion
```

## Plugin developer

### Upgrading from v0.52.0 to v0.53.0

#### Change in "Run Query" behavior in `MultiQueryEditor`

`MultiQueryEditor` component has a new mandatory method: `onQueryRun`. It will be called when the user click on the
button "Run Query". It's useful if you want to execute a query only when this button is clicked and not on every
`onChange` (previous Perses behavior). Now the `onChange` method is always called when something change in the editor.
On the Perses app, queries are only executed when the user click on the "Run Query" button, however changes are still
saved
if user save the dashboard without clicking on "Run Query". But embedded use-cases might want to execute queries on
every change,
so this new behavior allows both use-cases.

In parallel, the caching of queries has been greatly improved to avoid memory leaks on dashboard refresh. More info can
be found in related PR: [#3518](https://github.com/perses/perses/pull/3518)
And queries errors are now displayed at the query level (before it was only displayed at the panel level, could be hard
to know which queries are causing issues).

About the breaking change, your code should change from this:

```tsx
export function FooExplorer(): ReactElement {
    const {
        data: {queries = []},
        setData,
    } = useExplorerManagerContext<FooExplorerQueryParams>();

    return (
        <Stack gap={2} sx={{width: '100%'}}>
            <MultiQueryEditor
                queryTypes={['ProfileQuery']}
                queries={queries}
                onChange={(newQueries) => setData({queries: queryDefinitions})}
            />
            <FooPanel queries={queries}/>
        </Stack>
    );
}
```

to this:

```tsx
export function FooExplorer(): ReactElement {
    const {
        data: {queries = []},
        setData,
    } = useExplorerManagerContext<FooExplorerQueryParams>();

    const [queryDefinitions, setQueryDefinitions] = useState<QueryDefinition[]>(queries);

    return (
        <Stack gap={2} sx={{width: '100%'}}>
            <MultiQueryEditor
                queryTypes={['ProfileQuery']}
                queries={queryDefinitions}
                onChange={(newQueries) => setQueryDefinitions(newQueries)}
                onQueryRun={() => setData({queries: queryDefinitions})}
            />
            <FooPanel queries={queries}/>
        </Stack>
    );
}
```

#### Variable migration changes

We realized variable migration script could be simplified & better follow CUE's good practices by replacing condition
blocks by constraints defined on the variable object. However to enable this we had to introduce a breaking change*:
where previously such schema was describing the remapping of a Grafana variable object named `#var`, it is now called
`#grafanaVar`. Thus if you had defined a schema looking like this:

```cue
package migrate

import "strings"

#var: _ 

if #var.type == "custom" || #var.type == "interval" {
    kind: "MyVariable"
    spec: {
        values: strings.Split(#var.query, ",")
    }
}
```

..the minimum change you need to do is this renaming:

```cue
package migrate

import "strings"

#grafanaVar: _ 

if #grafanaVar.type == "custom" || #grafanaVar.type == "interval" {
    kind: "MyVariable"
    spec: {
        values: strings.Split(#grafanaVar.query, ",")
    }
}
```

Then it is recommended to refactor to something like this:

```cue
package migrate

import "strings"

#grafanaVar: {
    type: "custom" | "interval"
    query: string
    ...
}

kind: "MyVariable"
spec: {
    values: strings.Split(#grafanaVar.query, ",")
}
```

*We believe the trade‑off was worth introducing this breaking change, as we expect very few (if any) people to have
written such variable migration schemas outside of the Perses organization. However, if you are impacted, please reach
out to us! Learning more about our community helps us make better future decisions by having a clearer understanding of
potential impacts.

#### GO-SDK Change in the way to define a query plugin

In the previous version of the GO-SDK, a query plugin was defined by using the Query builder. The issue with this
approach is that it was not possible to provide the high level query type as it was hardcoded in the query builder.

This was not a problem for the Perses app as we only have one query type until recently. It changed with the
introduction of the new query types:  "ProfileQuery", "LogQuery" and "TraceQuery". To support this new use-case, we had
to introduce a breaking change in the way to define a query plugin.

Now, instead of using the Query builder, you need to fill a struct `query.Option` that contains the query plugin and the
high level query type.

If we take the Prometheus plugin as an example, the implementation will change from this:

```go
package query

import (
	"github.com/perses/perses/go-sdk/query"
)

func PromQL(expr string, options ...Option) query.Option {
	return func(builder *query.Builder) error {
		plugin, err := create(expr, options...)
		if err != nil {
			return err
		}

		builder.Spec.Plugin.Kind = PluginKind
		builder.Spec.Plugin.Spec = plugin
		return nil
	}
}

```

to this:

```go
package query

import (
	"github.com/perses/perses/go-sdk/query"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
)

func PromQL(expr string, options ...Option) query.Option {
	plg, err := create(expr, options...)
	return query.Option{
		Kind: plugin.KindTimeSeriesQuery,
		Plugin: common.Plugin{
			Kind: PluginKind,
			Spec: plg,
		},
		Error: err,
	}
}

```

#### Plugin Dev API change.

In this new version, we are introducing a plugin version and registry. As a side effect, the API
handling the load of the plugins in development has changed.

Therefore, you absolutely need to upgrade the CLI to the latest version to be able to load your plugin in development
mode.
