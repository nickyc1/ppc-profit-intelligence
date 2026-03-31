/**
 * PPC Intelligence Landing Page — Email Collection Webhook
 *
 * SETUP (5 minutes):
 * 1. Create a new Google Sheet — name it "PPC Intelligence Leads"
 * 2. Add headers in row 1: Timestamp | Email | Name
 * 3. Go to Extensions → Apps Script
 * 4. Paste this entire file, replacing the default code
 * 5. Click Deploy → New Deployment
 *    - Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the deployment URL
 * 7. Paste it into your landing page HTML where it says REPLACE_WITH_YOUR_APPS_SCRIPT_URL
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    sheet.appendRow([
      new Date().toISOString(),
      data.email || "",
      data.name || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "Webhook is live" }))
    .setMimeType(ContentService.MimeType.JSON);
}
