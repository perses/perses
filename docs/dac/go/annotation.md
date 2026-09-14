# Annotation Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/annotation"

annotation.New("Deployments", annotationPlugin())
```

An annotation requires a display name and configuration from an annotation plugin SDK. Plugin SDKs return an `annotation.Option`; pass it as the second argument to `annotation.New`, `dashboard.AddAnnotation`, or `panel.AddAnnotation`.

## Available display options

### Description

```golang
annotation.Description("Production deployments")
```

Sets the annotation description.

### Hidden

```golang
annotation.Hidden(true)
```

Controls whether the annotation is initially hidden.

### Color

```golang
annotation.Color("#ff0000")
```

Sets the annotation display color.

## Example

```golang
dashboard.AddAnnotation("Deployments",
	annotationPlugin(),
	annotation.Description("Production deployments"),
	annotation.Color("#ff0000"),
)
```
