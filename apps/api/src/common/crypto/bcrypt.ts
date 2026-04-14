type BcryptModule = typeof import('bcryptjs');

let bcrypt: BcryptModule;

try {
  // Vercel can run the compiled entrypoint from /apps/api/src.
  // prettier-ignore
  bcrypt = require('../../../node_modules/bcryptjs/umd/index.js') as BcryptModule; // eslint-disable-line @typescript-eslint/no-require-imports
} catch {
  // Nest start:prod resolves from /apps/api/dist/src.
  // prettier-ignore
  bcrypt = require('../../../../node_modules/bcryptjs/umd/index.js') as BcryptModule; // eslint-disable-line @typescript-eslint/no-require-imports
}

export const compareSync = bcrypt.compareSync;
export const hashSync = bcrypt.hashSync;
