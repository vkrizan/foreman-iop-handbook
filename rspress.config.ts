import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: 'docs',
  base: '/foreman-iop-handbook/',
  themeConfig: {
    editLink: {
      docRepoBaseUrl: 'https://github.com/vkrizan/foreman-iop-handbook/tree/main/docs',
    },
  },
});

