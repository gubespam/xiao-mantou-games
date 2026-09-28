# Trash Cans

## Can list

The Trashes tab opens to a list of trash cans. Select a can to inspect its
contents; use the back arrow in the detail view to return to the list. Create a
can with the plus button. Can names must contain non-whitespace text and be
unique without regard to letter case. The action menu lets you rename a can or
open its settings.

A can can be deleted only when it is empty. To permanently remove the contents
of a non-empty can, choose **Empty** and confirm. Emptying a can permanently
deletes every item in it; it does not restore the items.

## Items in a can

Each item shows the filename it had when moved to the can. Its action menu
offers:

- **Restore** puts the item back in its original folder. If folders in that
	path no longer exist, they are recreated. If the original filename is
	already present in the destination, the restored item receives a
	`- recovered` suffix (before the extension when there is one).
- **Delete forevermore** permanently removes the item from the can after
	confirmation.
- **Reset clock** sets the item's deletion time to now. This restarts the age
	used by the can's automation settings.

When an item is moved from Files to a can, TDocs stores the item's data, its
original folder path and filename, and the time it was moved. Restoring removes
the item from the can; it does not discard the item's file or folder contents.

## Can settings

Open **Settings...** from a can's action menu to choose what happens to old
items: **Do nothing**, **Auto-delete**, or **Auto-recover**. Auto-delete
permanently removes expired items. Auto-recover restores expired items to their
original folders. For either automated action, choose an age of **24 hours**,
**1 week**, or **30 days**. The settings window has Save and Cancel actions.
See [Trash Can Automation](Trash-Can-Automation/Trash-Can-Automation.md) for
when these rules run and how item age is evaluated.