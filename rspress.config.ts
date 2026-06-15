import { defineConfig } from '@rspress/core';
import mermaid from 'rspress-plugin-mermaid';

export default defineConfig({
  root: 'docs',
  base: '/foreman-iop-handbook/',
  themeConfig: {
    editLink: {
      docRepoBaseUrl: 'https://github.com/vkrizan/foreman-iop-handbook/tree/main/docs',
    },
  },
  plugins: [mermaid()],
});

