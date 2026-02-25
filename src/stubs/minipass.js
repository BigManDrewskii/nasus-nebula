// Browser stub — minipass depends on node:stream which is not available in browsers.
// e2b uses it transitively through tar; it is never called in browser mode.
export default {};
export class Minipass {
  constructor() { throw new Error('Minipass: not available in browser') }
}
