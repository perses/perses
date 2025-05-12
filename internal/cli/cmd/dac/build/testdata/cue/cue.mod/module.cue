module: "cue.example"
language: {
	version: "v0.12.0"
}
source: {
	kind: "git"
}
deps: {
	"github.com/perses/perses/cue@v0": {
		v:       "v0.51.0-preview"
		default: true
	}
	"github.com/perses/plugins/prometheus@v0": {
		v:       "v0.51.0-beta.2"
		default: true
	}
	"github.com/perses/plugins/timeserieschart@v0": {
		v:       "v0.6.0"
		default: true
	}
}
