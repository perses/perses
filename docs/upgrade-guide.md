# Perses Upgrade Guide

This document provides instructions for upgrading Perses specially when dealing with breaking changes. As Perses is a
rapidly evolving project, it's important to keep your installation up to date to benefit from the latest features and
improvements.

Then, upgrading Perses is also depending on your usage as Perses can be used in different ways (e.g. as a standalone
application, as a library, etc.). Therefore, the upgrade process may vary based on your specific use case.

## Perses application

### Upgrading from v0.53.0 to v0.54.0

#### SQL Database default configuration changes

We have changed the behavior of the SQL database config regarding the default value of few fields. It has been done to follow the default behavior of the driver: https://github.com/go-sql-driver/mysql/blob/master/dsn.go#L97

If you do not use the SQL config, then this does not concern you. If you use the SQL config, here the fields that the default value have been changed:

```yaml
database:
  sql:
    allow_native_passwords: true # previously false
    check_conn_liveness: true    # previously false
```

We also have added more field to the configuration to give you more facilities to customize the database connection:

```yaml
database:
  sql:
    # Maximum amount of time a connection may be reused. Keep it shorter than the server's wait_timeout
    # to avoid reusing connections the server has already closed.
    conn_max_lifetime: <duration> | default = 3m # Optional

    # Maximum amount of time a connection may be idle before it is closed.
    conn_max_idle_time: <duration> | default = 1m # Optional

    # Maximum number of open connections to the database. A value <= 0 means unlimited.
    max_open_conns: <int> # Optional

    # Maximum number of connections in the idle connection pool. A value <= 0 keeps the Go default (2).
    max_idle_conns: <int> # Optional
```

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

### Upgrading from v0.53.0 to v0.54.0

#### Core package deprecated

We have deprecated the `core package` and accordingly moved all its types and functionalities into other packages including `spec`, `dashboards`, `components`, `plugin-system`, and `client`. We are planing to drop the `core package` completely in the subsequent release. Therefore, we kindly ask all contributors to avoid importing `core package` members, and instead use the relevant types from the mentioned packages. Furthermore, should your PRs already import `core` members, you should replace them with the relevant types from the mentioned packages. This also means that meanwhile we cease developing `core`, because as it has been already mentioned the subsequent release will drop core completely.

The dependencies from `core` had been used in all repositories and different packages including `perses/perses` (the Perses app), `perses/plugins`, and `perses/shared`. Please note that the `shared` is the host of the of the `components`, `plugin-system`, `dashboards`, and `client` packages. The `spec` as its name suggests exposes the specifications and had no dependency to `core`. However, some of the core members have been moved to `spec` already.

The following example shows the `Table` plugin and its dependencies at the moment

```json
    "@perses-dev/components": "^0.54.0-rc.1",
    "@perses-dev/spec": "^0.2.0-rc.0",
    "@perses-dev/plugin-system": "^0.54.0-rc.1",
    "@perses-dev/dashboards": "^0.54.0-rc.1"
```

For instance, if you take a look at the imported members in `table\src\components\TablePanel.tsx` you find many types that used to be imported from `core`. Now, after this change the core has been replaced accordingly.

```typeScript
/* For example FormatOptions used to reside in core package 
   But now it is taken from @perses-dev/components
   Take a look at ui\core\src\model\units\units.ts
   You will find FormatOptions
   Now it is coming from 
   components\src\model\units.ts
*/
import {
  FormatOptions,
  formatValue,
  Table,
  TableCellConfigs,
  TableColumnConfig,
  transformData,
  useSelection,
} from '@perses-dev/components';
```
You as the contributor need to make sure that no `core` dependency is used in your changes. If it has been used already, it should be simply replaced with its equivalent from the mentioned packages. This should be no challenge as most of the IDEs suggest substitutes. For example, in VSCODE, if you can remove the `core` dependency, the IDE will suggest the substitutes. Simply select the suggested import and it will be added to your file automatically.

##### Plugin migration example (v0.53.1 to v0.54.0)

Let's for example, take a closer look at **a** plugin and see how it was in `v0.53.1` and how it changed in `v0.54.0`. 
The example has been inspired by the actual Table Plugin from the plugin repo.

So here in `v0.53.1`, the following types have been imported from `@perses-dev/core`

- `CalculationsMap`
- `formatValue`
- `QueryDataType`
- `TimeSeriesData`
- `transformData` 

After migrating to `v0.54.0`, we need to replace them with the proper substitute from the relevant packages.

```typeScript
/* v0.53.1 */
import { Table, TableCellConfigs, TableColumnConfig, useSelection } from '@perses-dev/components';
/* @perses-dev/core */
import { CalculationsMap, formatValue, QueryDataType, TimeSeriesData, transformData } from '@perses-dev/core';
import { useSelectionItemActions } from '@perses-dev/dashboards';
import {
  ActionOptions,
  PanelData,
  PanelProps,
  replaceVariablesInString,
  useAllVariableValues,
  VariableStateMap,
} from '@perses-dev/plugin-system';
/* OTHER IMPORTED MEMBERS*/

export const APlugin = (): ReactElement => {
  /**
   * THE PLUGIN LOGIC
   */
  return <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>{/* THE PLUGIN STRUCTURE */}</Box>;
};

```
When moving to `v.0.54.0` **the plugin itself remains INTACT and you do NOT need to change anything**.
The only thing that you need to do 

- remove the core dependencies
- find the relevant substitutes for the removed imported members

So, in `v.0.54.0` **only the import section of the plugin has changed and the rest remain as it is**. **Why?** Because, the same type has been moved to a different package while the structure is intact. 

```typeScript
/* v0.54.0 */
import {
  formatValue,
  Table,
  TableCellConfigs,
  TableColumnConfig,
  transformData,
  useSelection,
} from '@perses-dev/components';
import { useSelectionItemActions } from '@perses-dev/dashboards';
import {
  ActionOptions,
  CalculationsMap,
  PanelData,
  PanelProps,
  replaceVariablesInString,
  useAllVariableValues,
  VariableStateMap,
} from '@perses-dev/plugin-system';
import { QueryDataType, TimeSeriesData } from '@perses-dev/spec';
/* OTHER IMPORTED MEMBERS*/

export const APlugin = (): ReactElement => {
  /**
   * THE PLUGIN LOGIC
   */
  return <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}>{/* THE PLUGIN STRUCTURE */}</Box>;
};
```

The following table, shows how in this example the imports have changed after moving to `v0.54.0` from `v.053.1`

| @perses-dev/core Types    | Types new package |
| -------- | ------- |
| CalculationsMap  | @perses-dev/plugin-system    |
| formatValue | @perses-dev/components     |
| transformData     | @perses-dev/components    |
| QueryDataType    | @perses-dev/spec    |
| TimeSeriesData    | @perses-dev/spec   |


If you already working on a change that has added new members to the `core`, you need to move them to the proper package accordingly. Where your new type should reside depends on its usage. Please note that if the new introduced member has only internal `Perses App` usage, it should reside in the `perses/perses`.

#### GO-SDK: Import path change

##### Query plugin definition

Since the definition of the dashboard and datasource has been moved to the repository `perses/spec`, few import path
needs to be updated.

If you are defining a query plugin, you probably have the following definition:

```go
package yourquery

import (
	"github.com/perses/perses/go-sdk/datasource"
	"github.com/perses/perses/go-sdk/query"
	"github.com/perses/perses/pkg/model/api/v1/plugin"
	"github.com/perses/perses/pkg/model/api/v1/common"
)

const PluginKind = "YourLogQuery"

type PluginSpec struct {
	Datasource *datasource.Selector `json:"datasource,omitempty" yaml:"datasource,omitempty"`
	Query      string               `json:"query" yaml:"query"`
}

type Option func(plugin *Builder) error

func create(query string, options ...Option) (Builder, error) {
	builder := &Builder{
		PluginSpec: PluginSpec{},
	}

	defaults := []Option{
		Query(query),
	}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

type Builder struct {
	PluginSpec `json:",inline" yaml:",inline"`
}

func YourLogQuery(expr string, options ...Option) query.Option {
	plg, err := create(expr, options...)
	return query.Option{
		Kind: plugin.KindLogQuery,
		Plugin: common.Plugin{
			Kind: PluginKind,
			Spec: plg,
		},
		Error: err,
	}
}
```

In this situation, you simply need to replace the import path of the `plugin` and `common` packages to
`"github.com/perses/spec/go/plugin"`:

```go
package yourquery

import (
	"github.com/perses/perses/go-sdk/datasource"
	"github.com/perses/perses/go-sdk/query"
	"github.com/perses/spec/go/plugin"
)

const PluginKind = "YourLogQuery"

type PluginSpec struct {
	Datasource *datasource.Selector `json:"datasource,omitempty" yaml:"datasource,omitempty"`
	Query      string               `json:"query" yaml:"query"`
}

type Option func(plugin *Builder) error

func create(query string, options ...Option) (Builder, error) {
	builder := &Builder{
		PluginSpec: PluginSpec{},
	}

	defaults := []Option{
		Query(query),
	}

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

type Builder struct {
	PluginSpec `json:",inline" yaml:",inline"`
}

func YourLogQuery(expr string, options ...Option) query.Option {
	plg, err := create(expr, options...)
	return query.Option{
		Kind: plugin.KindLogQuery,
		Plugin: plugin.Plugin{
			Kind: PluginKind,
			Spec: plg,
		},
		Error: err,
	}
}
```

Note that if you are using more things than `plugin` in the `github.com/perses/perses/pkg/model/api/v1/common` package,
you should also update the import path to `"github.com/perses/spec/go/common"`.

##### Datasource plugin definition

There are two possibilities:

1. If you are defining an HTTP datasource plugin with the simple struct:

```go
package yourdatasource

import "github.com/perses/perses/pkg/model/api/v1/datasource/http"

type PluginSpec struct {
	DirectURL string      `json:"directUrl,omitempty" yaml:"directUrl,omitempty"`
	Proxy     *http.Proxy `json:"proxy,omitempty" yaml:"proxy,omitempty"`
}
```

In this case, we have provided a new struct `datasource.HTTPDatasourceSpec` from the package
`github.com/perses/spec/go/datasource` that can be used instead of defining it manually. You can simply removed your
struct and use the new one.

```go
package yourdatasource

import (
	"github.com/perses/perses/go-sdk/datasource"
	datasourceSpec "github.com/perses/spec/go/datasource"
)

const (
	PluginKind = "YourDatasource"
)

type Option func(plugin *Builder) error

func create(options ...Option) (Builder, error) {
	builder := &Builder{
		HTTPDatasourceSpec: datasourceSpec.HTTPDatasourceSpec{},
	}

	var defaults []Option

	for _, opt := range append(defaults, options...) {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

type Builder struct {
	datasourceSpec.HTTPDatasourceSpec `json:",inline" yaml:",inline"`
}

func YourDatasource(options ...Option) datasource.Option {
	return func(builder *datasource.Builder) error {
		plugin, err := create(options...)
		if err != nil {
			return err
		}

		builder.Spec.Plugin.Kind = PluginKind
		builder.Spec.Plugin.Spec = plugin.HTTPDatasourceSpec
		return nil
	}
}

func Selector(datasourceName string) *datasource.Selector {
	return &datasource.Selector{
		Kind: PluginKind,
		Name: datasourceName,
	}
}
```

2. If you are defining a datasource plugin with a more complex struct, you can replace the import path of the `http`
   package to `"github.com/perses/spec/go/datasource/proxy/http"`.

```go
package yourdatasource

import "github.com/perses/spec/go/datasource/proxy/http"

type PluginSpec struct {
	DirectURL  string      `json:"directUrl,omitempty" yaml:"directUrl,omitempty"`
	Proxy      *http.Proxy `json:"proxy,omitempty" yaml:"proxy,omitempty"`
	OtherField string      `json:"otherField,omitempty" yaml:"otherField,omitempty"`
}

```

### Upgrading from v0.52.0 to v0.53.0

#### Change in "Run Query" behavior in `MultiQueryEditor`

`MultiQueryEditor` component has a new mandatory method: `onQueryRun`.It will be called when the user click on the
button "Run Query".It's useful if you want to execute a query only when this button is clicked and not on every
`onChange` (previous Perses behavior).Now the `onChange` method is always called when something change in the editor.
On the Perses app, queries are only executed when the user click on the "Run Query" button, however changes are still
saved
if user save the dashboard without clicking on "Run Query".But embedded use-cases might want to execute queries on
every change,
so this new behavior allows both use-cases.

In parallel, the caching of queries has been greatly improved to avoid memory leaks on dashboard refresh. More info can
be found in related PR: [#3518](https: //github.com/perses/perses/pull/3518)
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
