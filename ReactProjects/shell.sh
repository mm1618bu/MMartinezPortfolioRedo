cat <<'EOF' > /workspaces/MMartinezPortfolioRedo/setup_leetcodeclone.sh
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/workspaces/MMartinezPortfolioRedo/LeetcodeClone"

mkdir -p "$APP_DIR/src"

cat <<'JSON' > "$APP_DIR/package.json"
{
  "name": "leetcodeclone",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "monaco-editor": "^0.50.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.10",
    "vite": "^5.4.0",
    "vite-plugin-monaco-editor": "^1.1.0",
    "vite-plugin-pug": "^0.5.0"
  }
}
JSON

cat <<'JS' > "$APP_DIR/vite.config.js"
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
JS

cat <<'JS' > "$APP_DIR/postcss.config.js"
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
JS

cat <<'JS' > "$APP_DIR/tailwind.config.js"
export default {
  content: [
    './index.pug',
    './src/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0b0f1a',
        haze: '#f7f3ea',
        tide: '#2f6f6e',
        ember: '#ff6b4a',
        slate: '#1b2433'
      },
      boxShadow: {
        glow: '0 10px 30px rgba(47, 111, 110, 0.35)'
      }
    }
  },
  plugins: []
};
JS

cat <<'PUG' > "$APP_DIR/index.pug"
doctype html
html(lang="en")
  head
    meta(charset="UTF-8")
    meta(name="viewport" content="width=device-width, initial-scale=1.0")
    title= title
    link(rel="stylesheet" href="/src/styles.css")
  body
    #app.min-h-screen.bg-ink.text-haze
      header.mx-auto.max-w-7xl.px-6.py-8.flex.items-center.justify-between
        .space-y-1
          h1.text-3xl.font-bold.tracking-tight LeetcodeClone
          p.text-sm.text-haze/70 Practice, compile, and iterate.
        .flex.items-center.gap-3
          button#runBtn.rounded-full.bg-ember.px-5.py-2.text-ink.font-semibold.shadow-glow Run
          span#status.text-xs.tracking-widest.uppercase.text-haze/70 Idle

      main.mx-auto.max-w-7xl.px-6.pb-10.grid.grid-cols-1.lg:grid-cols-[240px_1fr_320px].gap-6
        aside.rounded-2xl.bg-slate.p-4.space-y-4
          h2.text-sm.font-semibold.uppercase.tracking-wider.text-haze/70 Problems
          ul.space-y-3.text-sm
            li.flex.items-center.justify-between
              span Two Sum
              span.text-emerald-300 Easy
            li.flex.items-center.justify-between
              span Valid Parentheses
              span.text-amber-300 Medium
            li.flex.items-center.justify-between
              span Merge Intervals
              span.text-rose-300 Hard
          .pt-4.text-xs.text-haze/60
            | Switch tasks to load prompts.

        section.rounded-2xl.bg-slate.p-4.flex.flex-col.gap-4
          .flex.items-center.justify-between
            h2.text-sm.font-semibold.uppercase.tracking-wider.text-haze/70 Editor
            span.text-xs.text-haze/60 Language: JavaScript
          #editor.h-[420px].rounded-xl.overflow-hidden.border.border-haze/10

          .rounded-xl.bg-ink/60.p-4.border.border-haze/10
            h3.text-xs.font-semibold.uppercase.tracking-widest.text-haze/70 Console
            pre#output.mt-3.text-sm.whitespace-pre-wrap.text-haze/80 Ready.

        aside.rounded-2xl.bg-slate.p-4.space-y-4
          h2.text-sm.font-semibold.uppercase.tracking-wider.text-haze/70 Details
          p.text-sm.text-haze/80
            | Given an array of integers, return indices of the two numbers such that they add up to target.
          .rounded-xl.bg-ink/60.p-4.border.border-haze/10
            h3.text-xs.font-semibold.uppercase.tracking-widest.text-haze/70 Progress
            ul.mt-3.space-y-2.text-sm
              li.flex.items-center.justify-between
                span Tests
                span.text-emerald-300 0 / 4
              li.flex.items-center.justify-between
                span Runtime
                span.text-haze/70 --
              li.flex.items-center.justify-between
                span Memory
                span.text-haze/70 --
    script(type="module" src="/src/main.js")
PUG

cat <<'CSS' > "$APP_DIR/src/styles.css"
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: "Space Grotesk", system-ui, sans-serif;
}

body {
  margin: 0;
  background: radial-gradient(circle at top left, rgba(47, 111, 110, 0.4), transparent 45%),
              radial-gradient(circle at top right, rgba(255, 107, 74, 0.25), transparent 35%),
              #0b0f1a;
}

#editor {
  min-height: 420px;
}
CSS

cat <<'JS' > "$APP_DIR/src/main.js"
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const editorContainer = document.getElementById('editor');
const output = document.getElementById('output');
const status = document.getElementById('status');
const runBtn = document.getElementById('runBtn');

const starterCode = `/**
 * Two Sum
 * Return indices of the two numbers such that they add up to target.
 */
function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i += 1) {
    const diff = target - nums[i];

    if (seen.has(diff)) {
      return [seen.get(diff), i];
    }

    seen.set(nums[i], i);
  }

  return [];
}

console.log(twoSum([2, 7, 11, 15], 9));
`;

const editor = monaco.editor.create(editorContainer, {
  value: starterCode,
  language: 'javascript',
  theme: 'vs-dark',
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true
});

runBtn.addEventListener('click', () => {
  status.textContent = 'Running';
  output.textContent = 'Simulated run...\nResult: [0, 1]\nAll tests passed.';
  setTimeout(() => {
    status.textContent = 'Idle';
  }, 600);
});

window.addEventListener('resize', () => {
  editor.layout();
});
JS

echo "Created LeetcodeClone scaffold at $APP_DIR"
EOF
chmod +x /workspaces/MMartinezPortfolioRedo/setup_leetcodeclone.sh