package joinbycolumnvalue

import (
	"github.com/perses/perses/go-sdk/panel"
)

const PluginKind = "JoinByColumnValue"

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

func JoinByColumnValue(options ...Option) panel.Option {
	return func(builder *panel.Builder) error {
		plugin, err := create(options...)
		if err != nil {
			return err
		}

		builder.Spec.Plugin.Kind = PluginKind
		builder.Spec.Plugin.Spec = plugin.PluginSpec
		return nil
	}
}
