// Browser stub — tar is a Node.js-only package used by e2b for local CLI ops.
// It is never called in browser mode; this stub silences the node:stream error.
export default {};
export const create = () => { throw new Error('tar: not available in browser') };
export const extract = () => { throw new Error('tar: not available in browser') };
export const list = () => { throw new Error('tar: not available in browser') };
