package migrate

import "strings"

#grafanaVar: {
	type: "custom"
	query: string
	...
}

kind: "SomeVariable"
spec: {
	values: strings.Split(#grafanaVar.query, ",")
}
