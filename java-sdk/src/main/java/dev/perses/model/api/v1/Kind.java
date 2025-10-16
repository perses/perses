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

public enum Kind {
    DASHBOARD("Dashboard"),
    DATASOURCE("Datasource"),
    EPHEMERAL_DASHBOARD("EphemeralDashboard"),
    FOLDER("Folder"),
    GLOBAL_DATASOURCE("GlobalDatasource"),
    GLOBAL_ROLE("GlobalRole"),
    GLOBAL_ROLE_BINDING("GlobalRoleBinding"),
    GLOBAL_SECRET("GlobalSecret"),
    GLOBAL_VARIABLE("GlobalVariable"),
    PROJECT("Project"),
    ROLE("Role"),
    ROLE_BINDING("RoleBinding"),
    SECRET("Secret"),
    USER("User"),
    VARIABLE("Variable");

    private final String kind;

    Kind(String kind) {
        this.kind = kind;
    }

    public String toString() {
        return kind;
    }
}
