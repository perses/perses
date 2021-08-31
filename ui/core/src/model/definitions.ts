/**
 * Json config object.
 */
export interface JsonObject {
  [key: string]: Json | undefined;
}

/**
 * Json definition values.
 */
export type Json = string | number | boolean | null | JsonObject | Json[];

/**
 * Base type for definitions in JSON config resources.
 */
export interface Definition<Kind extends string, Options extends JsonObject>
  extends JsonObject {
  kind: Kind;
  options: Options;
}
