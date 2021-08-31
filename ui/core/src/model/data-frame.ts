// TODO: Revisit whether something like danfo.js is appropriate to use here once
// they've finished their Typescript rewrite (https://danfo.jsdata.org/)
export interface DataFrame {
  name: string;
  columns: Series[];
}

type SeriesMap = {
  Date: UnixTimeMs;
  String: string;
  Number: number;
};

export type UnixTimeMs = number;

export type SeriesType = keyof SeriesMap;

export interface Series<T extends SeriesType = SeriesType> {
  seriesType: T;
  name: string;
  values: Array<SeriesMap[T]>;
}
