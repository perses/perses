module: "cue.example"
language: {
	version: "v0.17.0"
}
source: {
	kind: "git"
}
deps: {
	"github.com/perses/perses/cue@v0": {
		v:       "v0.54.0-rc.0"
		default: true
	}
	"github.com/perses/plugins/prometheus@v0": {
		v:       "v0.58.0"
		default: true
	}
	"github.com/perses/plugins/staticlistvariable@v0": {
		v:       "v0.9.0"
		default: true
	}
	"github.com/perses/plugins/table@v0": {
		v:       "v0.13.0"
		default: true
	}
	"github.com/perses/plugins/timeserieschart@v0": {
		v:       "v0.13.0"
		default: true
	}
	"github.com/perses/shared/cue@v0": {
		v:       "v0.55.0-beta.6"
		default: true
	}
	"github.com/perses/spec/cue@v0": {
		v: "v0.3.0-beta.5"
	}
}
