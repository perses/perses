module: "cue.example"
language: {
	version: "v0.12.0"
}
source: {
	kind: "git"
}
deps: {
	"github.com/perses/perses/cuelang@v0": {
		v:       "v0.0.0-test"
		default: true
	}
	"github.com/perses/plugins/prometheus@v0": {
		v:       "v0.0.0-test"
		default: true
	}
	"github.com/perses/plugins/timeserieschart@v0": {
		v:       "v0.0.0-test"
		default: true
	}
}
