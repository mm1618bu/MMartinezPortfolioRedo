import { defineConfig } from 'vite';
import pugPlugin from 'vite-plugin-pug';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

const locals = {
  title: 'LeetcodeClone'
};

export default defineConfig({
  plugins: [
    pugPlugin(locals),
    monacoEditorPlugin({
      languages: ['javascript']
    })
  ]
});
