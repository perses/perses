package migrate

#grafanaAnnotation: _

if (*#grafanaAnnotation.datasource.type | null) == "exotic-tsdb" {
	kind: "SomeAnnotation"
	spec: {
		datasource: {
			kind: "ExoticTSDB"
			name: #grafanaAnnotation.datasource.uid
		}
		expr: #grafanaAnnotation.expr
	}
}
