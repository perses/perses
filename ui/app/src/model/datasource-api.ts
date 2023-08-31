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

import { ProjectDatasource, DatasourceSelector, GlobalDatasource } from '@perses-dev/core';
import { BuildDatasourceProxyUrlFunc, DatasourceApi } from '@perses-dev/dashboards';
import LRUCache from 'lru-cache';
import { fetchDatasourceList } from './datasource-client';
import { fetchGlobalDatasourceList } from './global-datasource-client';

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
    let url = `${!project && !dashboard ? 'globaldatasources' : 'datasources'}/${encodeURIComponent(name)}`;
    if (dashboard) {
      url = `dashboards/${encodeURIComponent(dashboard)}/${url}`;
    }
    if (project) {
      url = `projects/${encodeURIComponent(project)}/${url}`;
    }
    return `/proxy/${url}`;
  }

  getDatasource(project: string, selector: DatasourceSelector): Promise<ProjectDatasource | undefined> {
    return fetchDatasourceList(project, selector.kind, selector.name ? undefined : true, selector.name).then((list) => {
      // hopefully it should return at most one element
      return list[0];
    });
  }

  getGlobalDatasource(selector: DatasourceSelector): Promise<GlobalDatasource | undefined> {
    return fetchGlobalDatasourceList(selector.kind, selector.name ? undefined : true, selector.name).then((list) => {
      // hopefully it should return at most one element
      return list[0];
    });
  }

  listDatasources(project: string, pluginKind?: string): Promise<ProjectDatasource[]> {
    return fetchDatasourceList(project, pluginKind);
  }

  listGlobalDatasources(pluginKind?: string): Promise<GlobalDatasource[]> {
    return fetchGlobalDatasourceList(pluginKind);
  }
}

class Cache {
  private datasources: LRUCache<string, ProjectDatasource>;
  private emptyDatasources: LRUCache<string, boolean>;
  private globalDatasources: LRUCache<string, GlobalDatasource>;

  constructor() {
    // We want to have a cache expiration set to 5min and removed automatically the old values.
    // The option below is setting that.
    // Note: TTL (Time To Leave) is in millisecond.
    const option = { ttl: 5 * 60 * 1000, ttlAutopurge: true };
    this.globalDatasources = new LRUCache<string, GlobalDatasource>(option);
    this.datasources = new LRUCache<string, ProjectDatasource>(option);
    this.emptyDatasources = new LRUCache<string, boolean>(option);
  }

  setDatasources(list: ProjectDatasource[]) {
    for (const dts of list) {
      this.setDatasource(dts);
    }
  }

  setDatasource(dts: ProjectDatasource) {
    const kind = dts.spec.plugin.kind;
    const project = dts.metadata.project;
    if (dts.spec.default) {
      // in case it's the default datasource for the given kind, we store it twice
      // because we might get the datasource with the name or because we want the default one.
      this.datasources.set(this.generateKey({ kind: kind }, project), dts);
    }
    this.datasources.set(this.generateKey({ kind: kind, name: dts.metadata.name }, project), dts);
  }

  setUndefinedDatasource(project: string, selector: DatasourceSelector) {
    this.emptyDatasources.set(this.generateKey(selector, project), true);
  }

  getDatasource(project: string, selector: DatasourceSelector) {
    const key = this.generateKey(selector, project);
    const resource = this.datasources.get(this.generateKey(selector, project));
    let keyExists = true;
    if (resource === undefined) {
      keyExists = this.emptyDatasources.has(key);
    }
    return { resource: resource, keyExist: keyExists };
  }

  setGlobalDatasources(list: GlobalDatasource[]) {
    for (const dts of list) {
      this.setGlobalDatasource(dts);
    }
  }

  setGlobalDatasource(dts: GlobalDatasource) {
    const kind = dts.spec.plugin.kind;
    if (dts.spec.default) {
      // in case it's the default datasource for the given kind, we store it twice
      // because we might get the datasource with the name or because we want the default one.
      this.globalDatasources.set(this.generateKey({ kind: kind }), dts);
    }
    this.globalDatasources.set(this.generateKey({ kind: kind, name: dts.metadata.name }), dts);
  }

  setUndefinedGlobalDatasource(selector: DatasourceSelector) {
    this.emptyDatasources.set(this.generateKey(selector), true);
  }

  getGlobalDatasource(selector: DatasourceSelector) {
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
}

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

  getDatasource(project: string, selector: DatasourceSelector): Promise<ProjectDatasource | undefined> {
    const { resource, keyExist } = this.cache.getDatasource(project, selector);
    if (resource) {
      return Promise.resolve(resource);
    }
    if (keyExist) {
      // in case the keyExist, then it means we already did the query, but the datasource doesn't exist. So we can safely return an undefined Promise.
      return Promise.resolve(undefined);
    }
    return this.client.getDatasource(project, selector).then((result?: ProjectDatasource) => {
      if (result === undefined) {
        // in case the result is undefined, we should then notify that the datasource doesn't exist for the given selector.
        // Like that, next time another panel ask for the exact same datasource (with the same selector), then we won't query the server to try it again.
        // It's ok to do it as the cache has an expiration of 5min.
        // We have the same logic for the globalDatasources.
        this.cache.setUndefinedDatasource(project, selector);
      } else {
        this.cache.setDatasource(result);
      }
      return result;
    });
  }

  getGlobalDatasource(selector: DatasourceSelector): Promise<GlobalDatasource | undefined> {
    const { resource, keyExist } = this.cache.getGlobalDatasource(selector);
    if (resource) {
      return Promise.resolve(resource);
    }
    if (keyExist) {
      return Promise.resolve(undefined);
    }
    return this.client.getGlobalDatasource(selector).then((result?: GlobalDatasource) => {
      if (result === undefined) {
        this.cache.setUndefinedGlobalDatasource(selector);
      } else {
        this.cache.setGlobalDatasource(result);
      }
      return result;
    });
  }

  listDatasources(project: string, pluginKind?: string): Promise<ProjectDatasource[]> {
    return this.client.listDatasources(project, pluginKind).then((list: ProjectDatasource[]) => {
      this.cache.setDatasources(list);
      return list;
    });
  }

  listGlobalDatasources(pluginKind?: string): Promise<GlobalDatasource[]> {
    return this.client.listGlobalDatasources(pluginKind).then((list: GlobalDatasource[]) => {
      this.cache.setGlobalDatasources(list);
      return list;
    });
  }
}
