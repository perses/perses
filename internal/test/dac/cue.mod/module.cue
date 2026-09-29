module: "cue.example"
language: {
	version: "v0.17.1"
}
source: {
	kind: "git"
}
deps: {
	"github.com/perses/perses/cue@v0": {
		v:       "v0.55.0-beta.3"
		default: true
	}
	"github.com/perses/plugins/prometheus@v0": {
		v:       "v0.59.0-beta.6"
		default: true
	}
	"github.com/perses/plugins/staticlistvariable@v0": {
		v:       "v0.10.0-beta.6"
		default: true
	}
	"github.com/perses/plugins/table@v0": {
		v:       "v0.14.0-beta.6"
		default: true
	}
	"github.com/perses/plugins/timeserieschart@v0": {
		v:       "v0.14.0-beta.7"
		default: true
	}
	"github.com/perses/shared/cue@v0": {
		v:       "v0.55.0-beta.13"
		default: true
	}
	"github.com/perses/spec/cue@v0": {
		v: "v0.3.0-beta.9"
	}
}
