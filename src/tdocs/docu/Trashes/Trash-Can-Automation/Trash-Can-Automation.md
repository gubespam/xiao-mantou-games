# Trash Can Automation

## When it runs

TDocs checks whether automation is due when the application starts. It records
the last run in browser local storage and schedules another check for the next
hourly interval. If the saved run time is less than an hour ago, startup waits
only for the remainder of that interval before running again. The timer runs
only while TDocs is open; closing the application pauses checks until it is
opened again.

## Per-can rules

Each trash can has its own action and age threshold, configured from the can's
**Settings...** menu:

- **Do nothing** leaves its items in the can.
- **Auto-delete** permanently removes items older than the selected threshold.
- **Auto-recover** removes expired items from the can and restores them to
	their original location.

Available thresholds are **24 hours**, **1 week**, and **30 days**. Age is
measured from the item's saved deletion timestamp, not from the last time
automation ran. **Reset clock** updates that timestamp to the current time.

For Auto-recover, TDocs recreates missing folders along the item's original
path. If an item with the same name is already in the destination, the restored
item gets a `- recovered` suffix (before the extension when there is one).

Automation updates the trash cans and file tree stored in the current browser's
local data. It does not run as a background service while the application is
closed.