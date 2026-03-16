module: "github.com/perses/perses/cue@v0"
language: {
	version: "v0.15.1"
}
source: {
	kind: "git"
}
deps: {
	"github.com/perses/shared/cue@v0": {
		v:       "v0.53.1"
		default: true
	}
	"github.com/perses/spec/cue@v0": {
		v:       "v0.1.2"
		default: true
	}
}
