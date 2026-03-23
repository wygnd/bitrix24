import fs from 'node:fs';

export const base64Encode = (file: string) => {
  return fs.readFileSync(file, { encoding: 'base64' });
};
