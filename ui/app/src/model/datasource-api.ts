// Copyright 2023 The Perses Authors
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

import { useMemo } from 'react';
import { GenericDatasourceResource, GenericMetadata } from '@perses-dev/core';
import { useDatasourceList } from './datasource-client';
import { useGlobalDatasourceList } from './global-datasource-client';
import { getBasePathName } from './route';

export class HTTPDatasourceAPI implements DatasourceApi {
  /**
   * Helper function for getting a proxy URL from separate input parameters.
   * Give the following output according to the definition or not of the input.
   * - /proxy/globaldatasources/{name}
   * - /proxy/projects/{project}/datasources/{name}
   * - /proxy/projects/{project}/dashboards/{dashboard}/{name}
   *
   * NB: despite the fact it's possible, it is useless to give a dashboard without a project as the url will for sure
   * correspond to nothing.
   * @param name
   * @param dashboard
   * @param project
   */
  buildProxyUrl({ project, dashboard, name }: { project?: string; dashboard?: string; name: string }): string {
    const basePath = getBasePathName();
    let url = `${!project && !dashboard ? 'globaldatasources' : 'datasources'}/${encodeURIComponent(name)}`;
    if (dashboard) {
      url = `dashboards/${encodeURIComponent(dashboard)}/${url}`;
    }
    if (project) {
      url = `projects/${encodeURIComponent(project)}/${url}`;
    }
    return `${basePath}/proxy/${url}`;
  }

  getDatasource(project: string, selector: DatasourceSelector): Promise<DatasourceResource | undefined> {
    return fetchDatasourceList(project, selector.kind, selector.name ? undefined : true, selector.name).then((list) => {
      // hopefully it should return at most one element
      return list[0];
    });
  }

  getGlobalDatasource(selector: DatasourceSelector): Promise<GlobalDatasourceResource | undefined> {
    return fetchGlobalDatasourceList(selector.kind, selector.name ? undefined : true, selector.name).then((list) => {
      // hopefully it should return at most one element
      return list[0];
    });
  }

  listDatasources(project: string, pluginKind?: string): Promise<DatasourceResource[]> {
    return fetchDatasourceList(project, pluginKind);
  }

  listGlobalDatasources(pluginKind?: string): Promise<GlobalDatasourceResource[]> {
    return fetchGlobalDatasourceList(pluginKind);
  }
}

interface ProxyBuilderParam {
  project?: string;
  dashboard?: string;
  name: string;
}

export const buildProxyUrl = ({ project, dashboard, name }: ProxyBuilderParam): string => {
  const basePath = getBasePathName();
  let url = `${!project && !dashboard ? 'globaldatasources' : 'datasources'}/${encodeURIComponent(name)}`;
  if (dashboard) {
    url = `dashboards/${encodeURIComponent(dashboard)}/${url}`;
  }

  setDatasources(list: DatasourceResource[]): void {
    for (const dts of list) {
      this.setDatasource(dts);
    }
  }

  setDatasource(dts: DatasourceResource): void {
    const kind = dts.spec.plugin.kind;
    const project = dts.metadata.project;
    if (dts.spec.default) {
      // in case it's the default datasource for the given kind, we store it twice
      // because we might get the datasource with the name or because we want the default one.
      this.datasources.set(this.generateKey({ kind: kind }, project), dts);
    }
    this.datasources.set(this.generateKey({ kind: kind, name: dts.metadata.name }, project), dts);
  }

  setUndefinedDatasource(project: string, selector: DatasourceSelector): void {
    this.emptyDatasources.set(this.generateKey(selector, project), true);
  }

  getDatasource(
    project: string,
    selector: DatasourceSelector
  ): {
    resource: DatasourceResource | undefined;
    keyExist: boolean;
  } {
    const key = this.generateKey(selector, project);
    const resource = this.datasources.get(this.generateKey(selector, project));
    let keyExists = true;
    if (resource === undefined) {
      keyExists = this.emptyDatasources.has(key);
    }
    return { resource: resource, keyExist: keyExists };
  }

  setGlobalDatasources(list: GlobalDatasourceResource[]): void {
    for (const dts of list) {
      this.setGlobalDatasource(dts);
    }
  }

  setGlobalDatasource(dts: GlobalDatasourceResource): void {
    const kind = dts.spec.plugin.kind;
    if (dts.spec.default) {
      // in case it's the default datasource for the given kind, we store it twice
      // because we might get the datasource with the name or because we want the default one.
      this.globalDatasources.set(this.generateKey({ kind: kind }), dts);
    }
    this.globalDatasources.set(this.generateKey({ kind: kind, name: dts.metadata.name }), dts);
  }

  setUndefinedGlobalDatasource(selector: DatasourceSelector): void {
    this.emptyDatasources.set(this.generateKey(selector), true);
  }

  getGlobalDatasource(selector: DatasourceSelector): {
    resource: GlobalDatasourceResource | undefined;
    keyExist: boolean;
  } {
    const key = this.generateKey(selector);
    const resource = this.globalDatasources.get(this.generateKey(selector));
    let keyExists = true;
    if (resource === undefined) {
      keyExists = this.emptyDatasources.has(key);
    }
    return { resource: resource, keyExist: keyExists };
  }

  private generateKey(selector: DatasourceSelector, project?: string): string {
    let key = selector.kind;
    if (selector.name !== undefined) {
      key += `-${selector.name}`;
    }
    if (project !== undefined) {
      key += `-${project}`;
    }
    return key;
  }
  return `${basePath}/proxy/${url}`;
};

//TODO: Move to tanstack query for caching
export class CachedDatasourceAPI implements DatasourceApi {
  private readonly client: DatasourceApi;
  private readonly cache: Cache;
  public buildProxyUrl?: BuildDatasourceProxyUrlFunc;

  constructor(client: DatasourceApi) {
    this.client = client;
    this.cache = new Cache();
    this.buildProxyUrl = this.client.buildProxyUrl;
  }

  const allDatasources = useMemo(() => {
    if (isDatasourceLoading || isGlobalDatasourceLoading) return [];
    return [
      ...globalDatasources.map<GenericDatasourceResource>((gds) => ({
        ...(gds as GenericDatasourceResource),
        spec: { ...gds.spec, proxyUrl: buildProxyUrl({ name: gds.metadata.name }) },
      })),
      ...datasources.map<GenericDatasourceResource>((ds) => ({
        ...ds,
        spec: { ...ds.spec, proxyUrl: buildProxyUrl({ name: ds.metadata.name, project: ds.metadata.project }) },
        metadata: {
          ...ds.metadata,
          project: ds.metadata.project,
        } as unknown as GenericMetadata,
      })),
    ];
  }, [datasources, globalDatasources, isDatasourceLoading, isGlobalDatasourceLoading]);

  getGlobalDatasource(selector: DatasourceSelector): Promise<GlobalDatasourceResource | undefined> {
    const { resource, keyExist } = this.cache.getGlobalDatasource(selector);
    if (resource) {
      return Promise.resolve(resource);
    }
    if (keyExist) {
      return Promise.resolve(undefined);
    }
    return this.client.getGlobalDatasource(selector).then((result?: GlobalDatasourceResource) => {
      if (result === undefined) {
        this.cache.setUndefinedGlobalDatasource(selector);
      } else {
        this.cache.setGlobalDatasource(result);
      }
      return result;
    });
  }

  listDatasources(project: string, pluginKind?: string): Promise<DatasourceResource[]> {
    return this.client.listDatasources(project, pluginKind).then((list: DatasourceResource[]) => {
      this.cache.setDatasources(list);
      return list;
    });
  }

  listGlobalDatasources(pluginKind?: string): Promise<GlobalDatasourceResource[]> {
    return this.client.listGlobalDatasources(pluginKind).then((list: GlobalDatasourceResource[]) => {
      this.cache.setGlobalDatasources(list);
      return list;
    });
  }
}
