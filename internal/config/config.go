package config

import "github.com/perses/common/config"

type Config struct {
	Etcd config.EtcdConfig `yaml:"etcd"`
}

func Resolve(configFile string) (Config, error) {
	c := Config{}
	return c, config.NewResolver().
		SetConfigFile(configFile).
		SetEnvPrefix("PERSES").
		Resolve(&c).
		Verify()
}
