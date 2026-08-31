module: "github.com/perses/perses/cue@v0"
language: {
	version: "v0.16.1"
}
source: {
	kind: "git"
}
deps: {
	"github.com/perses/shared/cue@v0": {
		v:       "v0.55.0-beta.6"
		default: true
	}
	"github.com/perses/spec/cue@v0": {
		v:       "v0.3.0-beta.5"
		default: true
	}
}
