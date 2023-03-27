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

import { Datasource, DatasourceSelector, GlobalDatasource } from '@perses-dev/core';
import { DatasourceApi } from '@perses-dev/dashboards';
import LRUCache from 'lru-cache';
import { fetchDatasourceList, fetchGlobalDatasourceList } from './datasource-client';

export class HTTPDatasourceAPI implements DatasourceApi {
  getDatasource(
    project: string,
    selector: DatasourceSelector
  ): Promise<{ resource: Datasource; proxyUrl: string } | undefined> {
    return fetchDatasourceList(project, selector.kind, selector.name ? undefined : true, selector.name).then((list) => {
      // hopefully it should return at most one element
      if (list[0] !== undefined) {
        return {
          resource: list[0],
          proxyUrl: getProxyUrl(list[0]),
        };
      }
    });
  }

  getGlobalDatasource(
    selector: DatasourceSelector
  ): Promise<{ resource: GlobalDatasource; proxyUrl: string } | undefined> {
    return fetchGlobalDatasourceList(selector.kind, selector.name ? undefined : true, selector.name).then((list) => {
      // hopefully it should return at most one element
      if (list[0] !== undefined) {
        return {
          resource: list[0],
          proxyUrl: getProxyUrl(list[0]),
        };
      }
    });
  }

  listDatasources(project: string, pluginKind: string | undefined): Promise<Datasource[]> {
    return fetchDatasourceList(project, pluginKind);
  }

  listGlobalDatasources(pluginKind: string | undefined): Promise<GlobalDatasource[]> {
    return fetchGlobalDatasourceList(pluginKind);
  }
}

class Cache {
  private datasources: LRUCache<string, Datasource>;
  private emptyDatasources: LRUCache<string, boolean>;
  private globalDatasources: LRUCache<string, GlobalDatasource>;

  constructor() {
    const option = { ttl: 5 * 60 * 1000, ttlAutopurge: true };
    this.globalDatasources = new LRUCache<string, GlobalDatasource>(option);
    this.datasources = new LRUCache<string, Datasource>(option);
    this.emptyDatasources = new LRUCache<string, boolean>(option);
  }

  setDatasources(list: Datasource[]) {
    for (const dts of list) {
      this.setDatasource(dts);
    }
  }

  setDatasource(dts: Datasource) {
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
    let keyExist = true;
    if (resource === undefined) {
      keyExist = this.emptyDatasources.has(key);
    }
    return { resource: resource, keyExist: keyExist };
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
    let keyExist = true;
    if (resource === undefined) {
      keyExist = this.emptyDatasources.has(key);
    }
    return { resource: resource, keyExist: keyExist };
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

export class CachedDatasourceAPI implements DatasourceApi {
  private readonly client: DatasourceApi;
  private readonly cache: Cache;

  constructor(client: DatasourceApi) {
    this.client = client;
    this.cache = new Cache();
  }

  getDatasource(
    project: string,
    selector: DatasourceSelector
  ): Promise<{ resource: Datasource; proxyUrl: string } | undefined> {
    const { resource, keyExist } = this.cache.getDatasource(project, selector);
    if (resource) {
      return Promise.resolve({ resource: resource, proxyUrl: getProxyUrl(resource) });
    }
    if (keyExist) {
      // in case the keyExist, than mean we already did the query, but the datasource doesn't exist. So we can safely return an undefined Promise.
      return Promise.resolve(undefined);
    }
    return this.client.getDatasource(project, selector).then((result) => {
      if (result === undefined) {
        // in case the result is undefined, we should then notify that the datasource doesn't exist for the given selector.
        // Like that, next time another panel ask for the exact same datasource (with the same selector), then we won't query the server to try it again.
        // It's ok to do it as the cache has an expiration of 5min.
        // We have the same logic for the globalDatasources.
        this.cache.setUndefinedDatasource(project, selector);
      } else {
        this.cache.setDatasource(result.resource);
      }
      return result;
    });
  }

  getGlobalDatasource(
    selector: DatasourceSelector
  ): Promise<{ resource: GlobalDatasource; proxyUrl: string } | undefined> {
    const { resource, keyExist } = this.cache.getGlobalDatasource(selector);
    if (resource) {
      return Promise.resolve({ resource: resource, proxyUrl: getProxyUrl(resource) });
    }
    if (keyExist) {
      return Promise.resolve(undefined);
    }
    return this.client.getGlobalDatasource(selector).then((result) => {
      if (result === undefined) {
        this.cache.setUndefinedGlobalDatasource(selector);
      } else {
        this.cache.setGlobalDatasource(result.resource);
      }
      return result;
    });
  }

  listDatasources(project: string, pluginKind: string | undefined): Promise<Datasource[]> {
    return this.client.listDatasources(project, pluginKind).then((list) => {
      this.cache.setDatasources(list);
      return list;
    });
  }

  listGlobalDatasources(pluginKind: string | undefined): Promise<GlobalDatasource[]> {
    return this.client.listGlobalDatasources(pluginKind).then((list) => {
      this.cache.setGlobalDatasources(list);
      return list;
    });
  }
}

// Helper function for getting a proxy URL from a datasource or global datasource
function getProxyUrl(datasource: Datasource | GlobalDatasource) {
  let url = `/proxy`;
  if (datasource.kind === 'Datasource') {
    url += `/projects/${encodeURIComponent(datasource.metadata.project)}`;
  }
  url += `/${datasource.kind.toLowerCase()}s/${encodeURIComponent(datasource.metadata.name)}`;
  return url;
}
