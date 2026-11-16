/**
 * GTracker Web App (container-bound to "GTracker - Registro Gym").
 * Pure logic lives in lib.js; this file only talks to Apps Script services.
 */

var REGISTRO = 'Registro';
var EJERCICIOS = 'Ejercicios';
var SYNC = '_sync';

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function tokenOk_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty('TOKEN');
  return !!expected && token === expected;
}

function doGet(e) {
  var token = e && e.parameter && e.parameter.token;
  if (!tokenOk_(token)) return json_({ ok: false, error: 'unauthorized' });

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone();
  var reg = ss.getSheetByName(REGISTRO);
  var cat = ss.getSheetByName(EJERCICIOS);
  var regLast = reg.getLastRow();
  var catLast = cat.getLastRow();
  var registroRows = regLast >= 2 ? reg.getRange(2, 1, regLast - 1, 10).getValues() : [];
  var catalogRows = catLast >= 2 ? cat.getRange(2, 1, catLast - 1, 4).getValues() : [];
  var today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

  var state = computeState(registroRows, catalogRows, today, tz);
  state.ok = true;
  return json_(state);
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'invalid JSON body' });
  }
  if (!tokenOk_(body && body.token)) return json_({ ok: false, error: 'unauthorized' });
  var entries = body.entries;
  if (!Array.isArray(entries)) return json_({ ok: false, error: 'entries must be an array' });

  // Validate everything before writing anything.
  try {
    entries.forEach(function (entry) { validateEntry(entry); });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sync = ss.getSheetByName(SYNC) || createSync_(ss);
    var syncLast = sync.getLastRow();
    var known = {};
    if (syncLast >= 1) {
      sync.getRange(1, 1, syncLast, 1).getValues().forEach(function (r) { known[r[0]] = true; });
    }

    var saved = [];
    var duplicates = [];
    var rows = [];
    var syncRows = [];
    var now = new Date();
    entries.forEach(function (entry) {
      if (known[entry.id]) {
        duplicates.push(entry.id);
        return;
      }
      known[entry.id] = true; // duplicate ids inside one request
      entryToRows(entry).forEach(function (r) {
        var p = parseIsoDate(r[0]);
        r[0] = new Date(p.y, p.m - 1, p.d); // local midnight
        rows.push(r);
      });
      saved.push(entry.id);
      syncRows.push([entry.id, now]);
    });

    if (rows.length) {
      writeRows_(ss.getSheetByName(REGISTRO), rows);
      sync.getRange(sync.getLastRow() + 1, 1, syncRows.length, 2).setValues(syncRows);
      SpreadsheetApp.flush();
    }
    return json_({ ok: true, saved: saved, duplicates: duplicates });
  } finally {
    lock.releaseLock();
  }
}

/** Appends rows at the first empty row, writing only A,B,C,E,G:H,J (never D/F/I). */
function writeRows_(sheet, rows) {
  var n = rows.length;
  var maxRows = sheet.getMaxRows();
  var cValues = sheet.getRange(2, 3, Math.max(maxRows - 1, 1), 1).getValues();
  var start = maxRows + 1; // default: right after the grid
  for (var i = 0; i < cValues.length; i++) {
    if (cValues[i][0] === '' || cValues[i][0] === null) { start = i + 2; break; }
  }
  var end = start + n - 1;

  if (end > maxRows) sheet.insertRowsAfter(maxRows, end - maxRows);

  // Last row that still has the Serie formula in column D.
  var dFormulas = sheet.getRange(2, 4, Math.max(maxRows - 1, 1), 1).getFormulas();
  var lastFormulaRow = 1;
  for (var k = dFormulas.length - 1; k >= 0; k--) {
    if (dFormulas[k][0] !== '') { lastFormulaRow = k + 2; break; }
  }
  if (lastFormulaRow >= 2 && end > lastFormulaRow) {
    var from = Math.max(start, lastFormulaRow + 1);
    var count = end - from + 1;
    [4, 6, 9].forEach(function (col) {
      sheet.getRange(lastFormulaRow, col).copyTo(sheet.getRange(from, col, count, 1));
    });
  }

  var col = function (idx) { return rows.map(function (r) { return [r[idx]]; }); };
  sheet.getRange(start, 1, n, 3).setValues(rows.map(function (r) { return [r[0], r[1], r[2]]; }));
  sheet.getRange(start, 5, n, 1).setValues(col(4));
  sheet.getRange(start, 7, n, 2).setValues(rows.map(function (r) { return [r[6], r[7]]; }));
  sheet.getRange(start, 10, n, 1).setValues(col(9));
}

function createSync_(ss) {
  var sheet = ss.insertSheet(SYNC);
  sheet.getRange(1, 1, 1, 2).setValues([['id', 'timestamp']]);
  sheet.hideSheet();
  return sheet;
}

/** Run once from the editor. Creates the token, the hidden _sync sheet and fixes number formats. */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TOKEN');
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('TOKEN', token);
  }
  Logger.log('TOKEN: ' + token);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  // doPost writes dates at local midnight of the script time zone; both must match or days shift.
  if (ss.getSpreadsheetTimeZone() !== Session.getScriptTimeZone()) {
    Logger.log('WARNING: spreadsheet time zone ' + ss.getSpreadsheetTimeZone() + ' differs from script time zone ' +
      Session.getScriptTimeZone() + '. Set File > Settings > Time zone in the Sheet to match.');
  }
  var sync = ss.getSheetByName(SYNC);
  if (!sync) createSync_(ss);
  else sync.hideSheet();

  var formats = [[REGISTRO, 'E2:E'], ['Marcas', 'F6:F65'], ['Marcas', 'H6:H65'], ['Progreso', 'C5:C44']];
  formats.forEach(function (f) {
    var sheet = ss.getSheetByName(f[0]);
    if (sheet) sheet.getRange(f[1]).setNumberFormat('General');
    else Logger.log('Sheet not found, skipped: ' + f[0]);
  });

  Logger.log('Next: Deploy > New deployment > Web app (Execute as: Me, Access: Anyone), then copy the /exec URL.');
}

/** Replaces the token; paste the new one in the app Setup screen. */
function rotateToken() {
  var token = Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('TOKEN', token);
  Logger.log('NEW TOKEN: ' + token);
}
