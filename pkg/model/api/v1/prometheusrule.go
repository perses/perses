package v1

import (
	"encoding/json"
	"fmt"
)

func GeneratePrometheusRuleID(project string, name string) string {
	return generateProjectResourceID("prometheusrules", project, name)
}

type Rule struct {
	Record      string            `json:"record"`
	Alert       string            `json:"alert"`
	Expr        string            `json:"expr"`
	For         string            `json:"for,omitempty"`
	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`
}

type RuleGroup struct {
	Name     string `json:"name"`
	Internal string `json:"internal"`
	Rules    []Rule `json:"rules"`
}

type PrometheusRuleSpec struct {
	Groups []RuleGroup `json:"groups"`
}

type PrometheusRule struct {
	Kind     Kind               `json:"kind"`
	Metadata ProjectMetadata    `json:"metadata"`
	Spec     PrometheusRuleSpec `json:"spec"`
}

func (p *PrometheusRule) GenerateID() string {
	return GeneratePrometheusRuleID(p.Metadata.Project, p.Metadata.Name)
}

func (p *PrometheusRule) GetMetadata() interface{} {
	return &p.Metadata
}

func (p *PrometheusRule) UnmarshalJSON(data []byte) error {
	var tmp PrometheusRule
	type plain PrometheusRule
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*p = tmp
	return nil
}

func (p *PrometheusRule) validate() error {
	if p.Kind != KindPrometheusRule {
		return fmt.Errorf("invalid kind: '%s' for a PrometheusRule type", p.Kind)
	}
	return nil
}
