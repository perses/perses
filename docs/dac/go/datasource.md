# Datasource Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/datasource"

var options []datasource.Option
datasource.New("My Super Datasource", options...)
```

Need to provide the name of the datasource and a list of options.

## Default options

- [Name()](#name): with the name provided in the constructor.

## Available options

### Name

```golang
import "github.com/perses/perses/go-sdk/datasource" 

datasource.Name("My Super Datasource")
```

Define the datasource metadata name + display name.

### ProjectName

```golang
import "github.com/perses/perses/go-sdk/datasource" 

datasource.ProjectName("MySuperProject")
```

Define the datasource project name in metadata.

### Default

```golang
import "github.com/perses/perses/go-sdk/datasource" 

datasource.Default(true)
```

Set if datasource is a default datasource.

## Datasource Plugin Options

See the related documentation for each datasource plugin.

## Example

```golang
package main

import (
	"github.com/perses/perses/go-sdk/dashboard"
	
	promDs "github.com/perses/plugins/prometheus/sdk/go/datasource"
)

func main() {
	dashboard.New("ExampleDashboard",
		dashboard.AddDatasource("prometheusDemo", promDs.Prometheus(promDs.DirectURL("https://prometheus.demo.prometheus.io/"))),
	)
}
```
