# jordan-pai-site

Static copy of the site for public hosting (GitHub Pages or any static host).

## 1. Replace the placeholder domain
Currently set to https://brinyorpheus446.github.io/jordan-pai-site. When you get a custom domain, replace that URL in index.html, 404.html, robots.txt and sitemap.xml, and change `<base href>` in 404.html to `/`.

## 2. Connect the Google Sheet (sign-ups + visit counts)
1. Create a new Google Sheet in the whypaiofficial@gmail.com account, e.g. "Website sign-ups".
2. In the Sheet: Extensions > Apps Script. Delete the sample code, paste all of `google-apps-script/Code.gs`, save.
3. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone. Deploy, approve the permissions (Sheets + send email).
4. Copy the web app URL (starts with https://script.google.com/macros/s/.../exec) into `config.js`.
5. Open the site, submit a test sign-up, and check that a "Signups" tab appears and you get an email. Delete the test row.

If you later edit Code.gs, use Deploy > Manage deployments > Edit > New version, so the URL stays the same.

## 3. Host it with HTTPS
GitHub Pages: push this folder to a repo, Settings > Pages > deploy from the main branch, add your custom domain, tick "Enforce HTTPS".
