**English** | [日本語版](../ja/USER_GUIDE.md)

# Operation Manual & User Guide (USER_GUIDE.md)

This document is the user manual explaining the usage and operation procedures for each function of the "Preset Text Clipboard Manager (SnippetFlow)".

---

## 1. Basic Operations and List Screen (Snippet List / Home)

This is the main screen displayed when you launch the application. You can search for registered preset texts, copy them, and navigate to various actions from here.

### 1.1. Incremental Real-time Search and Highlighting
* **Text Search**: Entering keywords into the search box at the top filters the preset texts in real time using partial matches against "Title," "Body," "Description," and "ID."
* **Keyword Highlighting**: Text strings matching the search keywords are highlighted in yellow within the title and body.
* **Tag Search**: By clicking on a specific tag from the tag cloud (tag list) at the bottom, you can immediately toggle filtering for that tag.

### 1.2. Quick Copy and Notification
* Clicking the "📋 Copy" button on the right side of each row immediately copies the preset text body to the clipboard.
* Upon copying, a notification confirming the completion will appear at the top of the screen (a toast notification in the React version, and in the header in the egui version) for a few seconds.

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
* **Operation**: Select two preset texts using the checkboxes on the list screen and click "Compare 2 items" to navigate to this screen.
* **LCS Diff Viewer**: Based on the Longest Common Subsequence (LCS) algorithm, the viewer highlights added text (green background) and deleted/changed text (red background) line by line.
* **Dynamic Swap & Left-Right Swap**: You can change the comparison targets on the spot using the dropdowns in the screen, or instantly swap their positions using the "⇄ Swap Left/Right" button.

### 3.2. Multiple Merge Screen (Merge)
* **Overview**: A screen to merge multiple selected preset texts in any order and with any separator to copy them all at once.
* **Order Adjustment**: You can dynamically add or remove snippets to merge using checkboxes, and freely change the order of merging using the "↑" and "↓" buttons.
* **Separator Selection**: 
  * You can select from 6 types of separators: Single Newline, Double Newline, Divider Line (`---`), Divider Line (`===`), Japanese Comma (`、`), or No Separator.
* **Preview**: A real-time preview of the merged text is displayed, and you can copy the entire result using the "Copy Result" button.

---

## 4. Performance Meter and Usage Statistics (Analytics)

### 4.1. Database Performance Diagnosis
* **Database Item Count**: You can check the count of active data, deleted data, estimated JSON size, etc.
* **100-Run Average Benchmark**: Runs the search process 100 times consecutively and measures the real-time search performance in milliseconds.
* **Large Dataset Load Test**: Automatically generates dummy data of "1,000," "2,000," or "5,000" items temporarily, allowing you to experience and verify that the application runs smoothly and comfortably even under thousands of items.

### 4.2. Usage Statistics (Analytics)
* **Total Copies**: Counts the cumulative number of times copy operations have been performed through the application.
* **Cumulative Time Saved**: Based on the character count of copied preset texts, it visualizes how much typing time has been saved in "hours, minutes, and seconds," **assuming that "typing one character takes 0.3 seconds"**.
* **Top 3 Frequently Used Preset Texts**: Displays the ranking, copy counts, and saved times of the top 3 preset texts with the highest copy counts.

---

## 5. Data Backup (Import/Export)

Used when you want to migrate data to another PC or manually take backups.

* **Export (📤)**: Saves all current snippet data (including pinning and copy statistics) locally as a `snippets.json` file.
* **Import (📥)**: Select and load a saved JSON file to restore and overwrite the application database to the state of the past backup.
