package v1

import (
	"encoding/json"
	"fmt"
	"time"
)

func GeneratePrometheusRuleID(project string, name string) string {
	return generateProjectResourceID("prometheusrules", project, name)
}

type Rule struct {
	Record      string            `json:"record"`
	Alert       string            `json:"alert"`
	Expr        string            `json:"expr"`
	For         time.Duration     `json:"for"`
	Labels      map[string]string `json:"labels"`
	Annotations map[string]string `json:"annotations"`
}

type RuleGroup struct {
	Name     string        `json:"name"`
	Internal time.Duration `json:"internal"`
	Rules    []Rule        `json:"rules"`
}

type PrometheusRuleSpec struct {
	Groups []RuleGroup `json:"groups"`
}

type PrometheusRule struct {
	Metadata ProjectMetadata    `json:"metadata"`
	Spec     PrometheusRuleSpec `json:"spec"`
}

func (p *PrometheusRule) GenerateID() string {
	return GeneratePrometheusRuleID(p.Metadata.Project, p.Metadata.Name)
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
	if p.Metadata.Kind != KindPrometheusRule {
		return fmt.Errorf("invalid kind: '%s' for a PrometheusRule type", p.Metadata.Kind)
	}
	return nil
}
