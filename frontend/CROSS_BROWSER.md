# Cross-browser check: Detect this computer (Sprint 2)

Run with the backend and frontend started (`npm start` in `backend`, `npm run dev` in `frontend`), then open http://localhost:5173.

For each browser:

1. Log in as a user with **no devices**. The Dashboard empty state should offer **Detect this computer** (Chrome, Edge) or just **Add a device** (Safari, Firefox).
2. Go to **Add device** and click **Detect this computer**, or use the Dashboard shortcut, which runs it automatically.
3. Compare the filled-in values with the real system (**Apple menu → About This Mac**, or **Settings → System → About** on Windows).
4. Save. The device page should show **Detected automatically**, and the browser should appear under Installed software with a **Detected** label.

| Browser | Computer | Button | OS and version filled in | Browser and version filled in | Labels shown | Result | Tested by / date |
|---|---|---|---|---|---|---|---|
| Chrome | Mac | | | | | | |
| Edge | Mac | | | | | | |
| Safari | Mac | Disabled, with manual-entry message | n/a | n/a | n/a | | |
| Firefox | Mac | Disabled, with manual-entry message | n/a | n/a | n/a | | |
| Chrome | Windows 11 | | Should say Windows 11 | | | | |
| Edge | Windows 11 | | Should say Windows 11 | | | | |
| Chrome | Windows 10 | | Should say Windows 10 | | | | |

Mark each row Pass or Fail. For a Fail, add a short note on what you saw.
