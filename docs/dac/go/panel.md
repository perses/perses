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

### Bar Panel

```golang
import "github.com/perses/perses/go-sdk/panel/bar"

var barOptions []bar.Option
bar.Chart(barOptions...)
```

Define the panel chart. More info at [Bar Panel](./panel/bar.md).

### Gauge Panel

```golang
import "github.com/perses/perses/go-sdk/panel/gauge"

var gaugeOptions []gauge.Option
gauge.Chart(gaugeOptions...)
```

Define the panel chart. More info at [Gauge Panel](./panel/gauge.md).

### Markdown Panel

```golang
import "github.com/perses/perses/go-sdk/panel/markdown"

var markdownOptions []markdown.Option
markdown.Chart(markdownOptions...)
```

Define the panel chart. More info at [Markdown Panel](./panel/markdown.md).

### Stat Panel

```golang
import "github.com/perses/perses/go-sdk/panel/stat"

var statOptions []stat.Option
stat.Chart(statOptions...)
```

Define the panel chart. More info at [Stat Panel](./panel/stat.md).

### Time Series Panel

```golang
import "github.com/perses/perses/go-sdk/panel/time-series"

var timeSeriesOptions []timeseries.Option
timeseries.Chart(timeSeriesOptions...)
```

Define the panel chart. More info at [Time Series Panel](./panel/time-series.md).
