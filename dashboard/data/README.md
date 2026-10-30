# Medicine catalogue

`medicine-catalogue.json.gz` contains only the fields used by medicine suggestions, for active entries from the user-provided `indian_medicine_data.json`. The user confirmed permission to use this dataset. No patient data is included.

Source SHA-256: `951cf45965da24b9763f32cd7b3ad5997220686042ea6e4bbae4dc35784af711` (imported 10 October 2026).

Normal dashboard builds regenerate the static prefix files from this compressed seed. To replace the catalogue with a new source:

```sh
bun scripts/generate-medicine-catalogue.mjs --source /path/to/indian_medicine_data.json
```

Commit the updated compressed seed and generated version module. The content-derived version changes the asset URLs, allowing immutable browser caching without mixing catalogue versions. Generated prefix files are excluded from Git and included in the deployment build. Keep older version directories locally if supporting an already-open old app during updates; ensure the total asset count stays under the hosting limit.

## Local catalogue on staff devices

The build also generates 50 bulk chunks (5,000 medicines each, except the last) with SHA-256 checksums in the manifest. Prefix files remain available while the local copy downloads or if device storage is unavailable. The format is included in the version hash; existing immutable assets are never overwritten with a different format.

Five seconds after the authenticated portal mounts, an idle task starts the download. A Web Worker verifies and writes each chunk to IndexedDB with indexes for names and composition words. The chunk and its resume checkpoint commit together. Only a fully indexed catalogue becomes searchable and triggers the completion toast. New versions are staged separately; the previous version is retired after successful completion. Web Locks coordinate downloads across tabs in supported browsers.

Persistent browser storage is requested after the catalogue is ready. Browsers decide whether to grant it; the portal still works with best-effort storage. Launch, returning to the tab, reconnecting, and visible-tab checks every minute verify the ready marker against the stored record count. Missing/cleared storage downloads again; interrupted downloads resume. A completed catalogue is checked and searched without a network request, including when connectivity is lost. If storage is blocked or full, online prefix search remains available, and the next check retries the download.

The local copy is scoped to this site's browser profile/storage area. It contains medicine data only. Closing the portal pauses unfinished work until it opens again. This feature also works in a PWA storage area, but does not add a service worker or make the rest of the portal available offline.

Validation: `bun test tests/medicine-catalogue.test.ts tests/medicine-local-db.test.ts` after generation checks bulk completeness/checksums, prefix files, resumable transactions, version replacement, composition search, and recovery after IndexedDB deletion.
