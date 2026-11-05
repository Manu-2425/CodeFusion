# Cross-browser check: Detect this computer (Sprint 2)

Run with the backend and frontend started (`npm start` in `backend`, `npm run dev` in `frontend`), then open http://localhost:5173.

For each browser:

1. Log in as a user with **no devices**. The Dashboard empty state should offer **Detect this computer** (Chrome, Edge) or just **Add a device** (Safari, Firefox).
2. Go to **Add device** and click **Detect this computer**, or use the Dashboard shortcut, which runs it automatically.
3. Compare the filled-in values with the real system (**Apple menu → About This Mac**, or **Settings → System → About** on Windows).
4. Save. The device page should show **Detected automatically**, and the browser should appear under Installed software with a **Detected** label.

| Browser | Computer | Button | OS and version filled in | Browser and version filled in | Labels shown | Result | Tested by / date |
|---|---|---|---|---|---|---|---|
| Chrome | Mac | Shown on empty dashboard and Add device; dashboard shortcut ran detection automatically | macOS 26.6.2 (matches the version entered from About This Mac) | Google Chrome 156.0.8078.80 | "Detected automatically" on device page; "Detected" on browser and in Dashboard inventory | **Pass** | Tezesh, Nov 4, 2026 |
| Edge | Mac | | | | | Not tested | |
| Safari | Mac | Not shown on empty dashboard (only "Add a device"); disabled on Add device with manual-entry message | n/a | n/a | n/a | **Pass** | Tezesh and Manu, Nov 4, 2026 |
| Firefox | Mac | | | | | Not tested | |
| Chrome | Windows 11 | | Should say Windows 11 | | | Not tested: no Windows device available yet | |
| Edge | Windows 11 | | Should say Windows 11 | | | Not tested: no Windows device available yet | |
| Chrome | Windows 10 | | Should say Windows 10 | | | Not tested: no Windows device available yet | |

Mark each row Pass or Fail. For a Fail, add a short note on what you saw.

Notes:
- Tested on localhost with the backend and frontend from the detect-dashboard branch.
- The Chrome browser version was read from the browser by the app; it was not separately compared with Chrome's About page.
- Edge and Firefox rows can be filled in once those browsers are installed on the test Mac.
