# Panel Group

Panel group is a helper for adding panels to a dashboard. 
It wil

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
