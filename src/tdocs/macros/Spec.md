# Overview
Design for TDocs macro system for automating actions.

# Macro Data Model
A macro has the following parts:
- Name
- List of Inputs (user can add/remove/rename and choose the type)
  - Name
  - Type
    - Text
    - Number
    - Boolean
- List of Actions
  - Command (name)
  - Comment
  - Arguments
    - Type - whether "value" or "ref"
    - Value (value) - hard-coded value
    - Ref (ref) - reference by name to macro input

# Action vs Command
A Command is an immutable defintion for a piece of functionality.
An Action is a usage of a Command within a Macro.

# Command Library
The list of possible commands within macros is specified by the command library,
the file src/tdocs/macros/command-list.json.

The top-level of this file is
```json
{
  "categories": {}
}
```

Each key within the categories is the name of one category and corresponds to
the list of tabs, such as "files", "smart-folders", etc.

The command key must be lowercase with optional dashes to separate words.

The parameters define the inputs to the command. For example, a file create command accepts a filename as input.

The outputs define the outputs that the command returns. For example, a directory create command returns the full path of the directory created.

Each category is
```json
{
  "{command-key}": {
    "label": "{User-friendly name of command}",
    "parameters": {
      "{parameter-key}": {
        "type": "{data-type}",
        "label": "{User-friendly parameter name}",
        "required": "{boolean}",
        "defaultValue": "{default-value}"
      }
    },
    "outputs": {
      "{output-key}": {
        "type": "{data-type}",
        "label": "{User-friendly output name}",
      }
    }
  }
}
```

The parameter key and output key must be lowercase with optional dashes to separate words.

The data types for parameters are:
- text
- number
- boolean

The "required" specifies whether the parameter is required or optional.

The "defaultValue" specifies the value of the parameter if one is not specified
when the command is used as an action within a macro.

# Storage
Macros are stored in local storage like other parts of TDocs.

# Macros Tab
The Macros tab allows the user to see the list of Macros, showing their names.

Macros can be
- Created - and manually edited
- Recorded - created by recording user actions for a period of time
- Renamed
- Deleted
- Played

Clicking on a macro in the list opens it in the macro editor.

# Macro Editor
The Macro Editor should be its own standalone React component in the src/tdocs/macros directory.

The name of the macro shows at the top of the page.
Below the name is a list of commands within the macro.

## Actions List
Users can add a new action to the list by clicking the plus icon and then choosing the command type from a list.
- The list is populated from the Command Library.
- The list has sections (command categories) and command types listed within each section (as bullet points)
- Both the sections and commands within each section are sorted alphabetically.

Users may reorder actions by dragging the grip area to the left of the expansion toggle. Dropping above or below an action inserts the dragged action at that position.

Users may delete an action by clicking the trash can icon to the right of the action/command name.

## Action Panel
The action panel should be a standalone React component.

By default the actions are collapsed and only show the command name.
To the left of the action name is a toggle arrow.
- When collapsed it looks like ">".
- When expanded it looks like "v".
Use appropriate arrow icons and animate the transition from one to another.
Clicking the arrow toggles the expanded/collapsed state.

When expanded, below the command name show:
- Comment - editable text field
- The list of arguments for the command

Each argument has
- Label - user-visible non-editable label (from command libary metadata)
- Name - internal stable key referring to this argument (from command libary metadata)
- Value - type of component depends on type of argument (from command libary metadata)
  - Text - text field
  - Number - number picker
  - Boolean - checkbox
- Checkbox labeled "From input" - controls command "type" (value or ref)
  - When checked (ref), the value box is replaced by a "Input" drop-down
  - The drop-down lists the macro inputs that have the same argument data type
  - Choosing one fills in the action's macro input ref

If the user does not specify the value for an argument but that argument is required according to the command's metadata, mark the value field as invalid.

# Recording Macros
New macros by be recorded by clicking the plus icon in the macros list then choosing "Record" (the other option is "Create Empty Macro").

After the user chooses a name, show a popup with OK / Cancel:
> Begin recording by clicking the red record icon
Show an example of what the icon looks like (a red circle).

If the user clicks OK, then hide the dialog and navigate to the Files tab. Show a floating Record box that stays on top no matter what part of the application is showing. The panel should have:
- Red circle (record button)
- X (closes and cancels recording)

Until the user either clicks the X or stops or cancels the recording, the Macros tab is disabled.

When the user clicks the record button, recording begins and the record icon
is replaced with a red square (stop and save recording). The X still shows (close and discard recording).

During recording, every time the user performs an action, it is added to the
macro currently being recorded and any parameter arguments for the action are also populated.

# Playing Macros
When the user plays a macro, a stop button is shown that remains floating on top of all other components in the application. Then TDocs automatically performs the actions specified by the macro. During this time, the user cannot interact with the application except for clicking the stop button. Clicking the stop button stops the macro from running further.
