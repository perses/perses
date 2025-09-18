// Copyright 2024 The Perses Authors
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

import {
  MOCK_VALID_PLUGIN_METADATA,
  MOCK_VALID_PLUGIN_MODULE_RESOURCE,
  MOCK_INVALID_PLUGIN_MODULE,
  MOCK_MIXED_VALIDITY_PLUGIN_MODULES,
  MOCK_REMOTE_PLUGIN_MODULE,
  MOCK_MULTI_PLUGIN_MODULE,
  MOCK_PARTIAL_FAILURE_MODULE,
  MOCK_EMPTY_PLUGIN_MODULE,
} from '../test/mock-data';
import { remotePluginLoader } from './remotePluginLoader';
import { loadPlugin } from './PluginRuntime';

// Mock the loadPlugin function
jest.mock('./PluginRuntime', () => ({
  loadPlugin: jest.fn(),
}));

const mockLoadPlugin = loadPlugin as jest.MockedFunction<typeof loadPlugin>;

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock console.error to spy on error logging
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('remotePluginLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('getInstalledPlugins', () => {
    it('should fetch plugins from correct endpoint without baseURL', async () => {
      const mockResponse = { json: jest.fn().mockResolvedValue([MOCK_VALID_PLUGIN_MODULE_RESOURCE]) };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const loader = remotePluginLoader();
      await loader.getInstalledPlugins();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/plugins');
    });

    it('should fetch plugins from correct endpoint with baseURL', async () => {
      const baseURL = 'https://example.com';
      const mockResponse = { json: jest.fn().mockResolvedValue([MOCK_VALID_PLUGIN_MODULE_RESOURCE]) };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const loader = remotePluginLoader(baseURL);
      await loader.getInstalledPlugins();

      expect(mockFetch).toHaveBeenCalledWith(`${baseURL}/api/v1/plugins`);
    });

    it('should return valid plugin modules when fetch succeeds', async () => {
      const mockResponse = { json: jest.fn().mockResolvedValue([MOCK_VALID_PLUGIN_MODULE_RESOURCE]) };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const loader = remotePluginLoader();
      const result = await loader.getInstalledPlugins();

      expect(result).toEqual([MOCK_VALID_PLUGIN_MODULE_RESOURCE]);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should filter out invalid plugin modules and return only valid ones', async () => {
      const mockResponse = { json: jest.fn().mockResolvedValue(MOCK_MIXED_VALIDITY_PLUGIN_MODULES) };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const loader = remotePluginLoader();
      const result = await loader.getInstalledPlugins();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(MOCK_VALID_PLUGIN_MODULE_RESOURCE);
      expect(result[1]?.metadata.name).toBe('another-valid-module');
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should log error and return empty array when response is not an array', async () => {
      const mockResponse = { json: jest.fn().mockResolvedValue({ invalid: 'response' }) };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const loader = remotePluginLoader();
      const result = await loader.getInstalledPlugins();

      expect(result).toEqual([]);
      expect(mockConsoleError).toHaveBeenCalledWith(
        'RemotePluginLoader: Error loading plugins, response is not an array'
      );
    });

    it('should log error when no valid plugins are found', async () => {
      const mockResponse = { json: jest.fn().mockResolvedValue([MOCK_INVALID_PLUGIN_MODULE]) };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const loader = remotePluginLoader();
      const result = await loader.getInstalledPlugins();

      expect(result).toEqual([]);
      expect(mockConsoleError).toHaveBeenCalledWith('RemotePluginLoader: No valid plugins found');
    });

    it('should return empty array for empty response array', async () => {
      const mockResponse = { json: jest.fn().mockResolvedValue([]) };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const loader = remotePluginLoader();
      const result = await loader.getInstalledPlugins();

      expect(result).toEqual([]);
      expect(mockConsoleError).toHaveBeenCalledWith('RemotePluginLoader: No valid plugins found');
    });
  });

  describe('importPluginModule', () => {
    it('should successfully import all plugins in a module', async () => {
      mockLoadPlugin.mockResolvedValue(MOCK_REMOTE_PLUGIN_MODULE);

      const loader = remotePluginLoader();
      const result = await loader.importPluginModule(MOCK_VALID_PLUGIN_MODULE_RESOURCE);

      expect(mockLoadPlugin).toHaveBeenCalledWith('test-module', 'testPlugin', undefined);
      expect(result).toEqual(MOCK_REMOTE_PLUGIN_MODULE);
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should pass baseURL to loadPlugin when provided', async () => {
      const baseURL = 'https://example.com';
      mockLoadPlugin.mockResolvedValue(MOCK_REMOTE_PLUGIN_MODULE);

      const loader = remotePluginLoader(baseURL);
      const result = await loader.importPluginModule(MOCK_VALID_PLUGIN_MODULE_RESOURCE);

      expect(mockLoadPlugin).toHaveBeenCalledWith('test-module', 'testPlugin', baseURL);
      expect(result).toEqual(MOCK_REMOTE_PLUGIN_MODULE);
    });

    it('should handle different baseURL formats', async () => {
      const testCases = [
        { baseURL: 'https://example.com', expected: 'https://example.com/api/v1/plugins' },
        { baseURL: 'https://example.com/', expected: 'https://example.com//api/v1/plugins' },
        { baseURL: 'http://localhost:3000', expected: 'http://localhost:3000/api/v1/plugins' },
        { baseURL: '', expected: '/api/v1/plugins' },
      ];

      for (const testCase of testCases) {
        const mockResponse = { json: jest.fn().mockResolvedValue([]) };
        mockFetch.mockResolvedValue(mockResponse as unknown as Response);

        const loader = remotePluginLoader(testCase.baseURL || undefined);
        await loader.getInstalledPlugins();

        expect(mockFetch).toHaveBeenCalledWith(testCase.expected);
        mockFetch.mockClear();
      }
    });

    it('should handle multiple plugins in a module', async () => {
      const multiPluginModule = MOCK_MULTI_PLUGIN_MODULE;

      const mockPlugin1Module = { plugin1: { component: (): null => null } };
      const mockPlugin2Module = { plugin2: { component: (): null => null } };

      mockLoadPlugin.mockResolvedValueOnce(mockPlugin1Module).mockResolvedValueOnce(mockPlugin2Module);

      const loader = remotePluginLoader();
      const result = await loader.importPluginModule(multiPluginModule);

      expect(mockLoadPlugin).toHaveBeenCalledTimes(2);
      expect(mockLoadPlugin).toHaveBeenNthCalledWith(1, 'multi-plugin-module', 'plugin1', undefined);
      expect(mockLoadPlugin).toHaveBeenNthCalledWith(2, 'multi-plugin-module', 'plugin2', undefined);
      expect(result).toEqual({
        plugin1: { component: expect.any(Function) },
        plugin2: { component: expect.any(Function) },
      });
    });

    it('should handle partial failures and log errors for failed plugins', async () => {
      const multiPluginModule = MOCK_PARTIAL_FAILURE_MODULE;

      const mockWorkingPlugin = { workingPlugin: { component: (): null => null } };

      mockLoadPlugin.mockResolvedValueOnce(mockWorkingPlugin).mockResolvedValueOnce(null); // Simulate failure

      const loader = remotePluginLoader();
      const result = await loader.importPluginModule(multiPluginModule);

      expect(result).toEqual({
        workingPlugin: { component: expect.any(Function) },
      });
      expect(mockConsoleError).toHaveBeenCalledWith('RemotePluginLoader: Error loading plugin failingPlugin');
    });

    it('should handle loadPlugin returning undefined', async () => {
      mockLoadPlugin.mockResolvedValue(null);

      const loader = remotePluginLoader();
      const result = await loader.importPluginModule(MOCK_VALID_PLUGIN_MODULE_RESOURCE);

      expect(result).toEqual({});
      expect(mockConsoleError).toHaveBeenCalledWith('RemotePluginLoader: Error loading plugin testPlugin');
    });

    it('should handle loadPlugin returning module without expected plugin', async () => {
      mockLoadPlugin.mockResolvedValue({ differentPlugin: { component: (): null => null } });

      const loader = remotePluginLoader();
      const result = await loader.importPluginModule(MOCK_VALID_PLUGIN_MODULE_RESOURCE);

      expect(result).toEqual({});
      expect(mockConsoleError).toHaveBeenCalledWith('RemotePluginLoader: Error loading plugin testPlugin');
    });

    it('should handle loadPlugin throwing an error', async () => {
      mockLoadPlugin.mockRejectedValue(new Error('Plugin load error'));

      const loader = remotePluginLoader();

      await expect(loader.importPluginModule(MOCK_VALID_PLUGIN_MODULE_RESOURCE)).rejects.toThrow('Plugin load error');
    });

    it('should return empty object for module with no plugins', async () => {
      const emptyPluginModule = MOCK_EMPTY_PLUGIN_MODULE;

      const loader = remotePluginLoader();
      const result = await loader.importPluginModule(emptyPluginModule);

      expect(result).toEqual({});
      expect(mockLoadPlugin).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const loader = remotePluginLoader();

      await expect(loader.getInstalledPlugins()).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      const mockResponse = { json: jest.fn().mockRejectedValue(new Error('Invalid JSON')) };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const loader = remotePluginLoader();

      await expect(loader.getInstalledPlugins()).rejects.toThrow('Invalid JSON');
    });

    it('should handle fetch returning non-Response object', async () => {
      mockFetch.mockResolvedValue(null as unknown as Response);

      const loader = remotePluginLoader();

      await expect(loader.getInstalledPlugins()).rejects.toThrow();
    });

    it('should handle mixed valid and invalid plugins gracefully', async () => {
      const mixedResponse = [
        MOCK_VALID_PLUGIN_MODULE_RESOURCE,
        null,
        undefined,
        { invalid: 'object' },
        {
          kind: 'PluginModule',
          metadata: { name: 'partial-module', version: '1.0.0' },
          spec: { plugins: [MOCK_VALID_PLUGIN_METADATA, { invalid: 'plugin' }] },
        },
      ];

      const mockResponse = { json: jest.fn().mockResolvedValue(mixedResponse) };
      mockFetch.mockResolvedValue(mockResponse as unknown as Response);

      const loader = remotePluginLoader();
      const result = await loader.getInstalledPlugins();

      // Should get only the valid module (partial-module gets filtered out due to invalid plugin)
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(MOCK_VALID_PLUGIN_MODULE_RESOURCE);
    });
  });
});
