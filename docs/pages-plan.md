# Little City workspace plan

## First version: Pages

Purpose: keep useful notes next to the work that grows your city.

- Three main destinations: City, Today, Pages. Existing Projects remain available inside Pages.
- Create and title pages. Add text, headings, bullets, and interactive checklists. Reorder blocks with buttons.
- Optionally attach a page to an existing project. Search titles and content, filter by project, newest edits first.
- Archive and restore pages. Do not permanently delete writing in this version.
- Autosave on this device; include pages in existing JSON exports/imports and recovery copies.
- Existing city and factory backups load with an empty page collection. Reset also clears pages.
- Notes and checkboxes do not earn cash. Task completion and study keep their existing rewards.

Acceptance: create/edit several pages, find text in the body, filter, reorder and check items, archive/restore, reload, export/import, and confirm existing city/tasks survive. Check 390 × 844 layout and no horizontal overflow. Failures to save must remain visible; export must work from in-memory state.

This version keeps data in the browser, with no account, uploads, sharing, or calendar. It is suitable for text notes; browser storage is finite. Real iPhone keyboard and Safari checks remain necessary.

## Next: task dates and Calendar

1. Add optional date-only due dates to tasks; preserve Today's manual selection.
2. Define Today/overdue behavior without penalties or automatically inflating task rewards.
3. Build a month view and a selected-day agenda using the same tasks (no duplicate calendar copies).
4. Add events with start/end times separately from task deadlines; decide timezone and all-day behavior.
5. Verify date boundaries, daylight saving changes, backup migration, and phone interactions.

## After Calendar

- Link tasks to pages and show associated tasks inside a page/project.
- Add small templates only after observing recurring uses (class notes, project plans, journal).
- Test larger note libraries; consider IndexedDB and portable text exports before supporting attachments.
- Choose an account/sync approach if cross-device use becomes a priority. Resolve concurrent edits and recovery before promising sync.
- Consider external calendar connections only after the internal calendar is useful.

Ship in stages. Keep the city reward loop independent from note length, writing frequency, and calendar attendance.
