import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const editorContainer = document.getElementById('editor');
const outputPanel = document.getElementById('outputPanel');
const outputState = document.getElementById('outputState');
const outputContent = document.getElementById('outputContent');
const testResultsContainer = document.getElementById('testResultsContainer');
const executionTime = document.getElementById('executionTime');
const clearOutputBtn = document.getElementById('clearOutputBtn');
const runCodeBtn = document.getElementById('runCodeBtn');
const submitCodeBtn = document.getElementById('submitCodeBtn');
const runtimeStats = document.getElementById('runtimeStats');
const closeRuntimeStats = document.getElementById('closeRuntimeStats');
const runtimeValue = document.getElementById('runtimeValue');
const runtimeBar = document.getElementById('runtimeBar');
const runtimeComparison = document.getElementById('runtimeComparison');
const memoryValue = document.getElementById('memoryValue');
const memoryBar = document.getElementById('memoryBar');
const memoryComparison = document.getElementById('memoryComparison');

// Starter code templates for different languages
const starterCodeTemplates = {
  javascript: `/**
 * Two Sum
 * Return indices of the two numbers such that they add up to target.
 * 
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];

    if (seen.has(diff)) {
      return [seen.get(diff), i];
    }

    seen.set(nums[i], i);
  }

  return [];
}

// Test
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
`,
  
  python: `"""
Two Sum
Return indices of the two numbers such that they add up to target.
"""
from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        
        for i, num in enumerate(nums):
            diff = target - num
            
            if diff in seen:
                return [seen[diff], i]
            
            seen[num] = i
        
        return []

# Test
solution = Solution()
print(solution.twoSum([2, 7, 11, 15], 9))  # [0, 1]
`,
  
  typescript: `/**
 * Two Sum
 * Return indices of the two numbers such that they add up to target.
 */
function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];

    if (seen.has(diff)) {
      return [seen.get(diff)!, i];
    }

    seen.set(nums[i], i);
  }

  return [];
}

// Test
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
`,
  
  java: `import java.util.*;

/**
 * Two Sum
 * Return indices of the two numbers such that they add up to target.
 */
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            
            if (seen.containsKey(diff)) {
                return new int[] {seen.get(diff), i};
            }
            
            seen.put(nums[i], i);
        }
        
        return new int[] {};
    }
    
    // Test
    public static void main(String[] args) {
        Solution solution = new Solution();
        int[] result = solution.twoSum(new int[]{2, 7, 11, 15}, 9);
        System.out.println(Arrays.toString(result)); // [0, 1]
    }
}
`,
  
  cpp: `#include <vector>
#include <unordered_map>
#include <iostream>

using namespace std;

/**
 * Two Sum
 * Return indices of the two numbers such that they add up to target.
 */
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        
        for (int i = 0; i < nums.size(); i++) {
            int diff = target - nums[i];
            
            if (seen.find(diff) != seen.end()) {
                return {seen[diff], i};
            }
            
            seen[nums[i]] = i;
        }
        
        return {};
    }
};

// Test
int main() {
    Solution solution;
    vector<int> nums = {2, 7, 11, 15};
    vector<int> result = solution.twoSum(nums, 9);
    
    cout << "[" << result[0] << ", " << result[1] << "]" << endl; // [0, 1]
    return 0;
}
`
};

// Language configuration for Monaco editor
const languageConfig = {
  javascript: 'javascript',
  python: 'python',
  typescript: 'typescript',
  java: 'java',
  cpp: 'cpp'
};

let currentLanguage = 'javascript';

const starterCode = starterCodeTemplates[currentLanguage];

const editor = monaco.editor.create(editorContainer, {
  value: starterCode,
  language: 'javascript',
  theme: 'vs-dark',
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true
});

// Autosave functionality
const autosaveIndicator = document.getElementById('autosaveIndicator');
const autosaveText = autosaveIndicator?.querySelector('.autosave-indicator__text');

let autosaveTimeout = null;
let lastSavedCode = starterCode;
const AUTOSAVE_DELAY = 1000; // 1 second after user stops typing

// Autosave states
const AutosaveState = {
  SAVED: 'saved',
  SAVING: 'saving',
  UNSAVED: 'unsaved',
  ERROR: 'error'
};

// Update autosave indicator
function setAutosaveState(state, message = '') {
  if (!autosaveIndicator) return;
  
  autosaveIndicator.setAttribute('data-state', state);
  
  if (autosaveText) {
    const messages = {
      [AutosaveState.SAVED]: 'All changes saved',
      [AutosaveState.SAVING]: 'Saving...',
      [AutosaveState.UNSAVED]: 'Unsaved changes',
      [AutosaveState.ERROR]: 'Unable to save'
    };
    
    autosaveText.textContent = message || messages[state];
  }
  
  // Update page title to indicate unsaved changes
  updatePageTitle(state);
}

// Update page title based on save state
function updatePageTitle(state) {
  const baseTitle = 'LeetcodeClone - Problem';
  
  if (state === AutosaveState.UNSAVED || state === AutosaveState.ERROR) {
    document.title = '• ' + baseTitle;
  } else {
    document.title = baseTitle;
  }
}

// Save code to localStorage
function saveCode() {
  try {
    const code = editor.getValue();
    const saveData = {
      code,
      language: currentLanguage,
      timestamp: Date.now()
    };
    
    localStorage.setItem('leetcode-clone-code', JSON.stringify(saveData));
    lastSavedCode = code;
    setAutosaveState(AutosaveState.SAVED);
    
    // Subtle success feedback on autosave
    if (autosaveIndicator) {
      addSuccessShimmer(autosaveIndicator);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save code:', error);
    setAutosaveState(AutosaveState.ERROR, 'Save failed');
    return false;
  }
}

// Debounced autosave
function triggerAutosave() {
  const currentCode = editor.getValue();
  
  // Skip if code hasn't changed
  if (currentCode === lastSavedCode) {
    return;
  }
  
  // Clear any pending save
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout);
  }
  
  // Set to unsaved immediately
  setAutosaveState(AutosaveState.UNSAVED);
  
  // Schedule save
  autosaveTimeout = setTimeout(() => {
    setAutosaveState(AutosaveState.SAVING);
    
    // Simulate save time with a small delay for UX
    setTimeout(() => {
      saveCode();
    }, 300);
  }, AUTOSAVE_DELAY);
}

// Load saved code on startup
function loadSavedCode() {
  try {
    const savedData = localStorage.getItem('leetcode-clone-code');
    
    if (savedData) {
      const { code, language, timestamp } = JSON.parse(savedData);
      
      // Only load if saved within last 7 days
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (timestamp > sevenDaysAgo && code && language === currentLanguage) {
        editor.setValue(code);
        lastSavedCode = code;
        setAutosaveState(AutosaveState.SAVED);
        return true;
      }
    }
  } catch (error) {
    console.error('Failed to load saved code:', error);
  }
  
  return false;
}

// Listen to editor changes
editor.onDidChangeModelContent(() => {
  triggerAutosave();
});

// Load saved code if available
loadSavedCode();

// Warn user about unsaved changes before leaving page
window.addEventListener('beforeunload', (e) => {
  const currentCode = editor.getValue();
  
  // Check if there are unsaved changes
  if (currentCode !== lastSavedCode) {
    // Try to save before leaving (browsers may or may not wait for this)
    try {
      saveCode();
    } catch (error) {
      console.error('Failed to save on page unload:', error);
    }
    
    // Standard way to trigger browser's "leave site?" dialog
    // Modern browsers ignore custom messages and show their own
    e.preventDefault();
    e.returnValue = '';
    
    return 'You have unsaved changes. Are you sure you want to leave?';
  }
});

// Output Panel Behavior
const OutputState = {
  IDLE: 'idle',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
  COMPILE_ERROR: 'compile-error',
  RUNTIME_ERROR: 'runtime-error'
};

function setOutputState(state, message, content = '', time = null, verdictBadge = null) {
  // Remove all state classes
  Object.values(OutputState).forEach(s => {
    outputPanel?.classList.remove(`output-panel--${s}`);
  });
  
  // Add current state class
  outputPanel?.classList.add(`output-panel--${state}`);
  
  // Update status text with verdict badge
  if (outputState) {
    if (verdictBadge) {
      outputState.innerHTML = `<span class="badge badge--${verdictBadge}">${message}</span>`;
    } else {
      outputState.textContent = message;
    }
  }
  
  // Update content
  if (outputContent) {
    outputContent.textContent = content || message;
    // Show or hide based on content
    if (content) {
      outputContent.style.display = 'block';
    }
  }
  
  // Update execution time
  if (executionTime) {
    executionTime.textContent = time ? `${time}ms` : '';
  }
}

// Per-Test Result Display Functions
function createTestResultHTML(testCase, index) {
  const { status, input, expected, actual, runtime, error } = testCase;
  const isPassed = status === 'passed';
  const statusBadge = isPassed ? 'badge--accepted' : 'badge--wrong';
  const statusText = isPassed ? 'Passed' : 'Failed';
  const statusIcon = isPassed ? '✓' : '✗';
  
  return `
    <div class="test-result ${isPassed ? 'test-result--passed' : 'test-result--failed'}" data-test-index="${index}">
      <div class="test-result__header">
        <div class="test-result__header-left">
          <span class="test-result__number">Case ${index + 1}</span>
          ${isPassed ? `
          <div class="test-result__check-container">
            <svg class="test-result__check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle class="test-result__check-circle" cx="10" cy="10" r="9" stroke="#10b981" stroke-width="2" fill="none"/>
              <path class="test-result__check-path" d="M6 10L9 13L14 7" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>` : `
          <div class="test-result__error-container">
            <svg class="test-result__error-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle class="test-result__error-circle" cx="10" cy="10" r="9" stroke="#ef4444" stroke-width="2" fill="none"/>
              <path class="test-result__error-line1" d="M7 7L13 13" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
              <path class="test-result__error-line2" d="M13 7L7 13" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>`}
          <span class="badge badge--sm ${statusBadge}">${statusIcon} ${statusText}</span>
        </div>
        <div class="test-result__header-right">
          ${runtime ? `<span class="test-result__runtime">${runtime}ms</span>` : ''}
          <button class="test-result__toggle" data-index="${index}" aria-expanded="false">
            <svg class="test-result__chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="test-result__body" data-index="${index}">
        <div class="test-result__section">
          <div class="test-result__label">Input:</div>
          <div class="test-result__value"><code>${escapeHtml(input)}</code></div>
        </div>
        ${expected ? `
        <div class="test-result__section">
          <div class="test-result__label">Expected:</div>
          <div class="test-result__value test-result__value--expected"><code>${escapeHtml(expected)}</code></div>
        </div>` : ''}
        <div class="test-result__section">
          <div class="test-result__label">${isPassed ? 'Output:' : 'Your Output:'}</div>
          <div class="test-result__value ${!isPassed ? 'test-result__value--error' : ''}"><code>${escapeHtml(actual)}</code></div>
        </div>
        ${error ? `
        <div class="test-result__section">
          <div class="test-result__label">Error:</div>
          <div class="test-result__value test-result__value--error"><code>${escapeHtml(error)}</code></div>
        </div>` : ''}
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function displayTestResults(testCases, summary = '') {
  if (!testResultsContainer) return;
  
  // Clear previous results
  testResultsContainer.innerHTML = '';
  outputContent.style.display = 'none';
  
  // Add summary if provided
  if (summary) {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'test-results-summary';
    summaryDiv.textContent = summary;
    testResultsContainer.appendChild(summaryDiv);
  }
  
  // Create test result elements
  const resultsHTML = testCases.map((tc, i) => createTestResultHTML(tc, i)).join('');
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = resultsHTML;
  
  while (tempDiv.firstChild) {
    testResultsContainer.appendChild(tempDiv.firstChild);
  }
  
  // Animate test results progressively
  const testResults = testResultsContainer.querySelectorAll('.test-result');
  testResults.forEach((result, index) => {
    const isPassed = result.classList.contains('test-result--passed');
    
    // Add initial state
    result.style.opacity = '0';
    result.style.transform = 'translateY(20px)';
    
    // Animate in with delay
    setTimeout(() => {
      result.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      result.style.opacity = '1';
      result.style.transform = 'translateY(0)';
      
      // Trigger animations based on test status
      if (isPassed) {
        // Checkmark animation for passed tests
        setTimeout(() => {
          result.classList.add('test-result--animate-check');
        }, 200);
      } else {
        // Subtle shake and X mark animation for failed tests
        setTimeout(() => {
          result.classList.add('test-result--animate-error');
          // Brief shake animation
          setTimeout(() => {
            result.classList.add('test-result--shake');
            setTimeout(() => {
              result.classList.remove('test-result--shake');
            }, 500);
          }, 100);
        }, 200);
      }
    }, index * 150);
  });
  
  // Check if all tests passed for celebration
  const allPassed = testCases.every(tc => tc.status === 'passed');
  if (allPassed && testCases.length > 0) {
    setTimeout(() => {
      createCelebrationEffect();
    }, testCases.length * 150 + 500);
  }
  
  // Add toggle event listeners
  const toggleButtons = testResultsContainer.querySelectorAll('.test-result__toggle');
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const index = button.getAttribute('data-index');
      const body = testResultsContainer.querySelector(`.test-result__body[data-index="${index}"]`);
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      
      button.setAttribute('aria-expanded', !isExpanded);
      body.classList.toggle('expanded');
      button.classList.toggle('expanded');
    });
  });
}

function createCelebrationEffect() {
  if (!testResultsContainer) return;
  
  // Create confetti container
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'celebration-confetti';
  testResultsContainer.appendChild(confettiContainer);
  
  // Create confetti pieces
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
  const confettiCount = 30;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confetti.style.animationDuration = `${Math.random() * 1 + 1.5}s`;
    confettiContainer.appendChild(confetti);
  }
  
  // Remove confetti after animation
  setTimeout(() => {
    confettiContainer.remove();
  }, 3000);
}

function clearTestResults() {
  if (testResultsContainer) {
    testResultsContainer.innerHTML = '';
  }
  if (outputContent) {
    outputContent.style.display = 'block';
    outputContent.textContent = 'Ready.';
  }
}

// Runtime Display Functions
function showRuntimeStats(runtime, memory, runtimePercentile, memoryPercentile) {
  if (!runtimeStats) return;
  
  // Show the stats panel
  runtimeStats.classList.remove('hidden');
  
  // Update runtime
  if (runtimeValue) {
    runtimeValue.textContent = `${runtime}ms`;
  }
  if (runtimeBar) {
    runtimeBar.style.width = `${runtimePercentile}%`;
    // Color code based on performance
    if (runtimePercentile >= 80) {
      runtimeBar.style.background = '#10b981'; // Green - Excellent
    } else if (runtimePercentile >= 50) {
      runtimeBar.style.background = '#f59e0b'; // Amber - Good
    } else {
      runtimeBar.style.background = '#ef4444'; // Red - Needs improvement
    }
  }
  if (runtimeComparison) {
    runtimeComparison.textContent = `Beats ${runtimePercentile}% of submissions`;
  }
  
  // Update memory
  if (memoryValue) {
    memoryValue.textContent = `${memory} MB`;
  }
  if (memoryBar) {
    memoryBar.style.width = `${memoryPercentile}%`;
    // Color code based on performance
    if (memoryPercentile >= 80) {
      memoryBar.style.background = '#10b981'; // Green
    } else if (memoryPercentile >= 50) {
      memoryBar.style.background = '#f59e0b'; // Amber
    } else {
      memoryBar.style.background = '#ef4444'; // Red
    }
  }
  if (memoryComparison) {
    memoryComparison.textContent = `Beats ${memoryPercentile}% of submissions`;
  }
}

function hideRuntimeStats() {
  if (runtimeStats) {
    runtimeStats.classList.add('hidden');
  }
}

function clearOutput() {
  setOutputState(OutputState.IDLE, 'Ready', 'Ready.');
  clearTestResults();
  hideRuntimeStats();
}

function showRunning() {
  setOutputState(OutputState.RUNNING, 'Running...', 'Executing code...', null, 'loading');
}

function showSuccess(results, time, isSubmit = false) {
  const header = isSubmit ? '✓ Accepted!' : '✓ All test cases passed!';
  const passedCount = results.length;
  
  // Create test case objects with details
  const testCases = results.map((r, i) => ({
    status: 'passed',
    input: r.input,
    expected: r.expected || r.output,
    actual: r.output,
    runtime: Math.floor(Math.random() * 20) + 5
  }));
  
  setOutputState(OutputState.SUCCESS, isSubmit ? 'Accepted' : 'Passed', '', time, 'ac');
  displayTestResults(testCases, `${header} (${passedCount}/${passedCount} test cases)`);
  
  // Show runtime stats for submit
  if (isSubmit) {
    const runtime = time;
    const memory = (Math.random() * 30 + 40).toFixed(1);
    const runtimePercentile = Math.floor(Math.random() * 60) + 40;
    const memoryPercentile = Math.floor(Math.random() * 60) + 40;
    showRuntimeStats(runtime, memory, runtimePercentile, memoryPercentile);
    
    // Add success microinteraction on submission acceptance
    if (submitCodeBtn) {
      addSuccessGlow(submitCodeBtn);
    }
  } else {
    // Add subtle pulse for run code success
    if (runCodeBtn) {
      addSuccessPulse(runCodeBtn);
    }
  }
}

function showError(errorType, message, details = '') {
  const state = errorType === 'compile' ? OutputState.COMPILE_ERROR : 
                errorType === 'runtime' ? OutputState.RUNTIME_ERROR : 
                OutputState.ERROR;
  
  const verdictMap = {
    'compile': 'ce',
    'runtime': 're',
    'timeout': 'tle',
    'memory': 'mle'
  };
  
  const output = [
    `✗ ${message}`,
    '',
    details
  ].filter(Boolean).join('\n');
  
  setOutputState(state, message, output, null, verdictMap[errorType] || 're');
}

function showPartialSuccess(passed, total, failedCase, time) {
  const summary = `✗ ${passed}/${total} test cases passed`;
  
  // Create test cases - show all passed ones and the failed one
  const testCases = [];
  
  // Add passed cases
  for (let i = 0; i < passed; i++) {
    testCases.push({
      status: 'passed',
      input: i === 0 ? '[2,7,11,15], target=9' : i === 1 ? '[3,2,4], target=6' : `Test case ${i + 1}`,
      expected: i === 0 ? '[0,1]' : i === 1 ? '[1,2]' : 'Passed',
      actual: i === 0 ? '[0,1]' : i === 1 ? '[1,2]' : 'Passed',
      runtime: Math.floor(Math.random() * 20) + 5
    });
  }
  
  // Add failed case
  testCases.push({
    status: 'failed',
    input: failedCase.input,
    expected: failedCase.expected,
    actual: failedCase.actual,
    runtime: Math.floor(Math.random() * 20) + 5
  });
  
  setOutputState(OutputState.ERROR, `Wrong Answer`, '', time, 'wa');
  displayTestResults(testCases, summary);
}

// Run Code button behavior - Tests against sample cases
if (runCodeBtn) {
  runCodeBtn.addEventListener('click', () => {
    runCodeBtn.disabled = true;
    submitCodeBtn.disabled = true;
    
    setOutputState(OutputState.RUNNING, 'Running...', 'Testing against sample cases...');
    
    setTimeout(() => {
      const execTime = Math.floor(Math.random() * 80) + 30;
      const scenario = Math.random();
      
      if (scenario < 0.7) {
        // Success on sample cases
        showSuccess([
          { input: '[2,7,11,15], target=9', output: '[0,1]', expected: '[0,1]' },
          { input: '[3,2,4], target=6', output: '[1,2]', expected: '[1,2]' },
          { input: '[3,3], target=6', output: '[0,1]', expected: '[0,1]' }
        ], execTime, false);
      } else if (scenario < 0.85) {
        // Wrong answer on sample
        showPartialSuccess(2, 3, {
          number: 3,
          input: '[3,3], target=6',
          expected: '[0,1]',
          actual: '[]'
        }, execTime);
      } else if (scenario < 0.95) {
        // Runtime error
        showError('runtime', 'Runtime Error', 
          'TypeError: Cannot read property \'length\' of undefined\n  at twoSum (line 15)\n  at testCase (line 28)');
      } else {
        // Compile error
        showError('compile', 'Compilation Error', 
          'SyntaxError: Unexpected token \'}\'\n  at line 23:1');
      }
      
      runCodeBtn.disabled = false;
      submitCodeBtn.disabled = false;
    }, 1000);
  });
}

// Submit Code button behavior - Tests against all cases (including hidden)
if (submitCodeBtn) {
  submitCodeBtn.addEventListener('click', () => {
    runCodeBtn.disabled = true;
    submitCodeBtn.disabled = true;
    
    setOutputState(OutputState.RUNNING, 'Judging...', 'Testing against all test cases (including hidden cases)...');
    
    setTimeout(() => {
      const execTime = Math.floor(Math.random() * 150) + 80;
      const scenario = Math.random();
      
      if (scenario < 0.5) {
        // Full acceptance
        showSuccess([
          { input: '[2,7,11,15], target=9', output: '[0,1]', expected: '[0,1]' },
          { input: '[3,2,4], target=6', output: '[1,2]', expected: '[1,2]' },
          { input: '[3,3], target=6', output: '[0,1]', expected: '[0,1]' },
          { input: 'Hidden case 1', output: 'Passed \u2713', expected: 'Passed' },
          { input: 'Hidden case 2', output: 'Passed \u2713', expected: 'Passed' },
          { input: 'Hidden case 3', output: 'Passed \u2713', expected: 'Passed' },
          { input: 'Hidden case 4', output: 'Passed \u2713', expected: 'Passed' }
        ], execTime, true);
      } else if (scenario < 0.8) {
        // Failed on hidden case
        const failedCaseNum = Math.floor(Math.random() * 4) + 4;
        showPartialSuccess(failedCaseNum - 1, 7, {
          number: failedCaseNum,
          input: 'Hidden test case',
          expected: '(hidden)',
          actual: '(your output)'
        }, execTime);
      } else if (scenario < 0.95) {
        // Runtime error on edge case
        showError('timeout', 'Time Limit Exceeded', 
          'Error on test case 5\\nYour solution exceeded the time limit\\n  Current: 3000ms, Limit: 2000ms\\n  Consider optimizing your solution');
      } else {
        // Memory limit exceeded
        showError('memory', 'Memory Limit Exceeded', 
          'Error on test case 6\nYour solution used too much memory\n  Current: 256 MB, Limit: 128 MB');
      }
      
      runCodeBtn.disabled = false;
      submitCodeBtn.disabled = false;
    }, 1500);
  });
}

// Clear output button behavior
if (clearOutputBtn) {
  clearOutputBtn.addEventListener('click', clearOutput);
}

// Close runtime stats button
if (closeRuntimeStats) {
  closeRuntimeStats.addEventListener('click', hideRuntimeStats);
}

window.addEventListener('resize', () => {
  editor.layout();
});

// Collapsible problem statement
const problemToggle = document.getElementById('problemToggle');
const problemContent = document.getElementById('problemContent');

if (problemToggle && problemContent) {
  problemToggle.addEventListener('click', () => {
    const isExpanded = problemToggle.getAttribute('aria-expanded') === 'true';
    
    problemToggle.setAttribute('aria-expanded', !isExpanded);
    problemContent.classList.toggle('collapsed');
    problemToggle.classList.toggle('rotated');
  });
}

// Collapsible test cases
const testCasesToggle = document.getElementById('testCasesToggle');
const testCasesContent = document.getElementById('testCasesContent');

if (testCasesToggle && testCasesContent) {
  testCasesToggle.addEventListener('click', () => {
    const isExpanded = testCasesToggle.getAttribute('aria-expanded') === 'true';
    
    testCasesToggle.setAttribute('aria-expanded', !isExpanded);
    testCasesContent.classList.toggle('collapsed');
    testCasesToggle.classList.toggle('rotated');
  });
}

// Keyboard shortcuts functionality
const keyboardShortcutsBtn = document.getElementById('keyboardShortcutsBtn');
const keyboardShortcutsModal = document.getElementById('keyboardShortcutsModal');
const closeShortcutsModal = document.getElementById('closeShortcutsModal');

// Detect OS for Cmd vs Ctrl
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modKey = isMac ? 'Cmd' : 'Ctrl';

// Update all keyboard hints to show Cmd on Mac
if (isMac) {
  document.querySelectorAll('.kbd').forEach(kbd => {
    if (kbd.textContent === 'Ctrl') {
      kbd.textContent = 'Cmd';
    }
  });
}

// Show shortcuts modal
function showShortcutsModal() {
  if (keyboardShortcutsModal) {
    keyboardShortcutsModal.classList.add('is-visible');
    keyboardShortcutsModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

// Hide shortcuts modal
function hideShortcutsModal() {
  if (keyboardShortcutsModal) {
    keyboardShortcutsModal.classList.remove('is-visible');
    keyboardShortcutsModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// Keyboard shortcuts button
if (keyboardShortcutsBtn) {
  keyboardShortcutsBtn.addEventListener('click', showShortcutsModal);
}

// Close shortcuts modal button
if (closeShortcutsModal) {
  closeShortcutsModal.addEventListener('click', hideShortcutsModal);
}

// Close modal on overlay click
if (keyboardShortcutsModal) {
  keyboardShortcutsModal.querySelector('.shortcuts-modal__overlay')?.addEventListener('click', hideShortcutsModal);
}

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
  
  // Ctrl/Cmd + Enter - Run code
  if (ctrlOrCmd && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    runCodeBtn?.click();
    return;
  }
  
  // Ctrl/Cmd + Shift + Enter - Submit code
  if (ctrlOrCmd && e.shiftKey && e.key === 'Enter') {
    e.preventDefault();
    submitCodeBtn?.click();
    return;
  }
  
  // Ctrl/Cmd + Q - Toggle problem statement
  if (ctrlOrCmd && e.key === 'q') {
    e.preventDefault();
    problemToggle?.click();
    return;
  }
  
  // Ctrl/Cmd + T - Toggle test cases
  if (ctrlOrCmd && e.key === 't') {
    e.preventDefault();
    testCasesToggle?.click();
    return;
  }
  
  // ? - Show keyboard shortcuts
  if (e.key === '?' && !ctrlOrCmd && !e.shiftKey && !e.altKey) {
    // Only trigger if not focused on editor or input
    const activeElement = document.activeElement;
    const isEditorFocused = activeElement?.classList.contains('monaco-editor') || 
                            activeElement?.closest('.monaco-editor');
    
    if (!isEditorFocused) {
      e.preventDefault();
      showShortcutsModal();
      return;
    }
  }
  
  // Escape - Close modal
  if (e.key === 'Escape') {
    if (keyboardShortcutsModal?.classList.contains('is-visible')) {
      e.preventDefault();
      hideShortcutsModal();
      return;
    }
    if (resetCodeModal?.classList.contains('is-visible')) {
      e.preventDefault();
      hideResetModal();
      return;
    }
  }
});

// Language selector functionality
const languageTabs = document.querySelectorAll('.language-tab');

// Switch language function
function switchLanguage(language) {
  // Update current language
  currentLanguage = language;
  
  // Update active tab
  languageTabs.forEach(tab => {
    if (tab.dataset.language === language) {
      tab.classList.add('is-active');
    } else {
      tab.classList.remove('is-active');
    }
  });
  
  // Update editor content and language
  const newCode = starterCodeTemplates[language];
  const monacoLanguage = languageConfig[language];
  
  if (editor && newCode && monacoLanguage) {
    // Get current editor model
    const model = editor.getModel();
    
    // Update the language mode
    monaco.editor.setModelLanguage(model, monacoLanguage);
    
    // Only update code if editor is empty or has starter code
    const currentCode = editor.getValue().trim();
    const isStarterCode = Object.values(starterCodeTemplates).some(template => 
      currentCode === template.trim()
    );
    
    // Update code if empty or contains previous starter code
    if (!currentCode || isStarterCode) {
      editor.setValue(newCode);
      clearOutput();
      
      // Update autosave state for new language
      lastSavedCode = newCode;
      saveCode();
    } else {
      // Show confirmation modal if user has custom code
      showResetModal(language, true);
      
      // Revert active state until confirmation
      languageTabs.forEach(tab => {
        if (tab.dataset.language === currentLanguage) {
          tab.classList.add('is-active');
        } else {
          tab.classList.remove('is-active');
        }
      });
      
      return; // Don't clear output until confirmed
    }
  }
  
  // Clear output when switching languages
  clearOutput();
}

// Add click listeners to language tabs
languageTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const language = tab.dataset.language;
    if (language && language !== currentLanguage) {
      switchLanguage(language);
    }
  });
});

// Reset code confirmation modal functionality
const resetCodeBtn = document.getElementById('resetCodeBtn');
const resetCodeModal = document.getElementById('resetCodeModal');
const cancelResetBtn = document.getElementById('cancelResetBtn');
const confirmResetBtn = document.getElementById('confirmResetBtn');
const resetLanguageName = document.getElementById('resetLanguageName');

let pendingLanguageSwitch = null;

// Show reset confirmation modal
function showResetModal(languageName = null, switchLanguage = false) {
  if (resetCodeModal) {
    // Update language name in message
    if (resetLanguageName) {
      const displayName = languageName ? languageName.charAt(0).toUpperCase() + languageName.slice(1) : 'current language';
      resetLanguageName.textContent = displayName;
    }
    
    // Store pending language switch if applicable
    pendingLanguageSwitch = switchLanguage ? languageName : null;
    
    resetCodeModal.classList.add('is-visible');
    resetCodeModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

// Hide reset confirmation modal
function hideResetModal() {
  if (resetCodeModal) {
    resetCodeModal.classList.remove('is-visible');
    resetCodeModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    pendingLanguageSwitch = null;
  }
}

// Reset code to starter template
function resetToStarterCode(language = currentLanguage) {
  const starterCode = starterCodeTemplates[language];
  
  if (editor && starterCode) {
    editor.setValue(starterCode);
    clearOutput();
    
    // Update autosave state
    lastSavedCode = starterCode;
    saveCode();
    
    // Show success feedback
    console.log(`Code reset to ${language} starter template`);
  }
  
  hideResetModal();
}

// Reset button click handler
if (resetCodeBtn) {
  resetCodeBtn.addEventListener('click', () => {
    const currentCode = editor.getValue().trim();
    const isStarterCode = Object.values(starterCodeTemplates).some(template => 
      currentCode === template.trim()
    );
    
    // Only show modal if user has modified code
    if (currentCode && !isStarterCode) {
      showResetModal(currentLanguage, false);
    } else {
      // Already starter code or empty, just reset
      resetToStarterCode();
    }
  });
}

// Cancel reset button
if (cancelResetBtn) {
  cancelResetBtn.addEventListener('click', hideResetModal);
}

// Confirm reset button
if (confirmResetBtn) {
  confirmResetBtn.addEventListener('click', () => {
    if (pendingLanguageSwitch) {
      // Reset and switch language
      resetToStarterCode(pendingLanguageSwitch);
      
      // Complete the language switch
      languageTabs.forEach(tab => {
        if (tab.dataset.language === pendingLanguageSwitch) {
          tab.classList.add('is-active');
        } else {
          tab.classList.remove('is-active');
        }
      });
      
      currentLanguage = pendingLanguageSwitch;
      
      // Update Monaco editor language
      const monacoLanguage = languageConfig[pendingLanguageSwitch];
      if (monacoLanguage) {
        const model = editor.getModel();
        monaco.editor.setModelLanguage(model, monacoLanguage);
      }
    } else {
      // Just reset current language
      resetToStarterCode();
    }
  });
}

// Close modal on overlay click
if (resetCodeModal) {
  resetCodeModal.querySelector('.confirm-modal__overlay')?.addEventListener('click', hideResetModal);
}

// Solved toggle functionality
const solvedToggle = document.getElementById('solvedToggle');
const PROBLEM_ID = 'two-sum'; // In a real app, this would be dynamic based on the problem

// Load solved state from localStorage
function loadSolvedState() {
  try {
    const solvedProblems = JSON.parse(localStorage.getItem('leetcode-clone-solved') || '{}');
    return solvedProblems[PROBLEM_ID] || false;
  } catch (error) {
    console.error('Failed to load solved state:', error);
    return false;
  }
}

// Save solved state to localStorage
function saveSolvedState(isSolved) {
  try {
    const solvedProblems = JSON.parse(localStorage.getItem('leetcode-clone-solved') || '{}');
    solvedProblems[PROBLEM_ID] = isSolved;
    localStorage.setItem('leetcode-clone-solved', JSON.stringify(solvedProblems));
    return true;
  } catch (error) {
    console.error('Failed to save solved state:', error);
    return false;
  }
}

// Update solved toggle UI
function setSolvedState(isSolved) {
  if (!solvedToggle) return;
  
  solvedToggle.setAttribute('data-solved', isSolved.toString());
  solvedToggle.setAttribute('aria-pressed', isSolved.toString());
  
  // Update aria-label
  const label = isSolved ? 'Unmark as solved' : 'Mark as solved';
  solvedToggle.setAttribute('aria-label', label);
  
  // Save to localStorage
  saveSolvedState(isSolved);
}

// Toggle solved state
function toggleSolved(event) {
  const currentState = solvedToggle.getAttribute('data-solved') === 'true';
  const newState = !currentState;
  
  setSolvedState(newState);
  
  // Add success microinteraction when marking as solved
  if (newState) {
    showSuccessFeedback('subtle', { element: solvedToggle, event });
    // Optional: floating check from click position
    setTimeout(() => {
      createSuccessCheck(event.clientX, event.clientY);
    }, 100);
  }
  
  // Optional: Show a subtle notification
  console.log(newState ? 'Problem marked as solved! ✓' : 'Problem marked as unsolved');
}

// Initialize solved state on page load
if (solvedToggle) {
  const isSolved = loadSolvedState();
  setSolvedState(isSolved);
  
  // Add click event listener
  solvedToggle.addEventListener('click', toggleSolved);
}

// Success Microinteraction Functions
// Subtle, non-intrusive success feedback

// Create floating check icon at specific position
function createSuccessCheck(x, y) {
  const checkElement = document.createElement('div');
  checkElement.className = 'success-check-float';
  checkElement.style.left = `${x}px`;
  checkElement.style.top = `${y}px`;
  checkElement.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" />
    </svg>
  `;
  
  document.body.appendChild(checkElement);
  
  // Remove after animation completes
  setTimeout(() => {
    checkElement.remove();
  }, 1200);
}

// Add glow effect to an element
function addSuccessGlow(element) {
  if (!element) return;
  
  element.classList.add('success-glow');
  
  setTimeout(() => {
    element.classList.remove('success-glow');
  }, 800);
}

// Add shimmer effect to an element
function addSuccessShimmer(element) {
  if (!element) return;
  
  element.classList.add('success-shimmer');
  
  setTimeout(() => {
    element.classList.remove('success-shimmer');
  }, 800);
}

// Add subtle bounce to an element
function addSuccessBounce(element) {
  if (!element) return;
  
  element.classList.add('success-bounce');
  
  setTimeout(() => {
    element.classList.remove('success-bounce');
  }, 500);
}

// Add subtle pulse to an element
function addSuccessPulse(element) {
  if (!element) return;
  
  element.classList.add('success-pulse');
  
  setTimeout(() => {
    element.classList.remove('success-pulse');
  }, 600);
}

// Create ripple effect at click position
function createSuccessRipple(event, element) {
  const rect = element.getBoundingClientRect();
  const ripple = document.createElement('div');
  ripple.className = 'success-ripple';
  
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  
  element.style.position = 'relative';
  element.appendChild(ripple);
  
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// Generic success feedback - choose appropriate microinteraction
function showSuccessFeedback(type = 'subtle', options = {}) {
  const { element, event, position } = options;
  
  switch (type) {
    case 'check':
      // Floating check icon
      if (position) {
        createSuccessCheck(position.x, position.y);
      } else if (event) {
        createSuccessCheck(event.clientX, event.clientY);
      }
      break;
      
    case 'glow':
      // Glow effect on element
      if (element) addSuccessGlow(element);
      break;
      
    case 'shimmer':
      // Shimmer sweep across element
      if (element) addSuccessShimmer(element);
      break;
      
    case 'bounce':
      // Subtle bounce
      if (element) addSuccessBounce(element);
      break;
      
    case 'pulse':
      // Subtle pulse
      if (element) addSuccessPulse(element);
      break;
      
    case 'ripple':
      // Ripple from click point
      if (element && event) createSuccessRipple(event, element);
      break;
      
    case 'subtle':
    default:
      // Combine subtle effects
      if (element) {
        addSuccessPulse(element);
        if (event) createSuccessRipple(event, element);
      }
      break;
  }
}
