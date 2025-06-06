# Panel Group Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/panel-group"

var options []panelgroup.Option
panelgroup.New("My Panel Group Title", options...)
```

Need to provide a title and a list of options.

## Default options

- [Title()](#title): with the title provided in the constructor.
- [PanelWidth()](#panelwidth): 12
- [PanelHeight()](#panelheight): 6
- [Collapsed()](#collapsed): true

## Available options

### Title

```golang
import "github.com/perses/perses/go-sdk/panel-group"

panelgroup.Title("My Panel Group Title")
```

Define the panel group title.

### PanelWidth

```golang
import "github.com/perses/perses/go-sdk/panel-group"

panelgroup.PanelWidth(6)
```

Define the panel width. The value must be between 1 and 24.

### PanelsPerLine

```golang
import "github.com/perses/perses/go-sdk/panel-group"

panelgroup.PanelsPerLine(4)
```

Helper for defining panel width instead of PanelWidth. The value must be between 1 and 24.

### PanelHeight

```golang
import "github.com/perses/perses/go-sdk/panel-group"

panelgroup.PanelHeight(6)
```

Define the panel height. The value must be between 1 and 24.

### Collapsed

```golang
import "github.com/perses/perses/go-sdk/panel-group"

panelgroup.Collapsed(true)
```

Define if the panel group is collapsed or not when the dashboard is loaded.
Collapsed panel group are lazy loaded when they are opened.

### AddPanel

```golang
import "github.com/perses/perses/go-sdk/panel-group"
import "github.com/perses/perses/go-sdk/panel"

var panelOptions []panel.Option
panelgroup.AddPanel("MySuperPanelName", panelOptions...)
```

Add a panel to the group, the panel will be placed depending on the ordering of in the group.
More info about the panel can be found [here](panel.md).

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
			panelgroup.Collapsed(false),
			panelgroup.PanelsPerLine(1),
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
