# TimeSeries Panel Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/panel/time-series"

var options []timeseries.Option
timeseries.Chart(options...)
```
Need a list of options.


## Default options

- None


## Available options

### WithLegend

```golang
import "github.com/perses/perses/go-sdk/common"
import "github.com/perses/perses/go-sdk/panel/time-series"

timeseries.WithLegend(timeseries.Legend{...})
```
Define legend properties of the chart.


### WithTooltip

```golang
import "github.com/perses/perses/go-sdk/common"
import "github.com/perses/perses/go-sdk/panel/time-series"

timeseries.WithTooltip(timeseries.Tooltip{...})
```
Define tooltip properties of the chart.


### WithYAxis

```golang
import "github.com/perses/perses/go-sdk/common"
import "github.com/perses/perses/go-sdk/panel/time-series"

timeseries.WithYAxis(timeseries.YAxis{...})
```
Define Y axis properties of the chart.


### Thresholds

```golang
import "github.com/perses/perses/go-sdk/common"
import "github.com/perses/perses/go-sdk/panel/time-series"

timeseries.Thresholds(common.Thresholds{...})
```
Define chart thresholds.

### WithVisual

```golang
import "github.com/perses/perses/go-sdk/panel/time-series"

timeseries.WithVisual(timeseries.Visual{...})
```
Define visual properties of the chart.