**English** | [日本語版](../ja/USER_GUIDE.md)

# Operation Manual & User Guide (USER_GUIDE.md)

This document is the user manual explaining the usage and operation procedures for each function of the "Preset Text Clipboard Manager (SnippetFlow)".

## 💡 Recommended Use Cases

SnippetFlow is a versatile clipboard manager useful not only for programming code, but for all daily desk work and digital workflows.

* 🤖 **AI Prompts & Template Management**:
  * Store repetitive prompts for ChatGPT, Claude, Gemini, or local LLMs (e.g., code review requests, text summaries, test case generators), along with system roles and constraints.
  * Categorize them with tags like `AI`, `review`, `prompt` to streamline prompt dispatch.
* ✉️ **Business Emails & Chat Templates**:
  * Save common greetings, inquiry acknowledgment replies, follow-ups, and email signatures.
  * Accelerate daily communication on Email, Slack, Teams, etc.
* 💻 **Routine Commands & Shell Scripts**:
  * Stock frequently used but hard-to-remember Git commands (branch cleanup, rebase, diffs), Docker container commands, and long PowerShell/Bash one-liners.
  * Eliminate the need to search through terminal history or web searches.
* 📝 **Quick Notes & Information Clips**:
  * Use as a scratchpad for temporary notes, frequently referenced documentation URLs, API endpoints, environment configs, or Markdown templates.
* 🔀 **Snippet Composition & Merging (Merge Feature)**:
  * Combine modular snippets (e.g., "Greeting" + "Agenda" + "Closing") and copy them as a unified text with custom separators.

---

## 1. Basic Operations and List Screen (Snippet List / Home)

This is the main screen displayed when you launch the application. You can search for registered preset texts, copy them, and navigate to various actions from here.

### 1.1. Incremental Real-time Search and Highlighting
* **Text Search**: Entering keywords into the search box at the top filters the preset texts in real time using partial matches against "Title," "Body," "Description," and "ID."
* **Keyword Highlighting**: Text strings matching the search keywords are highlighted in yellow within the title and body.
* **Tag Search**: By clicking on a specific tag from the tag cloud (tag list) at the bottom, you can immediately toggle filtering for that tag.

### 1.2. Quick Copy and Notification
* Clicking the "📋 Copy" button on the right side of each row immediately copies the preset text body to the clipboard.
* Upon copying, a toast notification confirming the completion will appear at the top right of the screen for a few seconds.

### 1.3. Favorites (Pinning) Feature
* Clicking the pin icon (📌) placed on each preset text card registers that preset text to your favorites.
* Pinned preset texts are **always fixed and displayed at the very top of the list, regardless of the selected sorting criteria**.
* The border and background of the entire card are highlighted in Indigo (light blue), making access to frequently used preset texts significantly faster.

---

## 2. Modification Screen (Registration and Editing of New Preset Texts)

This screen is used to add new preset texts, and to edit or delete existing data.

### 2.1. Intelligent Tag Suggestion
* When you input the title or body of a preset text, the application analyzes tags registered in existing snippets in real time and automatically suggests up to 5 closely related tags as recommended tags.
* Simply click the suggested tags to assign them with a single touch, without typing in the input field.

### 2.2. Logical Deletion, Restoration, and Physical Deletion
* **Delete (Logical Deletion)**: 
  * Deleting preset texts that are no longer needed moves them to the trash can (past log archive), hiding them from the standard list.
* **Restoration / Permanent Deletion**:
  * Turning on the "Show deleted preset texts (past logs)" checkbox on the list screen loads the deleted data with a strikethrough.
  * From the edit screen, you can choose to either revert to the original state using "🔄 Restore from Archive" or completely and permanently purge the data from the database using "🗑️ Delete Permanently".

---

## 3. Advanced Integration Features

### 3.1. Difference Comparison Screen (Compare)
* **Overview**: A screen where you can visually compare the differences between exactly two preset texts side by side.
* **Key Use Cases**:
  * **AI Prompt Iteration Comparison**: Inspect exact additions or revisions between prompt versions and constraints.
  * **Email Variation Review**: Compare nuances between formal, polite, or concise drafts.
  * **Code & Configuration Diffs**: Pinpoint differences in parameters, flags, or configuration snippets.
* **Operation & Features**:
  * **Navigate by Selecting 2 Items**: Check two snippets on the list screen and click "Compare 2 items" to open the viewer.
  * **LCS Diff Viewer**: Based on the Longest Common Subsequence (LCS) algorithm, lines are highlighted with additions (green background) and removals/changes (red background).
  * **Dynamic Selection & Swap**: Select snippets on the fly via the left/right dropdowns, or flip their sides instantly using the "⇄ Swap Left/Right" button.
  * **Individual One-Click Copy**: Copy snippet A or snippet B directly from within the comparison screen.

### 3.2. Multiple Merge Screen (Merge)
* **Overview**: A screen to merge multiple selected preset texts in any order and with any separator to copy them all at once.
* **Key Use Cases**:
  * **Modular Email Assembly**: Chain "Greeting" + "Main Body / Agenda" + "Closing Remarks" into a complete email.
  * **Batch Command Chains**: Chain multiple Git or Docker commands into a single executable script or one-liner.
  * **Composite AI Prompts**: Assemble modular components ("Persona / System Role" + "Formatting Constraints" + "Task Instruction").
* **Operation & Features**:
  * **Dynamic Item Selection**: Toggle snippets dynamically using the checkboxes.
  * **Reordering**: Click "↑" and "↓" buttons to reorder snippets effortlessly.
  * **6 Separator Types**: Choose from Single Newline, Double Newline, Divider Line (`---`), Divider Line (`===`), Japanese Comma (`、`), or No Separator.
  * **Live Preview & Batch Copy**: Verify the merged output in the real-time preview box and click "Copy Result" to copy everything in one action.

---

## 4. Performance Meter and Usage Statistics (Analytics)

### 4.1. Usage Statistics (Analytics)
* **Total Copies**: Counts the cumulative number of times copy operations have been performed through the application.
* **Cumulative Time Saved**: Based on the character count of copied preset texts, it visualizes how much typing time has been saved in "hours, minutes, and seconds," **assuming that "typing one character takes 0.3 seconds"**.
* **Top 3 Frequently Used Preset Texts**: Displays the ranking, copy counts, and saved times of the top 3 preset texts with the highest copy counts to help identify your most valuable templates.

### 4.2. Database Performance Diagnosis
* **Database Item Count**: Check the count of active data, deleted data, estimated JSON size, etc.
* **100-Run Average Benchmark**: Runs the search process 100 times consecutively and measures real-time search performance in milliseconds.
* **Large Dataset Load Test**: Automatically generates dummy datasets of "1,000," "2,000," or "5,000" items temporarily, verifying that the app remains lightweight, responsive, and blazing fast under thousands of records (can be instantly reverted by clicking "Clear Dummy Data").

---

## 5. Data Backup (Import/Export)

Used when you want to migrate data to another PC or manually take backups.

* **Export (📤)**: Saves all current snippet data (including pinning and copy statistics) locally as a `snippets.json` file.
* **Import (📥)**: Select and load a saved JSON file to restore and overwrite the application database to the state of the past backup.
