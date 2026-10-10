# General Guidance
Always use dark mode for visual components, unless user specifies otherwise.

As new user-facing features are added to TDocs (src/tdocs/**) or significant changes made to existing features
always update the documentation Markdown files in src/tdocs/docu.

Keep the CSS for given component in a file with the same name as the component. TheCoponent.jsx -> TheComponent.css.
Avoid TDocs.css except for code in TDocs.jsx.

# Execution Plans
When working on a large-scale change, create an execution plan in `/exec-plans/{task}.md`
based on the template below:

```
# Goal
The overall goal to be achieved for this task.

# Current State
The current state of the implementation up to this point.

# Next Step
The next step that needs to be done.

# Milestones
- A bullet point list of tasks to be completed in order to accomplish the goal
- When a milestone has been completed, keep it in the list, prefixed with a "√ "

# New Learnings
New caveats for surprises learned during implementation.
```

The execution plan is a living document; keep the execution plan up to date as work progresses.