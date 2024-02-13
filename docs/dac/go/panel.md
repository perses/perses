# Panel

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
