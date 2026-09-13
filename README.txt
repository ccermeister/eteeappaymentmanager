ETEEAP LEDGER — Collections Record
====================================

WHAT THIS IS
A self-contained web app for tracking student payments (Cebu Tour,
T-shirt, or any other payable you create). No installation and no
internet connection required after you unzip it.

HOW TO OPEN IT
Double-click "index.html". It will open in your default web browser
(Chrome, Edge, or Firefox all work well).

WHERE THE DATA IS STORED
All students, payables, payments, and logs are saved in your browser's
local storage, tied to this file's location on this computer. That means:
  - Data stays even after you close the browser or restart your computer.
  - Data is NOT synced anywhere else — it lives only in this browser,
    on this device.
  - If you need everyone (admin, treasurer, viewer) to see the same
    live data, open and use the app from the SAME computer/browser, or
    have one person record entries and periodically share this folder.
  - Clearing your browser's site data/cache for this file, or opening
    it in a different browser or a private/incognito window, will show
    an empty ledger.
  - Do not rename or move index.html to a different folder path
    afterwards without also moving styles.css and app.js with it —
    they need to stay together in the same folder.

LOGIN ACCOUNTS
  Admin      username: christian         password: cervantes
  Treasurer  username: eteeapofficer     password: ETEEAP2026
  Viewer     username: eteeap            password: eteeap

WHAT EACH ROLE CAN DO
  Admin      Full access: create/edit/delete students, payables, and
             payment records; reviews and finalizes the treasurer's
             correction requests; sees the full audit log.
  Treasurer  Can add/edit students and payables, and record payments.
             Cannot delete anything. If a payment was entered wrong,
             the treasurer files a "request edit" that the admin
             reviews and finalizes.
  Viewer     Read-only: browse student profiles, amounts paid, and
             totals. No editing controls are shown.

GETTING STARTED
  1. Sign in as christian (admin) or eteeapofficer (treasurer).
  2. Go to Payables → Add payable (e.g. "Cebu Tour", ₱10,000, with a
     deadline). It automatically applies to every student.
  3. Go to Students → Add student for each name.
  4. Open a student's profile to record a payment against any
     payable — partial or full. The remaining balance and status
     update automatically, and it's logged in that student's
     payment history tab.
  5. The Dashboard always reflects live totals per payable and
     overall collections.

Everything above was generated to match the request as described;
adjust wording, colors, or fields directly in the files if you'd
like something changed.
