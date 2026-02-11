// Copyright 2025 The Perses Authors
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

package dev.perses.model.api.v1;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum Kind {
    @JsonProperty("Dashboard")
    DASHBOARD("Dashboard"),
    @JsonProperty("Datasource")
    DATASOURCE("Datasource"),
    @JsonProperty("EphemeralDashboard")
    EPHEMERAL_DASHBOARD("EphemeralDashboard"),
    @JsonProperty("Folder")
    FOLDER("Folder"),
    @JsonProperty("GlobalDatasource")
    GLOBAL_DATASOURCE("GlobalDatasource"),
    @JsonProperty("GlobalRole")
    GLOBAL_ROLE("GlobalRole"),
    @JsonProperty("GlobalRoleBinding")
    GLOBAL_ROLE_BINDING("GlobalRoleBinding"),
    @JsonProperty("GlobalSecret")
    GLOBAL_SECRET("GlobalSecret"),
    @JsonProperty("GlobalVariable")
    GLOBAL_VARIABLE("GlobalVariable"),
    @JsonProperty("Project")
    PROJECT("Project"),
    @JsonProperty("Role")
    ROLE("Role"),
    @JsonProperty("RoleBinding")
    ROLE_BINDING("RoleBinding"),
    @JsonProperty("Secret")
    SECRET("Secret"),
    @JsonProperty("User")
    USER("User"),
    @JsonProperty("Variable")
    VARIABLE("Variable");

    private final String kind;

    Kind(String kind) {
        this.kind = kind;
    }

    public String toString() {
        return kind;
    }
}
