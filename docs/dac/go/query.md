# Query Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/query"

var options []query.Option
query.New(options...)
```

Need to provide a list of options.

## Default options

- None

## Available options

None

## Query Plugin Options

See the related documentation for each query plugin.

## Example

```golang
package main

import (
	"github.com/perses/perses/go-sdk/dashboard"
	"github.com/perses/perses/go-sdk/panel"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	"github.com/perses/plugins/prometheus/sdk/go/query"
	timeseries "github.com/perses/plugins/timeserieschart/sdk/gop"
)

func main() {
	dashboard.New("Example Dashboard",
		dashboard.AddPanelGroup("Resource usage",
			panelgroup.AddPanel("Container memory",
				timeseries.Chart(),
				panel.AddQuery(
					query.PromQL("max by (container) (container_memory_rss{stack=\"$stack\",prometheus=\"$prometheus\",prometheus_namespace=\"$prometheus_namespace\",namespace=\"$namespace\",pod=\"$pod\",container=\"$container\"})"),
				),
			),
		),
	)
}

```
