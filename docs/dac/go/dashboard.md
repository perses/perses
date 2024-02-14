# Dashboard Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/dashboard"

var options []dashboard.Option
dashboard.New("my Super Dashboard", options...)
```
Need to provide the name of the dashboard and a list of options.


## Default options

- [Name()](#name): with the name provided in the constructor
- [Duration()](#duration): one hour


## Available options

### Name

```golang
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.Name("My Super Dashboard")
```
Define the dashboard metadata name and display name.


### ProjectName

```golang
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.ProjectName("MySuperProject")
```
Define the dashboard project name in metadata.


### Duration

```golang
import "time"
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.Duration(2*time.Hour)
```
Define the dashboard duration.


### RefreshInterval

```golang
import "time"
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.RefreshInterval(15*time.minutes)
```
Define the dashboard refresh interval.


### AddPanelGroup

```golang
import "github.com/perses/perses/go-sdk/dashboard"
import "github.com/perses/perses/go-sdk/panel-group"

var panelGroupOptions []panelgroup.Option
dashboard.AddPanelGroup("My Super Panel Group", panelGroupOptions...)
```
Add a panel group to the dashboard. More info at [Panel Group](./panel-group.md).


### AddDatasource

```golang
import "github.com/perses/perses/go-sdk/dashboard"
import "github.com/perses/perses/go-sdk/datasource"

var datasourceOptions []datasource.Option
dashboard.AddDatasource("MySuperDatasourceName", datasourceOptions...)
```
Add a local datasource to the dashboard. More info at [Datasource](./datasource.md).


### AddVariable

```golang
import "github.com/perses/perses/go-sdk/dashboard"
import "github.com/perses/perses/go-sdk/variable"

var variableOptions []variable.Option
dashboard.AddVariable("MySuperVariableName", variableOptions...)
```
Add a local variable to the dashboard. More info at [Variable](./variable.md).


### AddVariableGroup

```golang
import "github.com/perses/perses/go-sdk/dashboard" 
import "github.com/perses/perses/go-sdk/variable-group"

var variableGroupOptions []variablegroup.Option
dashboard.AddVariableGroup(variableGroupOptions...)
```
Add a group of variables to the dashboard. More info at [Variable Group](./variable-group.md).


## Example

```golang
package main

import (
	"time"

	"github.com/perses/perses/go-sdk/dashboard"
	"github.com/perses/perses/go-sdk/panel-group"
	"github.com/perses/perses/go-sdk/panel/markdown"

	promDs "github.com/perses/perses/go-sdk/prometheus/datasource"
	labelValuesVar "github.com/perses/perses/go-sdk/prometheus/variable/label-values"
	listVar "github.com/perses/perses/go-sdk/variable/list-variable"
)

func main() {
	dashboard.New("ContainersMonitoring",
		dashboard.ProjectName("MyProject"),
		dashboard.RefreshInterval(1*time.Minute),

		// VARIABLES
		dashboard.AddVariable("stack",
			listVar.List(
				labelValuesVar.PrometheusLabelValues("stack",
					labelValuesVar.Matchers("thanos_build_info{}"),
					labelValuesVar.Datasource("promDemo"),
				),
				listVar.DisplayName("PaaS"),
			),
		),
		
		// ROWS
		dashboard.AddPanelGroup("Info",
			panelgroup.PanelsPerLine(3),

			// PANELS
			panelgroup.AddPanel("Contact",
				markdown.Markdown("Dashboard owner: [John Doe](mailto:zzz)"),
			),
		),

		// DATASOURCES
		dashboard.AddDatasource("promDemo", promDs.Prometheus(promDs.HTTPProxy("#####"))),
	)
}
```
