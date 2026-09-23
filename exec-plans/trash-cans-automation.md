# Goal
Implement the trash cans automation feature and ensure it runs on the main TDocs page according to the configured trash can settings.

# Current State
The trash cans tab already tracks deleted items with timestamps and supports settings for auto-delete and auto-recover, but the automation loop and scheduled trigger are not implemented.

# Next Step
Add the automation scheduler and the logic that processes expired trash items based on each trash can's settings.

# Milestones
- [ ] Inspect the trash can data model and restore logic
- [ ] Implement the scheduled automation runner and storage timestamp behavior
- [ ] Validate the resulting build and fix any compile issues

# New Learnings
The existing restore path helper needed to be strengthened so missing parent folders are recreated and name collisions are resolved with a recovered suffix before the extension.
