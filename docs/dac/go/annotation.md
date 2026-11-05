# Annotation Builder

## Constructor

```golang
import "github.com/perses/perses/go-sdk/annotation"

var options []annotation.Option
annotation.New("Deployments", options...)
```

Need to provide the name of the annotation and a list of options.

## Default options

- [Name()](#name): with the name provided in the constructor.

## Available options

### Name

```golang
annotation.Name("Deployments")
```

Sets the annotation display name.

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

### Plugin

```golang
annotation.Plugin(plugin.Plugin{Kind: "PrometheusAnnotation", Spec: spec})
```

Sets the annotation plugin configuration. An annotation plugin SDK returns an `annotation.Option` that sets this field.

## Annotation Plugin Options

See the related documentation for each annotation plugin.

## Example

```golang
dashboard.AddAnnotation("Deployments",
	annotationPlugin(),
	annotation.Description("Production deployments"),
	annotation.Color("#ff0000"),
)
```
