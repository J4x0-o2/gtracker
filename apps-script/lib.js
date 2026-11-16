/**
 * Pure helpers for the GTracker backend. No Apps Script globals here so the
 * file can be unit tested under Node (see tests/apps-script/lib.test.ts).
 */

var ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

function parseIsoDate(s) {
  var m = ISO_RE.exec(String(s));
  if (!m) throw new Error('Invalid date "' + s + '", expected yyyy-mm-dd');
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

/** Normalizes a Date (local time, or `tz` via Utilities when given) or an ISO string to yyyy-mm-dd. */
function toIsoDate(value, tz) {
  if (value instanceof Date) {
    if (tz && typeof Utilities !== 'undefined') {
      return Utilities.formatDate(value, tz, 'yyyy-MM-dd');
    }
    return value.getFullYear() + '-' + pad2(value.getMonth() + 1) + '-' + pad2(value.getDate());
  }
  var p = parseIsoDate(String(value).slice(0, 10));
  return p.y + '-' + pad2(p.m) + '-' + pad2(p.d);
}

function isBlank(v) {
  return v === '' || v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
}

function computeState(registroRows, catalogRows, todayIso, tz) {
  var history = {};
  var last = null;

  for (var i = 0; i < registroRows.length; i++) {
    var r = registroRows[i];
    var name = r[2];
    if (isBlank(name) || isBlank(r[0])) continue;
    var date = toIsoDate(r[0], tz);
    var set = { weight: Number(r[4]), reps: Number(r[6]), rir: Number(r[7]) };
    // Prefer the sheet's 1RM formula value; compute it when the cell is still empty.
    var orm = isBlank(r[8])
      ? Math.round(set.weight * (1 + (set.reps + (set.rir || 0)) / 30) * 10) / 10
      : Number(r[8]);

    if (!last || date >= last.date) last = { date: date, routine: String(r[1]) };

    var h = history[name];
    if (!h) h = history[name] = { lastDate: date, lastSets: [], best1rm: 0 };
    if (date > h.lastDate) {
      h.lastDate = date;
      h.lastSets = [];
    }
    if (date === h.lastDate) h.lastSets.push(set);
    if (isFinite(orm) && orm > h.best1rm) h.best1rm = orm;
  }

  var exercises = [];
  for (var j = 0; j < catalogRows.length; j++) {
    var c = catalogRows[j];
    if (isBlank(c[0])) break;
    exercises.push({ name: String(c[0]), group: String(c[1]), unit: String(c[2]), routine: String(c[3]), order: j });
  }

  return {
    today: todayIso,
    lastSession: last,
    nextRoutine: last && last.routine === 'A' ? 'B' : 'A',
    exercises: exercises,
    history: history,
  };
}

function validateEntry(entry) {
  if (!entry || typeof entry !== 'object') throw new Error('Entry must be an object');
  if (isBlank(entry.id)) throw new Error('Entry id is required');
  if (isBlank(entry.exercise)) throw new Error('exercise is required');
  if (entry.routine !== 'A' && entry.routine !== 'B') throw new Error('routine must be A or B');
  parseIsoDate(entry.date); // throws "Invalid date ..."
  var sets = entry.sets;
  if (!Array.isArray(sets) || sets.length < 1 || sets.length > 3) {
    throw new Error('sets must contain between 1 and 3 items');
  }
  sets.forEach(function (s, i) {
    var n = i + 1;
    if (typeof s.weight !== 'number' || !(s.weight > 0)) throw new Error('weight must be > 0 (set ' + n + ')');
    if (!Number.isInteger(s.reps) || s.reps < 1) throw new Error('reps must be an integer >= 1 (set ' + n + ')');
    if (!Number.isInteger(s.rir) || s.rir < 0 || s.rir > 10) throw new Error('rir must be an integer 0-10 (set ' + n + ')');
  });
}

/** Rows for columns A..J; D (Serie), F (Unidad) and I (1RM) stay null: the sheet formulas own them. */
function entryToRows(entry) {
  validateEntry(entry);
  return entry.sets.map(function (s, i) {
    return [
      entry.date, entry.routine, String(entry.exercise).trim(), null,
      s.weight, null, s.reps, s.rir, null,
      i === 0 && entry.note ? String(entry.note) : '',
    ];
  });
}

if (typeof module !== 'undefined') {
  module.exports = { parseIsoDate: parseIsoDate, toIsoDate: toIsoDate, computeState: computeState, entryToRows: entryToRows, validateEntry: validateEntry };
}
