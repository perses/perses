# Panel Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/panel"

var options []panel.Option
panel.New("My Super Panel", options...)
```

Need to provide the name of the panel and a list of options.

## Default options

- [Title()](#title): with the title provided in the constructor.

## Available options

### Title

```golang
import "github.com/perses/perses/go-sdk/panel"

panel.Name("My Super Panel")
```

Define the panel title.

### Description

```golang
import "github.com/perses/perses/go-sdk/panel"

panel.Description("My Super Panel")
```

Define the panel description.

### AddQuery

```golang
import "github.com/perses/perses/go-sdk/panel"

var queryOptions []query.Option
panel.AddQuery(queryOptions...)
```

Define the panel query. More info at [Query](./query.md).

## Panel Plugin Options

See the related documentation for each panel plugin.

## Example

```golang
package main

import (
	"github.com/perses/perses/go-sdk/dashboard"
	"github.com/perses/perses/go-sdk/panel"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	"github.com/perses/plugins/prometheus/sdk/go/query"
	timeseries "github.com/perses/plugins/timeserieschart/sdk/go"
)

func main() {
	dashboard.New("Example Dashboard",
		dashboard.AddPanelGroup("Resource usage",
			panelgroup.AddPanel("Container memory",
				panel.Description("This is a super panel"),
				timeseries.Chart(),
				panel.AddQuery(
					query.PromQL("max by (container) (container_memory_rss{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\",container=\"$container\"})"),
				),
			),
		),
	)
}

```
