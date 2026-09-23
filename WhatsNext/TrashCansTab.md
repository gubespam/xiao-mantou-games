
# Trash Cans Tab
- Change the "empty" confirmation to say "This will delete all files in this trash can forevermore."


## Reset Clock option
Implement the "reset clock" menu option in the trash cans tab, where it lists the files within the trash can. The menu item for "reset clock" should be enabled now and do the following:

It resets the timestamp that tracks when the file was deleted. The timestamp should be reset to the current time.

## Trash Cans Automations
When the root / main TDocs application page is opened, it checks the timestamp of when it last ran the automation for the trash cans tab. This timestamp is stored in the local storage key "tdocs-trash-cans-automation".

When the automation runs, the timestamp is updated. A setTimeout is also set to re-run the automation one hour from now, so that it checks again every hour.

The automation has two parts:
### Auto-Recover
For each trash can whose setting has "auto-recover", find any files within the trash can whose deletion timestamp is more than N time ago, where N is the amount of time in the trash can settings. For example, a trash can has auto-recover after 24 hours. The search would find any files whose deletion timestamp is older than 24 hours.

Once these files are found, then all of these files are recovered - i.e. moved back to the original directory from which they were deleted. If the original directory no longer exists, then re-create the intermediate directories nexessary so that the file can be moved there. If the directory does exist but another file already exists with the same name, then rename the file to have a " - recovered" suffix before the file extension. For example, "thefile.pdf" becomes "thefile - recovered.pdf".

### Auto-delete
Same as above, but the file is permanently deleted instead of being restored.
