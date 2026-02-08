import { defineConfig } from 'vite';
import pugPlugin from 'vite-plugin-pug';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

const locals = {
  title: 'LeetcodeClone'
};

const monacoPlugin = monacoEditorPlugin.default ?? monacoEditorPlugin;

export default defineConfig({
  plugins: [
    pugPlugin(locals),
    monacoPlugin({
      languages: ['javascript']
    })
  ]
});