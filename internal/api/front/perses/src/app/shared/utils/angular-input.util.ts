/**
 * To be used in the @Input setters when we want to deal with boolean attributes in a robust way.
 *
 * Examples of usage:
 * ## Definition
 * ```ts
 * ...
 * private _myAttr: boolean = false;
 * @Input()
 * set myAttr(value: boolean | string): boolean {
 *   this._myAttr = booleanInput(value);
 * }
 * get myAttr(): boolean {
 *   return this._myAttr;
 * }
 * ```
 *
 * ## Usage
 * ```html
 * <my-tag myAttr></my-tag>
 * <my-tag [myAttr]="false"></my-tag>
 * <my-tag myAttr="false"></my-tag>
 * ```
 */
export function booleanInput(value: boolean | string): boolean {
  if (typeof value === 'string') {
    return value !== 'false';
  } else {
    return value;
  }
}
