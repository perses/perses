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

### Prometheus Query

```golang
import "github.com/perses/perses/go-sdk/prometheus/query"

query.PromQL("max by (container) (container_memory_rss{})")
```

Set Prometheus Query plugin for the query. More info at [Prometheus Query](./prometheus/query.md).

## Example

```golang
package main

import (
	"github.com/perses/perses/go-sdk/dashboard"
	"github.com/perses/perses/go-sdk/panel"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	timeseries "github.com/perses/perses/go-sdk/panel/time-series"
	"github.com/perses/perses/go-sdk/prometheus/query"
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
