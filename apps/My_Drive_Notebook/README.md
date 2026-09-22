# My Drive Notebook v0.6 — drive.file

Target:
`https://herhery-star.github.io/My-Tools/apps/My_Drive_Notebook/`

## What changed from v0.5

- OAuth scope changed from broad `drive` to `drive.file`.
- Google Picker is now actually wired into the `Pilih dari Google Drive` button.
- Picker uses the same OAuth token, API Key, and Project Number/App ID.
- The app is explicit about the per-file access model.
- PWA manifest and service worker included.
- Manual Workspace upload/overwrite flow remains controlled by the user.

## Important Google Cloud step

In:
Google Auth Platform → Data Access → Add or remove scopes

add:

`https://www.googleapis.com/auth/drive.file`

Google classifies `drive.file` as a non-sensitive scope and recommends it when possible. It allows the app to create or modify files that the user opens with the app or shares with the app through Google Picker.

## Credentials

1. OAuth 2.0 Client ID — Web application
2. API Key — restricted to:
   - `https://herhery-star.github.io/*`
   - `https://docs.google.com/*`
   and restricted to:
   - Google Picker API
   - Google Drive API
3. Project Number / App ID — the Cloud project number

## Important behavior in v0.6

Because the app now uses `drive.file`, it does NOT request blanket access to every file in Drive. The Google Picker is the intended way to grant the app access to specific files.

This means the old v0.5 concept of freely listing every file in My Drive should not be treated as guaranteed under `drive.file`. Use the Picker to select files/folders the app should work with.

## Security

- Never put a Client Secret in the HTML.
- Keep the API key restricted.
- Test with non-critical files first.
- There is no continuous background sync.
