import { booleanInput } from './angular-input.util';

describe('Angular Input Utils', () => {

  it('should deal with boolean input(e.g.: use it like that <my-tag myBooleanAttr></my-tag>)', () => {
    expect(booleanInput('')).toBeTrue();
    expect(booleanInput('tataouine')).toBeTrue();
    expect(booleanInput('false')).toBeFalse();
    expect(booleanInput(true)).toBeTrue();
    expect(booleanInput(false)).toBeFalse();
  });
});
