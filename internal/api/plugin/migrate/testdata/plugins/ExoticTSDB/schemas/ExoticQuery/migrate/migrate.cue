package migrate

#target: _

if (*#target.datasource.type | null) == "exotic-tsdb" {
	kind: "ExoticQuery"
	spec: {
		query: #target.expr
	}
},