import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useDeepMemo } from '@perses-dev/core';

/**
 * Supports filtering content by text on the client
 * @param {Array} data An array to be filtered of type T
 * @param {Array} keys A tuple of the properties to search against
 * @param {string} query A query string
 * @param {Fuse.IFuseOptions} customOptions Custom options to be passed to the Fuse instance
 * @returns {Object} Returns an object with a "filteredData" property that is
 * an array of filtered results of type T
 *
 */
export function useSearchFilter<T>(
  data: T[],
  keys: string[],
  query: string,
  customOptions?: Fuse.IFuseOptions<T>
): {
  filteredData: T[];
} {
  const options = useDeepMemo(() => ({ keys, threshold: 0.5, ...customOptions }), [keys, customOptions]);

  const filteredData = useMemo(() => {
    const fuse = new Fuse(data, options);
    return query ? fuse.search(query).map((i) => i.item) : data;
  }, [data, options, query]);

  return {
    filteredData,
  };
}
