# Getting started with Dashboard-as-Code

!!! info
	See the introduction about the Dashboard-as-Code (DaC) topic [here](./introduction.md).

## Getting started with the CUE SDK

### Prerequisites

- `percli`, the [CLI of Perses](../cli.md).
- `cue`, the [CLI of Cuelang](https://cuelang.org/).

### Repository setup

Create a new folder that will become your DaC repository, then follow the steps below:

#### 1. Initialize the CUE module

```
cue mod init <module name>
```

See the [CUE documentation](https://cuelang.org/docs/concept/modules-packages-instances/) for more information about this step.

#### 2. Retrieve the CUE sources from Perses

Ideally we should rely on a native dependency management here, but since it's not yet available for CUE as already mentioned, we provide in the meantime a dedicated CLI command `dac setup` in order to add the CUE sources from Perses as external dependencies to your repo:

```
percli dac setup --version 0.47.1 # any version you'd like above v0.44.0
```

You can omit the version flag if you are connected to a Perses server (it will retrieve its version). Otherwise, unless you have a specific case, better to pass the latest version available.

### Develop dashboards

You are now fully ready to start developping dashboards as code!

It's first strongly recommended to ramp up on CUE if you are not familiar with this technology. For this have a look at:

- The [official website](https://cuelang.org/) of Cuelang.
- [Cuetorials](https://cuetorials.com/), a 3rd party source of information that is a very good complement.

You should then have a look at the [CUE SDK documentation](../dac/cue/README.md) to better understand how to use the framework.

You can also check an example of DaC usage [here](https://github.com/perses/perses/blob/main/internal/test/dac/input.cue).

## Getting started with the Go SDK

### Prerequisites

- `percli`, the [CLI of Perses](../cli.md).
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

You should then have a look at the [Go SDK documentation](../dac/go/README.md) to better understand how to use the framework.

You can also check an example of DaC usage [here](https://github.com/perses/perses/blob/main/internal/cli/cmd/dac/build/testdata/go/main.go).

!!! warning
	Do not log / print on the standard stdout! It would break the output of the `dac build` command.

Quick start example:

```golang
package main

import (
	"flag"

	"github.com/perses/perses/go-sdk"
	"github.com/perses/perses/go-sdk/dashboard"
	"github.com/perses/perses/go-sdk/panel"
	"github.com/perses/perses/go-sdk/prometheus/query"
	"github.com/perses/perses/go-sdk/panel-group"

	timeSeriesPanel "github.com/perses/perses/go-sdk/panel/time-series"
	promDs "github.com/perses/perses/go-sdk/prometheus/datasource"
	labelValuesVar "github.com/perses/perses/go-sdk/prometheus/variable/label-values"
	listVar "github.com/perses/perses/go-sdk/variable/list-variable"
)

func main() {
	flag.Parse()
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

		dashboard.AddPanelGroup("Resource usage",
			panelgroup.PanelsPerLine(3),
			panelgroup.AddPanel("Container memory",
				timeSeriesPanel.Chart(),
				panel.AddQuery(
					query.PromQL("max by (container) (container_memory_rss{paas=\"$paas\",namespace=\"$namespace\",pod=\"$pod\",container=\"$container\"})"),
				),
			),
		),

		dashboard.AddDatasource("promDemo", promDs.Prometheus(promDs.HTTPProxy("https://demo.prometheus.com"))),
	)
	exec.BuildDashboard(builder, buildErr)
}
```

## Build dashboards

Anytime you want to build the final dashboard definition (i.e: Perses dashboard in JSON or YAML format) corresponding to your as-code definition, you can use the `dac build` command, as the following:

```
percli dac build -f main.go -ojson
percli dac build -f my_dashboard.cue -ojson
```

If the build is successful, the result can be found in the generated `built` folder.

!!! note
	the `-o` (alternatively '--output') flag is optional (the default output format is YAML).

### Build multiple dashboards at once

If you want to develop multiple dashboards as code, you should have **1 dashboard per file** and then call the build command with the directory option:

```
percli dac build -d my_dashboards
```

## Deploy dashboards

Once you are satisfied with the result of your DaC definition for a given dashboard, you can finally deploy it to Perses with the `apply` command:

```
percli apply -f built/my_dashboard.json
```

### CI/CD setup

Setting up a CI/CD pipeline for your Dashboard-as-Code workflow is straightforward, as [percli](../cli.md) provides all the necessary commands to automate the process. You can integrate percli with any CI/CD technology of your choice: Jenkins, CircleCI, GitLab CI/CD, etc.

The key steps typically involve:

- Building the dashboards using `percli dac build` to generate the final JSON/YAML definitions.
- Validating the output to ensure correctness before deployment.
- Deploying the dashboards to Perses with `percli apply`.

If you are using GitHub Actions, we provide a [standard library](https://github.com/perses/cli-actions) that simplifies this integration. This includes:

- A pre-configured workflow designed for common DaC CI/CD setups, making it easy to adopt without extensive configuration. 

	Example of usage:
	```yaml
	jobs:
	  dac:
	   uses: perses/cli-actions/.github/workflows/dac.yaml@v0.1.0
	   with:
	     url: https://demo.perses.dev
	     directory: ./dac
	     server-validation: true
	   secrets:
	     username: ${{ secrets.USR }}
	     password: ${{ secrets.PWD }}
	```

- Independent actions for each CLI command, allowing you to build customized workflows.

	Example of usage:
	```yaml
	steps:
	  - name: Deploy the dashboards
	    uses: perses/cli-actions/actions/apply_resources@v0.1.0
	    with:
	      directory: ./testdata/dashboards_folder
	```

	The full list of actions is available [here](https://github.com/perses/cli-actions/blob/main/README.md#actions).

By leveraging these tools, you can ensure that your dashboards are automatically validated and deployed in a consistent and reliable manner.
