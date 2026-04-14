type BcryptModule = {
  compareSync: (password: string, hash: string) => boolean;
  hashSync: (password: string, saltOrRounds: string | number) => string;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('../vendor/bcryptjs-vendor') as BcryptModule;

export const compareSync = bcrypt.compareSync;
export const hashSync = bcrypt.hashSync;
