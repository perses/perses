// Copyright 2022 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package utils

import (
	"fmt"
	"io"
	"strings"

	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

type resource struct {
	kind      modelV1.Kind
	shortTerm string
	aliases   []string
}

// resources is the list of alias per kind of resource supported by the API
var resources = []resource{
	{
		kind:      modelV1.KindDashboard,
		shortTerm: "dash",
		aliases: []string{
			"dashboards",
			"dashs",
		},
	},
	{
		kind:      modelV1.KindDatasource,
		shortTerm: "dts",
		aliases: []string{
			"datasources",
		},
	},
	{
		kind:      modelV1.KindFolder,
		shortTerm: "fld",
		aliases: []string{
			"folders",
			"flds",
		},
	},
	{
		kind:      modelV1.KindGlobalDatasource,
		shortTerm: "gdts",
		aliases: []string{
			"globalDatasources",
		},
	},
	{
		kind: modelV1.KindProject,
		aliases: []string{
			"projects",
		},
	},
}

func HandleSuccessResourceMessage(writer io.Writer, kind modelV1.Kind, project string, globalResourceMessage string) error {
	var outputErr error
	if IsGlobalResource(kind) {
		outputErr = HandleString(writer, globalResourceMessage)
	} else {
		outputErr = HandleString(writer, fmt.Sprintf("%s in the project %q", globalResourceMessage, project))
	}
	return outputErr
}

// IsGlobalResource returns true if the give resource type doesn't belong to a project.
// Returns false otherwise.
func IsGlobalResource(kind modelV1.Kind) bool {
	switch kind {
	case modelV1.KindProject, modelV1.KindGlobalDatasource:
		return true
	default:
		return false
	}
}

func ConvertToEntity(entities interface{}) ([]modelAPI.Entity, error) {
	var result []modelAPI.Entity
	switch objects := entities.(type) {
	case []*modelV1.Dashboard:
		for _, object := range objects {
			result = append(result, object)
		}
	case []*modelV1.Datasource:
		for _, object := range objects {
			result = append(result, object)
		}
	case []*modelV1.Folder:
		for _, object := range objects {
			result = append(result, object)
		}
	case []*modelV1.GlobalDatasource:
		for _, object := range objects {
			result = append(result, object)
		}
	case []*modelV1.Project:
		for _, object := range objects {
			result = append(result, object)
		}
	default:
		return nil, fmt.Errorf("this kind of list '%T' is not supported", objects)
	}

	return result, nil
}

// GetProject determinate the project we should use to perform an action on the current resource with the following logic:
// if the value is defined in the metadata, then we use this one.
// If it's not the case we consider the one given through the flag --project.
// If the flag is not used, then we use the one defined in the global configuration.
// These two last cases are usually already handled by the command itself during the `Complete` step.
func GetProject(metadata modelAPI.Metadata, defaultProject string) string {
	project := defaultProject
	if projectMetadata, ok := metadata.(*modelV1.ProjectMetadata); ok {
		if len(projectMetadata.Project) > 0 {
			project = projectMetadata.Project
		}
	}
	return project
}

// GetKind tries to find the kind from the given string. It returns an error if the kind is not managed,
// or no alias exists.
// This method is designed to be called in the cmds improving the readability of the kind arguments parsing.
func GetKind(res string) (modelV1.Kind, error) {
	alias := reverseResourceAliases()[strings.ToLower(res)]
	if len(alias) == 0 {
		return "", fmt.Errorf("resource %q not managed", res)
	}
	return alias, nil
}

// reverseResourceAliases creates a map with the key on of the alias that you can find in Resource.Alias.
func reverseResourceAliases() map[string]modelV1.Kind {
	result := make(map[string]modelV1.Kind)

	for _, r := range resources {
		for _, alias := range r.aliases {
			result[strings.ToLower(alias)] = r.kind
		}
		// r.kind is an alias to kind, so we should consider it as well
		result[strings.ToLower(string(r.kind))] = r.kind
		if len(r.shortTerm) > 0 {
			result[strings.ToLower(r.shortTerm)] = r.kind
		}
	}
	return result
}

// FormatAvailableResourcesMessage formats the available resources that the user can use
func FormatAvailableResourcesMessage() string {
	var result []string
	for _, r := range resources {
		var res string
		if len(r.shortTerm) == 0 {
			res = string(r.kind)
		} else {
			res = fmt.Sprintf("%s (aka '%s')", r.kind, r.shortTerm)
		}
		result = append(result, res)
	}
	return FormatArrayMessage("you have to specify the resource type that you want to retrieve. Valid resource type include:", result)
}
