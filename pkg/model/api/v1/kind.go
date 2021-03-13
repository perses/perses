package v1

import (
	"encoding/json"
	"fmt"
)

type Kind string

const (
	KindProject        Kind = "Project"
	KindPrometheusRule Kind = "PrometheusRule"
)

var KindMap = map[Kind]bool{
	KindProject: true,
}

func (k *Kind) UnmarshalJSON(data []byte) error {
	var tmp Kind
	type plain Kind
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*k = tmp
	return nil
}

func (k *Kind) validate() error {
	if len(*k) == 0 {
		return fmt.Errorf("kind cannot be empty")
	}
	if _, ok := KindMap[*k]; !ok {
		return fmt.Errorf("unknown kind '%s' used", *k)
	}
	return nil
}
