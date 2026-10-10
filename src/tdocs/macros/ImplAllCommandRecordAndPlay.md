Implement recording and playback for all of the remaining commands in the command library for all tabs other than Smart Folders. 

# Implementation Approach
Approach this strictly in groups of command, one group per application tab for trashes, files, edit files, documentation.
Always implement in this order:
1. Implement recording of commands for the current tab.
2. Plan, write and run tests for recording. These should verify that the recorded actions are present in the macro editor and have the correct arguments.
3. Implement playback of commands for the current tab.
4. Plan, write and run tests for playback. Should should verify that running the macro has the correct side effects.

Do not progress to the next implmentation step until the previous tests all pass.

# Documentation Tab
Implement the Documentation tab first because this is the simplest. Implement these tests:
- Recording:
  - Record a macro for opening a documentation page.
  - Edit the macro to accept the documentation page name and section name as macro input parameters.
- Playback:
  - Run the macro above, supplying a different documentation page and section.

# Edit File Tab
- Setup fixture:
  - Create a new file
- Recording:
  - Edit the file content, including tabbing new lines for indentation and multiple lines
- Playback
  - Change the editing commands of the macro
  - Verify the file content changes as expected after playing the macro

# All Other Tabs

For all other tabs, implement tests that follow this general shape:
- Recording:
  - Create an object, edit it and delete it
- Playback
  - Before running playback, remove the delete action from the macro and manually remove the object (or clear the localStorage for the AI-driven playwright session).
  - Verify the object is created and mutated as expected after playing the macro.

Keep the tests simple (don't need to be exhaustive over all actions and permutations) but should cover a representative set of cases and should verify correctness of macro input parameters used as arguments to actions.
