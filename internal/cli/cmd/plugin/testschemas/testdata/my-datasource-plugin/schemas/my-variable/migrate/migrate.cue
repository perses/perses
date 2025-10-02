package migrate

import "strings"

#var: {
	type: string
	...
}

if #var.type == "custom" {
	kind: "MyVariable"
	spec: {
		options: strings.Split(#var.options, ",")
	}
}
