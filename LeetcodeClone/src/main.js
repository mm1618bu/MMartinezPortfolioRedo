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
