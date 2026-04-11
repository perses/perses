package migrate

#target: _

if (*#target.datasource.type | null) == "exotic-tsdb" {
	kind: "ZExoticQuery"
	spec: {
		query: #target.expr
	}
}
