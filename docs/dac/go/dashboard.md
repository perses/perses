# Dashboard

## Constructor

```golang
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.New("my Super Dashboard", options...)
```

You need to provide a name to your dashboard and you can provide a list of options.


## Default options

- [Name()](#name): with the name provided in the constructor
- [Duration()](#duration): one hour


## Available options

### Name

```golang
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.Name("My Super Dashboard")
```
Renames the dashboard metadata name + display name


### ProjectName

```golang
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.ProjectName("MySuperProject")
```
Renames the dashboard project name in metadata


### Duration

```golang
import "time"
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.Duration(2*time.Hour)
```
Set dashboard duration


### RefreshInterval

```golang
import "time"
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.RefreshInterval(15*time.minutes)
```
Set dashboard refresh interval


### AddPanelGroup

```golang
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.AddPanelGroup("My Super Panel Group", panelGroupOptions...)
```
Add a panel group to the dashboard. More info at [Panel Group](../panel-group.md)


### AddDatasource

```golang
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.AddDatasource("MySuperDatasource", datasourceOptions...)
```
Add a local datasource to the dashboard. More info at [Datasource](../datasource.md)


### AddVariable

```golang
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.AddVariable("MySuperVariable", variableOptions...)
```
Add a local variable to the dashboard. More info at [Variable](../variable.md)


### AddVariableGroup

```golang
import "github.com/perses/perses/go-sdk/dashboard" 

dashboard.AddVariableGroup("Totot")
```
Add a group of variables to the dashboard. More info at [Variable Group](../variable-group.md)
