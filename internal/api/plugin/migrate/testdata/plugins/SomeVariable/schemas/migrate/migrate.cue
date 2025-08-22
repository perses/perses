package migrate

import "strings"

#var: {
	type: string
	...
}

if #var.type == "custom" {
	kind: "SomeVariable"
	spec: {
		values: strings.Split(#var.query, ",")
	}
}
