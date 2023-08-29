import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'ryans-components',
  outputTargets: [
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-custom-elements',
    },
    {
      type: 'docs-readme',
    }
  ],
};
