export type AstAny =
  | AstNull
  | AstBool
  | AstNumber
  | AstString
  | AstConstant
  | AstArray
  | AstObject
  | AstNamedObject
  | AstRef;

export type AstNull = null;
export type AstBool = boolean;
export type AstNumber = number;
export type AstString = string;
export type AstObject = { [key: string]: AstAny };

// extend
export type AstRef = [type: 0, index: number];
export type AstConstant =
  | [type: 1] /* undefined */
  | [type: 2] /* NaN */
  | [type: 3] /* Infinity */
  | [type: 4] /* -Infinity */
  | [type: 5]; /* -0 */
export type AstArray = [items: AstAny[]];
export type AstNamedObject = [name: string, ...values: AstAny[]];
