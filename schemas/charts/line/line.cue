package line

import (
	"github.com/perses/perses/schemas/common/prometheus"
)

#panel: {
	kind: "LineChart"
	display: {
		name: string
	}
	options: {
		queries: [...prometheus.#query]
		show_legend?: bool
	}
}

#panel
