package prometheus

#query: {
	kind: "PrometheusGraphQuery"
	options: {
		query: string
		min_step?: =~"^(?:(\\d+)y)?(?:(\\d+)w)?(?:(\\d+)d)?(?:(\\d+)h)?(?:(\\d+)m)?(?:(\\d+)s)?(?:(\\d+)ms)?$"
		resolution?: number
	}
}
