Ohhh yes. Now we’re building this like a real product team. 🔥
If you follow a style guide from day one, your app will look intentional instead of “assembled.”
Below is a production-ready UI/UX style guide tailored specifically for your LeetCode-style platform using Pug + Tailwind + Monaco + Supabase.
________________________________________
🎨 CodeForge Style Guide
________________________________________
1️⃣ Design Principles
Clarity Over Decoration
The UI must prioritize readability and focus. The user’s code is the hero.
Fast Feedback
Every user action should provide immediate visual confirmation.
Minimal Distraction
No unnecessary gradients, shadows, or noise. Clean, modern, functional.
Developer-Centric
Keyboard-friendly. Dark mode optimized. High contrast.
________________________________________
2️⃣ Color System
🎯 Primary Palette
Token	Purpose	Value
primary-500	Main action buttons	#6366F1
primary-600	Hover state	#4F46E5
primary-700	Active state	#4338CA
🧠 Neutral (Dark Mode First)
Token	Value
bg-main	#0F172A
bg-surface	#1E293B
bg-elevated	#334155
border-default	#334155
text-primary	#F8FAFC
text-secondary	#94A3B8
🏷 Status Colors
Status	Color
Accepted	#22C55E
Wrong Answer	#EF4444
TLE	#F59E0B
Runtime Error	#F97316
Compile Error	#E11D48
________________________________________
3️⃣ Typography System
Font Stack
Primary UI:
Inter, system-ui, sans-serif
Monospace (code):
JetBrains Mono, Menlo, monospace
________________________________________
Typography Scale
Element	Size	Weight
H1	32px	700
H2	24px	600
H3	20px	600
Body Large	16px	400
Body	14px	400
Caption	12px	400
Code	14px	500
Line height: 1.5 for body, 1.3 for headings.
________________________________________
4️⃣ Spacing System
Use 4px base scale:
4px
8px
12px
16px
24px
32px
48px
64px
Rules:
•	16px padding minimum inside cards
•	24px spacing between major sections
•	8px spacing between small UI elements
________________________________________
5️⃣ Layout Standards
Global Layout
•	Fixed top navigation
•	Max content width: 1280px
•	Centered container
•	Consistent horizontal padding (24px)
________________________________________
Problem Page Layout
Three-panel system:
---------------------------------
| Problem | Editor              |
---------------------------------
| Output Panel                  |
---------------------------------
Rules:
•	Resizable left/right panels
•	Output panel collapsible
•	Editor must occupy majority of horizontal space
•	Maintain minimum 320px width for problem pane
________________________________________
6️⃣ Component Standards
________________________________________
Buttons
Primary
•	Solid primary color
•	Rounded-md
•	Font-weight 500
•	Padding: 10px 16px
Secondary
•	Border with neutral color
•	Transparent background
Danger
•	Red background
•	Confirm modal required before destructive actions
________________________________________
Verdict Badges
•	Rounded-full
•	Small padding (px-3 py-1)
•	Font-size 12px
•	Uppercase
Example:
•	AC → green
•	WA → red
•	TLE → amber
________________________________________
Cards
•	Background: bg-surface
•	Border: border-default
•	Rounded-lg
•	Shadow-sm only if needed
________________________________________
Inputs
•	Full width
•	40px height minimum
•	Focus ring in primary-500
•	Clear error state (red border + small message)
________________________________________
Modals
•	Backdrop blur
•	Centered
•	Max width: 480px
•	Rounded-lg
•	Trap focus
•	Esc closes modal
________________________________________
7️⃣ Editor UX Rules
•	Dark theme default
•	Show line numbers
•	Highlight active line
•	Highlight matching brackets
•	Show mini-map (optional)
•	Autosave indicator subtle in corner
•	Ctrl+Enter → Run
•	Shift+Enter → Submit
•	Clear visual separation between Run and Submit
________________________________________
8️⃣ Microinteractions
•	Button hover: 150ms ease
•	Panel collapse animation: 200ms ease
•	Submission loading: animated progress bar
•	Passing tests: subtle green pulse
•	Avoid confetti unless toggleable
________________________________________
9️⃣ Accessibility Standards
•	Minimum 4.5:1 contrast ratio
•	All buttons accessible via keyboard
•	Visible focus outlines
•	ARIA labels for editor controls
•	Toast notifications screen-reader friendly
•	No UI element smaller than 40px touch target
________________________________________
🔟 Responsive Behavior
Mobile (<768px):
•	Stack problem above editor
•	Output collapses by default
•	Hide non-critical metadata
•	Increase touch targets
Tablet:
•	Side-by-side if width allows
Desktop:
•	Full split layout
________________________________________
1️⃣1️⃣ Empty & Error States
Empty submissions:
•	Friendly message
•	CTA to solve first problem
Run error:
•	Clear message
•	Suggest next action
Submission timeout:
•	Suggest simplifying solution
________________________________________
1️⃣2️⃣ Animation Guidelines
Use motion sparingly.
•	Duration: 150–250ms
•	Easing: ease-in-out
•	No bouncing animations
•	Avoid excessive motion near code editor
________________________________________
1️⃣3️⃣ Visual Consistency Rules
•	No random border radii
•	No random shadows
•	No mixing color shades inconsistently
•	All headers aligned to same baseline
•	All cards use consistent padding
________________________________________
1️⃣4️⃣ Dark Mode First Strategy
This platform should feel like a developer tool:
•	Default dark mode
•	Optional light toggle
•	Store preference in localStorage
•	Use Tailwind dark class strategy
________________________________________
1️⃣5️⃣ Do Not Do
❌ No flashy gradients
❌ No excessive shadows
❌ No modal spam
❌ No tiny fonts
❌ No cramped spacing
❌ No ambiguous button labels
________________________________________
✨ Brand Personality
•	Calm
•	Technical
•	Confident
•	Clean
•	Modern developer aesthetic
________________________________________


