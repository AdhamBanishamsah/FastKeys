Build a Chrome Extension (Manifest V3) called “Magical Lite – Text Expander & Autofill” that replicates the core workflow shown in the provided screenshots:

A Templates page with a top toolbar (Create, Share, Tags, Delete) and a Search templates field

A large template editor panel with:

a Trigger input (left/top)

a rich text editor area with a small toolbar, including a “View HTML” control

ability to insert variables like First Name

ability to insert dates via a date menu (like the screenshot)

Save and Discard buttons on the right

A list of existing templates below the editor as “cards/rows” with:

a checkbox on the left

the trigger as a pill/label (examples: _thinkcell, _vpn)

a preview box showing the template body

tags section per template

A Tags dropdown like the screenshot (shows tag “Magical”, edit icon, trash icon, and “Create New”)

Tabs at top-left: Templates and Automations (Automations can be a placeholder page for now)

Goal

This extension should:

Let me create/edit/delete templates with triggers.

Expand triggers while I type in webpages (inputs, textareas, and contenteditable email editors) into the template content.

Support placeholders like {{first_name}} and {{date}} (and a few date formats).

Store everything in chrome.storage.sync (fallback to chrome.storage.local if sync fails).

Product Requirements
1) Data Model

A template object:

id (string UUID)

trigger (string, unique, e.g. _vpn)

title (optional string, can derive from trigger)

bodyHtml (string) — canonical stored format

bodyText (string) — plain text version for non-HTML fields

tags (array of strings)

createdAt, updatedAt (number timestamps)

A tag object:

name (string unique)

optional: color (string)

Storage keys:

templates (array)

tags (array)

settings (object: expansion behavior, delimiter rules, etc.)

Seed with two sample templates similar to screenshots:

_thinkcell with a short Norwegian license message (fake key)

_vpn with a short Norwegian VPN message

2) Extension UI (Options Page)

Create an options page that matches the screenshot layout closely:

Top navigation / header

Tabs: Templates (active by default) and Automations

Underline active tab in green (like screenshot)

Toolbar row (left to right)

Checkbox (select all)

Create button with dropdown arrow (dropdown can be minimal for now)

Share button (can export selected templates to JSON file download)

Tags button (opens tags dropdown)

Delete button (deletes selected templates)

On the right: filter icon + Search templates input

Editor panel

Big rounded container in light blue background

“Trigger” input at top-left

Below it: Rich text editor area

Show chips inside editor like: Hi {{first_name}}, (the {{first_name}} chip can be styled)

Buttons: Save and Discard on the right side of the editor panel

Rich text editor requirements

Use a lightweight embedded editor.

Prefer contenteditable + custom toolbar (bold/italic/underline, bullet list, link, “View HTML” toggle).

“View HTML” should show raw HTML in a textarea modal/panel and allow saving changes back.

Add small toolbar icons like in screenshot (don’t need to match exactly, but same idea).

Add an “Insert variable” control (e.g., “First Name” chip insert).

Add an “Insert date” button that opens a small menu with multiple formats, like screenshot:

January 22nd, 2026

01/22/2026

Thursday January 22nd, 2026

January 22nd, 2026, 11:09 am
Use the user’s locale/timezone if possible.

Templates list

Each template appears below editor with:

checkbox

trigger pill label

body preview in a white rounded box

tags row

Clicking a template loads it into the editor.

3) Text Expansion in Web Pages

Implement text expansion with a content script:

Supported fields:

input[type="text"], textarea

contenteditable="true" areas (Gmail-like editors)

Expansion rules:

When user types a trigger and then hits Space, Tab, or Enter, replace the trigger with the template.

Keep the delimiter behavior:

Space: replace trigger and keep the space after expansion

Enter: replace trigger then insert newline

Tab: replace trigger and prevent default tab navigation (optional setting)

HTML insertion:

For input/textarea, insert bodyText

For contenteditable, insert bodyHtml using document.execCommand('insertHTML', false, html) as first attempt, fallback to Range API if needed.

Cursor position:

After insertion, caret should be placed after inserted content.

Prevent expansion in:

password fields

triggers inside longer words (must be token boundary: start of field or preceded by whitespace/punctuation)

4) Placeholder / Autofill Variables

Implement a small templating engine:

Supported tokens in templates:

{{first_name}}

{{last_name}}

{{email}}

{{date}} (default format)

{{date:FORMAT}} where FORMAT supports a few:

long → “January 22nd, 2026”

short → “01/22/2026”

weekday_long → “Thursday January 22nd, 2026”

long_time → “January 22nd, 2026, 11:09 am”

How to resolve values:

For now, show a small “Autofill panel” when expanding if values unknown:

Minimal inline prompt anchored near the caret that asks for missing fields (First name / Last name / Email).

Cache last used values in chrome.storage.local.settings.profile.

Later we can add “scrape from page” heuristics, but keep v1 simple.

5) Quick Insert (Popup)

Add an extension popup:

Search templates

Click one to insert into the active field (send message to content script)

Also show most recent templates

Add a keyboard shortcut (commands API):

Ctrl+Shift+M opens the popup or opens a mini search overlay in-page (choose simplest reliable option).

6) Export/Import (Share)

“Share” exports selected templates to a JSON file.

Add an “Import” action inside Create dropdown or Automations page to import JSON.

7) Code / Project Constraints

Use vanilla JS, HTML, CSS (no external CDN).

Keep everything working in MV3.

No build step required (no webpack). Use ES modules if needed.

Provide clean folder structure and a README with install steps:

chrome://extensions → Developer mode → Load unpacked

Recommended structure:

manifest.json

background/service_worker.js

content/contentScript.js

content/injectOverlay.css

options/options.html, options/options.js, options/options.css

popup/popup.html, popup/popup.js, popup/popup.css

lib/ (small shared utils: storage, templating, date formatting, uuid)

8) Acceptance Criteria

I can create a template with trigger _vpn, save it, and it appears in the list.

Typing _vpn + space in a textarea expands to the saved message.

Typing _vpn + space in a Gmail-like editor expands with HTML formatting.

Clicking “View HTML” lets me edit raw HTML and save.

“Tags” dropdown shows existing tags and allows create/rename/delete.

Search filters templates live.

Export selected templates to JSON and import them back.

9) Deliverables

All source files.

A short README.

A small “Known limitations” section (e.g., some web editors block execCommand).