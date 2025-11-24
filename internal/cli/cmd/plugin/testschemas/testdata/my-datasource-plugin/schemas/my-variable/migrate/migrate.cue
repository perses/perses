package migrate

import "strings"

#grafanaVar: {
	type: "custom"
	options: string
	...
}

kind: "MyVariable"
spec: {
	options: strings.Split(#grafanaVar.options, ",")
}
