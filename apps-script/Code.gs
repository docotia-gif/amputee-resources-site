// Amputee Resources — submission receiver (Google Apps Script web app).
// Deploy: script.google.com -> New project -> paste this -> Deploy -> New deployment
//   -> type "Web app" -> Execute as: Me -> Who has access: Anyone -> Deploy.
// Copy the Web app URL into submit.html (SUBMIT_ENDPOINT).

var SPREADSHEET_ID = '1Fnj-JkEB90BlWBy1-k5jpgrSKnHa4FNzrBuRGYc1iRQ';
var SHEET_NAME = 'Submissions';

function doPost(e) {
  var d = {};
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    d = e.parameter || {};
  }
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  sheet.appendRow([
    new Date(),
    d.name || '',
    d.category || '',
    d.resname || '',
    d.description || '',
    d.url || '',
    d.email || '',
    d.notes || ''
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Lets you open the URL in a browser to confirm the deployment is live.
function doGet() {
  return ContentService.createTextOutput('Amputee Resources submission endpoint is live.');
}
