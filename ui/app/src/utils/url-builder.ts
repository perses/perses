// Copyright 2021 The Perses Authors
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

export class URLBuilderUtil {
  private readonly prefixAPI = '/api/v1';
  private resource: string;
  private project: string;
  private name: string;

  constructor() {
    this.resource = '';
    this.project = '';
    this.name = '';
  }

  setProject(project: string): URLBuilderUtil {
    this.project = project;
    return this;
  }

  setName(name: string): URLBuilderUtil {
    this.name = name;
    return this;
  }

  setResource(resource: string): URLBuilderUtil {
    this.resource = resource;
    return this;
  }

  build(): string {
    let url = this.prefixAPI;
    if (this.project && this.project.length > 0) {
      url = `${url}/projects/${this.project}`;
    }
    url = `${url}/${this.resource}`;
    if (this.name.length > 0) {
      url = `${url}/${this.name}`;
    }
    return url;
  }
}
