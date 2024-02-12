# Dashboard-as-Code

Perses offers the possibility to define dashboards as code instead of going through manipulations on the UI.
But why would you want to do this? Basically Dashboard-as-Code (DaC) is something that becomes useful
at scale, when you have many dashboards to maintain, to keep aligned on certain parts, etc.

DaC benefits can be summarized as follows:
- **Operational efficiency**, by the reusability of a common basis of dashboard components for standard monitoring use cases.
- **Implementation cost reduction**, by leveraging on existing components when creating new dashboards.
- **Maintenance cost reduction**, by making it easier to: cascade the same update on multiple dashboards, keep multiple components aligned with each other, etc..

Most of these benefits comes from not dealing with the Perses JSON format directly: instead, we provide SDKs in languages that enable factorization, code imports and more, namely:
* [CUE](https://cuelang.org/), a powerful templating language with a strong emphasis on data validation.
* [Go](https://go.dev/), an opensource programming language, that probably doesn't need to be introduced...

Just pick your favorite to start with DaC. If you don't have one, give a try to both!

> [!NOTE]
> CUE is the language used for the data model of the plugins, which means you'll always be able to include any external plugin installed in your Perses server into your code when using the CUE SDK. 
> However, the Golang SDK may not support all the plugins: it's basically up to each plugin development team to provide a Go package to enable the DaC use case. 
> This statement applies also to any other language we might have a SDK for in the future.

Also, as-code means it's GitOps-friendly, meaning that you can also benefit from:
- versions history
- peer-review of changes before rollout
- automated deployments
- and more...

## Getting Started With Cue

### Prerequisites

- `percli`, the [CLI of Perses](../tooling/cli.md).
- `cue`, the [CLI of Cuelang](https://cuelang.org/).

### Repository setup

Create a new folder that will become your DaC repository, then follow the steps below:

#### 1. Initialize the CUE module

```
cue mod init <module name>
```
See the [CUE documentation](https://cuelang.org/docs/concepts/packages/) for more information about this step.

#### 2. Retrieve the CUE sources from Perses

Ideally we should rely on a native dependency management here, but since it's not yet available for CUE as already mentioned, we provide in the meantime a dedicated CLI command `dac setup` in order to add the CUE sources from Perses as external dependencies to your repo:

```
percli dac setup --version 0.42.1
```

You can omit the version flag if you are connected to a Perses server (it will retrieve its version). Otherwise, unless you have a specific case, better to pass the latest version available.

### Develop dashboards

You are now fully ready to start developping dashboards as code!

It's first strongly recommended to ramp up on CUE if you are not familiar with this technology. For this have a look at:
- The [official website](https://cuelang.org/) of Cuelang.
- [Cuetorials](https://cuetorials.com/), a 3rd party source of information that is a very good complement.

Then, you can check an example of DaC usage [here](../../internal/test/dac/input.cue). This example is heavily relying on the DaC utilities we provide. To get a deeper understanding of these libs and how to use them, the best thing to do for now is to check directly their source code.


## Getting started with Go SDK

### Prerequisites

- `percli`, the [CLI of Perses](../tooling/cli.md).
- `go`, the [programming language](https://go.dev/).

### Repository setup

Create a new folder that will become your DaC repository, then follow the steps below:

#### 1. Initialize the Go module

```
go mod init <module name>
```
See the [Go documentation](https://go.dev/doc/tutorial/create-module) for more information about this step.

#### 2. Install the Perses SDK

```
go get github.com/perses/perses
```

If you need a specific version, you can specify it as follows:

```
go get github.com/perses/perses v0.43.0
```

### Develop dashboards

You are now fully ready to start developing dashboards as code!

It's first strongly recommended to ramp up on Go if you are not familiar with this technology. For this have a look at:
- The [official website](https://go.dev/) of Go.

Then, you can check an example of DaC usage [here](../../internal/cli/cmd/dac/build/testdata_go/main.go).
To get a deeper understanding of the Go SDK and how to use it, the best thing to do for now is to check directly its source code.
All the SDK utilities are located in the `github.com/perses/perses/go-sdk` package.

> [!WARNING]  
> Do not log / print on the standard stdout! It would break the output of the `dac build` command.
 
Quick start example:

```golang
package main

import (
	"github.com/perses/perses/go-sdk"
	"github.com/perses/perses/go-sdk/dashboard"
	"github.com/perses/perses/go-sdk/panel"
	"github.com/perses/perses/go-sdk/prometheus/query"
	"github.com/perses/perses/go-sdk/row"

	timeSeriesPanel "github.com/perses/perses/go-sdk/panel/time-series"
	promDs "github.com/perses/perses/go-sdk/prometheus/datasource"
	labelValuesVar "github.com/perses/perses/go-sdk/prometheus/variable/label-values"
	listVar "github.com/perses/perses/go-sdk/variable/list-variable"
)

func main() {
	exec := sdk.NewExec()
	builder, buildErr := dashboard.New("ContainersMonitoring",
		dashboard.ProjectName("MyProject"),

		dashboard.AddVariable("stack",
			listVar.List(
				labelValuesVar.PrometheusLabelValues("paas",
					labelValuesVar.Matchers("thanos_build_info{}"),
					labelValuesVar.Datasource("promDemo"),
				),
				listVar.DisplayName("My Super PaaS"),
			),
		),

		dashboard.AddRow("Resource usage",
			row.PanelsPerLine(3),
			row.Panel("Container memory",
				timeSeriesPanel.Chart(),
				panel.AddQuery(
					query.PromQL("max by (container) (container_memory_rss{paas=\"$paas\",namespace=\"$namespace\",pod=\"$pod\",container=\"$container\"})"),
				),
			),
		),

		dashboard.AddDatasource("promDemo", promDs.Prometheus(promDs.HTTPProxy("https://demo.prometheus.com"))),
	)
	exec.ExecuteDashboard(builder, buildErr)
}
```


## Build dashboards

Anytime you want to build the final dashboard definition (i.e: Perses dashboard in JSON or YAML format) corresponding to your as-code definition, you can use the `dac build` command, as the following:

```
percli dac build main.go -ojson
percli dac build my_dashboard.cue -ojson
```

If the build is successful, the result can be found in the generated `built` folder.

> [!NOTE]
> the `-o` (alternatively '--output') flag is optional (the default output format is YAML).


## Deploy dashboards

Once you are satisfied with the result of your DaC definition for a given dashboard, you can finally deploy it to Perses with the `apply` command:

```
percli apply -f built/my_dashboard.json
```

### CICD setup

TODO