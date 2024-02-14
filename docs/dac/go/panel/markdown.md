# Markdown Panel Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/panel/markdown"

var options []markdown.Option
markdown.Markdown("My super markdown **text**", options...)
```

Need to provide a text and a list of options.

## Default options

- Text(): with the text provided in the constructor

## Available options

### Text

```golang
import "github.com/perses/perses/go-sdk/panel/markdown" 

markdown.Text("My super markdown **text**")
```

Define the markdown text of the panel.

### NewLine

```golang
import "github.com/perses/perses/go-sdk/panel/markdown" 

markdown.NewLine("my super new line text")
```

Add a new line to the markdown text.

## Example

```golang
package main

import (
	"github.com/perses/perses/go-sdk/dashboard"
	panelgroup "github.com/perses/perses/go-sdk/panel-group"
	"github.com/perses/perses/go-sdk/panel/markdown"
)

func main() {
	dashboard.New("Example Dashboard",
		dashboard.AddPanelGroup("Resource usage",
			panelgroup.AddPanel("Container memory",
				markdown.Markdown("This is a markdown panel",
					markdown.NewLine("This is a new line"),
					markdown.NewLine("This is a new line"),
					markdown.NewLine("This is a new line"),
					markdown.NewLine("This is a new line"),
					markdown.NewLine("This is a new line"),
					markdown.NewLine("This is a new line"),
				),
			),
		),
	)
}
```