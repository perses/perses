package mergeindexedcolumns

import (
	"github.com/perses/perses/go-sdk/transform"
)

const PluginKind = "MergeIndexedColumns"

type Option func(plugin *Builder) error

func create(options ...Option) (Builder, error) {
	builder := &Builder{
		PluginSpec: PluginSpec{},
	}

	for _, opt := range options {
		if err := opt(builder); err != nil {
			return *builder, err
		}
	}

	return *builder, nil
}

type PluginSpec struct {
	Column string `json:"column" yaml:"column"`
}

type Builder struct {
	PluginSpec `json:",inline" yaml:",inline"`
}

func MergeIndexedColumns(options ...Option) transform.Option {
	return func(builder *transform.Builder) error {
		plugin, err := create(options...)
		if err != nil {
			return err
		}

		builder.Spec.Plugin.Kind = PluginKind
		builder.Spec.Plugin.Spec = plugin.PluginSpec
		return nil
	}
}
