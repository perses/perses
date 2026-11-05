package migrate

#grafanaType: "timeseries"
#panel:       _

kind: "FooChart"
spec: {
	iwas: #panel.type
	expr: *#panel.targets[0].expr | "not found"
}
