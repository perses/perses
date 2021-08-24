import { useEffect, useState } from 'react';

interface SampleDataModule<T> {
  default: T;
}

export function useSampleData<T>(name: string) {
  const [data, setData] = useState<T>();
  useEffect(() => {
    async function loadData() {
      const js: SampleDataModule<T> = await import(`../../sample-data/${name}`);
      setData(js.default);
    }
    loadData();
  }, [name]);
  return data;
}
