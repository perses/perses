package v1

import (
	"encoding/json"
	"fmt"
)

type Kind string

const KindProject Kind = "project"

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

type Metadata struct {
	Kind Kind   `json:"kind"`
	Name string `json:"name"`
}

func (m *Metadata) UnmarshalJSON(data []byte) error {
	var tmp Metadata
	type plain Metadata
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*m = tmp
	return nil
}

func (m *Metadata) validate() error {
	if len(m.Name) == 0 {
		return fmt.Errorf("metadata.name cannot be empty")
	}
	return nil
}
