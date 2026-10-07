// =====================================================================
// PageFolders.js  (NEW FILE - nothing else in the project is edited)
// Builds a "Page Plan" sheet (primary + spare images per page slot) from
// Book Final Layout + the candidate sheet, then syncs one Drive folder
// per page/spread with the primary and spare images inside.
// All names are prefixed pf / PF_ to avoid V8 global-namespace clashes.
// =====================================================================

// ===== SECTION 1: CONFIG =====
const PF_CFG = {
  LAYOUT_SHEET: 'Book Final Layout',
  SOURCE_SHEET: 'Final Book Image Possibilities', // switch to 'Book Image Balance' once it holds 250-300
  MEDIA_SHEET: 'Media Database',                  // used only for Date Taken (joined by File ID)
  PLAN_SHEET: 'Page Plan',
  ROOT_FOLDER_NAME: 'Book Pages',
  SPARES_PER_SINGLE: 2,   // spares for a 1-image page; dual pages get 1 spare per slot
  SPREAD_MIN_ASPECT: 1.45,// below this a full-bleed spread crops heavily
  MIN_GAP_SECONDS: 120,   // spare must be >2 min from its primary (avoids near-duplicates)
  USE_COPIES: false,      // false = Drive shortcuts (no extra storage); true = real copies
  TIME_BUDGET_MS: 5 * 60 * 1000
};
const PF_GRADE_BONUS = { S: 15, A: 8, B: 0 };
const PF_PRINT_BONUS = { Excellent: 6, Good: 3 };
const PF_PLAN_HEADERS = ['Page', 'Slot', 'Role', 'File Name', 'File ID', 'Year', 'Date Taken', 'Category',
  'Grade', 'Editorial Score', 'Orientation', 'Aspect', 'Caption', 'Flags', 'Locked', 'Folder', 'Section'];

// ===== SECTION 2: MENU HOOKS (add these two lines to your existing menu in Menu.js) =====
//   .addItem('Build Page Plan', 'pfBuildPagePlan')
//   .addItem('Sync Page Folders', 'pfSyncPageFolders')

// ===== SECTION 3: SHEET HELPERS =====
function pfReadSheet_(name, optional) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) { if (optional) return []; throw new Error('Missing sheet: ' + name); }
  const v = sh.getDataRange().getValues();
  if (v.length < 2) return [];
  const h = v[0].map(String);
  return v.slice(1).map(function (row) {
    const o = {};
    h.forEach(function (k, i) { o[k] = row[i]; });
    return o;
  });
}
function pfNormCat_(c) { return String(c || '').replace('Artwork & Burns', 'Artworks & Burns').trim(); }
function pfIsTrue_(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }
function pfParseDate_(s, year) {
  if (s instanceof Date) return s;
  const m = String(s || '').match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (m) return new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  return year ? new Date(+year, 0, 1) : null;
}
function pfFmtDate_(d) {
  return d ? Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') : '';
}

// ===== SECTION 4: SLOTS FROM LIVE LAYOUT (quota never hardcoded) =====
function pfBuildSlots_(layoutRows) {
  const slots = [];
  layoutRows.forEach(function (r) {
    const lt = String(r['Layout Type']), st = String(r['Status']);
    if (st === 'Already created' || ['Text', 'Cover', 'Full spread', ''].indexOf(lt) > -1) return;
    if (lt === 'Full bleed' && r['Position'] === 'Right') return; // right half of a spread
    const page = Number(r['Page']);
    const hero = lt === 'Full bleed';
    const n = /^Dual/.test(lt) ? 2 : 1;
    const neutral = /category-neutral|absolute best/i.test(String(r['Notes']));
    const m = String(r['Image Spread']).match(/^(\d+)-(\d+)$/);
    const pages = hero && m ? ('P' + pad3_(m[1]) + '-' + pad3_(m[2])) : ('P' + pad3_(page));
    for (let i = 0; i < n; i++) {
      slots.push({
        page: page, pages: pages, slot: n === 2 ? (i ? 'B' : 'A') : 'A', hero: hero,
        category: neutral ? 'ANY' : pfNormCat_(r['Category']),
        orient: hero ? 'Landscape' : String(r['Orientation']),
        section: String(r['Section']), dual: n === 2,
        folder: pages + ' ' + String(r['Section']).replace(/[\/\\]/g, '-')
      });
    }
  });
  return slots;
}
function pad3_(n) { return ('000' + n).slice(-3); }

// ===== SECTION 5: CANDIDATE POOL =====
function pfBuildPool_() {
  const dates = {};
  pfReadSheet_(PF_CFG.MEDIA_SHEET, true).forEach(function (r) { dates[r['File ID']] = r['Date Taken']; });
  return pfReadSheet_(PF_CFG.SOURCE_SHEET).filter(function (r) {
    return r['File ID'] && PF_GRADE_BONUS[String(r['Grade'])] !== undefined; // S/A/B only
  }).map(function (r) {
    const sui = String(r['Layout Suitability']), ori = String(r['Orientation']);
    const mismatch = (/Portrait/.test(sui) && ori === 'Landscape') || (/Landscape/.test(sui) && ori === 'Portrait');
    return {
      id: r['File ID'], name: r['File Name'], year: r['Year'], cat: pfNormCat_(r['Category']),
      grade: String(r['Grade']), score: Number(r['Editorial Score']) || 0, orient: ori,
      aspect: Number(r['Aspect Ratio']) || 0, caption: r['Caption'] || '', hero: pfIsTrue_(r['Hero']),
      print: String(r['Print Suitability']), mismatch: mismatch,
      date: pfParseDate_(dates[r['File ID']], r['Year'])
    };
  });
}

// ===== SECTION 6: ASSIGNMENT (pure logic) =====
function pfScore_(c, slot) {
  let s = c.score + (PF_GRADE_BONUS[c.grade] || 0) + (PF_PRINT_BONUS[c.print] || 0);
  if (slot.hero && c.hero) s += 20;
  if (slot.hero && c.aspect < PF_CFG.SPREAD_MIN_ASPECT) s -= 30;
  if (c.mismatch) s -= 15;
  return s;
}
function pfEligible_(c, slot, used) {
  if (used[c.id]) return false;
  if (c.orient !== slot.orient) return false;
  return slot.category === 'ANY' || c.cat === slot.category;
}
function pfBest_(pool, slot, used, notNear) {
  let best = null, bs = -1e9;
  pool.forEach(function (c) {
    if (!pfEligible_(c, slot, used)) return;
    if (notNear && c.date && notNear.date &&
        Math.abs(c.date - notNear.date) / 1000 < PF_CFG.MIN_GAP_SECONDS) return;
    const s = pfScore_(c, slot);
    if (s > bs) { bs = s; best = c; }
  });
  return best;
}
// lockedMap: key "pages|slot|role" -> candidate-like object (kept as the user left it)
function pfAssign_(slots, pool, lockedMap) {
  const used = {}, primary = {}, result = [];
  const key = function (s, role) { return s.pages + '|' + s.slot + '|' + role; };
  Object.keys(lockedMap).forEach(function (k) { used[lockedMap[k].id] = true; });

  // 1) primaries: heroes first (scarcest), then everything in page order
  const order = slots.slice().sort(function (a, b) { return (b.hero - a.hero) || (a.page - b.page); });
  order.forEach(function (s) {
    const lk = lockedMap[key(s, 'Primary')];
    const c = lk || pfBest_(pool, s, used);
    if (c) { used[c.id] = true; primary[key(s, 'Primary')] = { c: c, locked: !!lk }; }
  });

  // 2) chronology: inside each category+orientation group (not heroes / ANY), re-deal unlocked
  //    primaries so earlier dates land on earlier pages
  const groups = {};
  slots.forEach(function (s) {
    const p = primary[key(s, 'Primary')];
    if (!p || p.locked || s.hero || s.category === 'ANY') return;
    (groups[s.category + '|' + s.orient] = groups[s.category + '|' + s.orient] || []).push(s);
  });
  Object.keys(groups).forEach(function (g) {
    const ss = groups[g].slice().sort(function (a, b) { return a.page - b.page || a.slot.localeCompare(b.slot); });
    const cs = ss.map(function (s) { return primary[key(s, 'Primary')].c; })
      .sort(function (a, b) { return (a.date || 0) - (b.date || 0); });
    ss.forEach(function (s, i) { primary[key(s, 'Primary')].c = cs[i]; });
  });

  // 3) spares (after all primaries so they never steal a primary)
  slots.forEach(function (s) {
    const p = primary[key(s, 'Primary')];
    if (!p) return;
    result.push({ slot: s, role: 'Primary', c: p.c, locked: p.locked });
    const want = s.dual ? 1 : PF_CFG.SPARES_PER_SINGLE;
    for (let i = 1; i <= want; i++) {
      const role = 'Spare ' + i, lk = lockedMap[key(s, role)];
      const c = lk || pfBest_(pool, s, used, p.c);
      if (c) { used[c.id] = true; result.push({ slot: s, role: role, c: c, locked: !!lk }); }
    }
  });
  return result;
}

// ===== SECTION 7: BUILD PAGE PLAN (menu action) =====
function pfBuildPagePlan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const slots = pfBuildSlots_(pfReadSheet_(PF_CFG.LAYOUT_SHEET));
  const pool = pfBuildPool_();
  const poolById = {};
  pool.forEach(function (c) { poolById[c.id] = c; });

  // keep rows the user locked (Locked = TRUE) exactly as they left them
  const lockedMap = {};
  pfReadSheet_(PF_CFG.PLAN_SHEET, true).forEach(function (r) {
    if (!pfIsTrue_(r['Locked']) || !r['File ID']) return;
    const c = poolById[r['File ID']] || { id: r['File ID'], name: r['File Name'], year: r['Year'], cat: r['Category'],
      grade: r['Grade'], score: r['Editorial Score'], orient: r['Orientation'], aspect: r['Aspect'],
      caption: r['Caption'], date: pfParseDate_(r['Date Taken']), mismatch: false };
    const base = String(r['Folder']).split(' ')[0];
    lockedMap[base + '|' + r['Slot'] + '|' + r['Role']] = c;
  });

  const res = pfAssign_(slots, pool, lockedMap);
  const rows = res.map(function (x) {
    const c = x.c, flags = [];
    if (x.slot.hero && c.aspect && c.aspect < PF_CFG.SPREAD_MIN_ASPECT) flags.push('Heavy crop for spread');
    if (c.mismatch) flags.push('Check orientation');
    return [x.slot.page, x.slot.slot, x.role, c.name, c.id, c.year, pfFmtDate_(c.date), c.cat, c.grade, c.score,
      c.orient, c.aspect, c.caption, flags.join('; '), x.locked ? 'TRUE' : '', x.slot.folder, x.slot.section];
  });

  let sh = ss.getSheetByName(PF_CFG.PLAN_SHEET) || ss.insertSheet(PF_CFG.PLAN_SHEET);
  sh.clear();
  sh.getRange(1, 1, 1, PF_PLAN_HEADERS.length).setValues([PF_PLAN_HEADERS]).setFontWeight('bold');
  if (rows.length) sh.getRange(2, 1, rows.length, PF_PLAN_HEADERS.length).setValues(rows);
  sh.setFrozenRows(1);

  // report: unfilled slots + year balance of primaries
  const filled = {};
  res.filter(function (x) { return x.role === 'Primary'; })
    .forEach(function (x) { filled[x.slot.pages + '|' + x.slot.slot] = true; });
  const missing = slots.filter(function (s) { return !filled[s.pages + '|' + s.slot]; })
    .map(function (s) { return 'p' + s.page + s.slot + ' (' + s.category + ' ' + s.orient + ')'; });
  const years = {};
  res.filter(function (x) { return x.role === 'Primary'; })
    .forEach(function (x) { years[x.c.year] = (years[x.c.year] || 0) + 1; });
  SpreadsheetApp.getUi().alert('Page Plan built',
    'Slots: ' + slots.length + '\nPrimaries placed: ' + Object.keys(filled).length +
    '\nBy year: ' + JSON.stringify(years) +
    '\nUnfilled (' + missing.length + '): ' + missing.slice(0, 25).join(', ') + (missing.length > 25 ? ' ...' : ''),
    SpreadsheetApp.getUi().ButtonSet.OK);
}

// ===== SECTION 8: SYNC PAGE FOLDERS (menu action; safe to re-run, resumes) =====
function pfGetRoot_() {
  const mediaRootId = pfSetting_('Media Root Folder ID');
  const parent = mediaRootId ? DriveApp.getFolderById(mediaRootId).getParents() : null;
  const home = parent && parent.hasNext() ? parent.next() : DriveApp.getRootFolder();
  const it = home.getFoldersByName(PF_CFG.ROOT_FOLDER_NAME);
  return it.hasNext() ? it.next() : home.createFolder(PF_CFG.ROOT_FOLDER_NAME);
}
function pfSetting_(label) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
  if (!sh) return '';
  const v = sh.getDataRange().getValues();
  for (let i = 0; i < v.length; i++) if (String(v[i][0]) === label) return String(v[i][1]);
  return '';
}
function pfSyncPageFolders() {
  const t0 = Date.now();
  const plan = pfReadSheet_(PF_CFG.PLAN_SHEET);
  const root = pfGetRoot_();
  const byFolder = {};
  plan.forEach(function (r) { if (r['File ID']) (byFolder[r['Folder']] = byFolder[r['Folder']] || []).push(r); });

  let added = 0, removed = 0, done = 0, stopped = false;
  const names = Object.keys(byFolder).sort();
  for (let n = 0; n < names.length; n++) {
    if (Date.now() - t0 > PF_CFG.TIME_BUDGET_MS) { stopped = true; break; }
    const fname = names[n];
    const fi = root.getFoldersByName(fname);
    const folder = fi.hasNext() ? fi.next() : root.createFolder(fname);
    const wanted = {};
    byFolder[fname].forEach(function (r) {
      const prefix = r['Role'] === 'Primary' ? '1-PRIMARY' : '2-' + String(r['Role']).toUpperCase().replace(' ', '');
      wanted[prefix + '_' + r['Slot'] + '_' + r['File Name']] = r['File ID'];
    });
    const have = {};
    const files = folder.getFiles();
    while (files.hasNext()) {
      const f = files.next();
      if (wanted[f.getName()]) have[f.getName()] = true;
      else { f.setTrashed(true); removed++; }          // only ever trashes shortcuts/copies in page folders
    }
    Object.keys(wanted).forEach(function (nm) {
      if (have[nm]) return;
      if (PF_CFG.USE_COPIES) DriveApp.getFileById(wanted[nm]).makeCopy(nm, folder);
      else folder.createShortcut(wanted[nm]).setName(nm);
      added++;
    });
    done++;
  }
  SpreadsheetApp.getUi().alert(stopped ? 'Partly synced - run again to continue' : 'Page folders synced',
    'Folders done: ' + done + ' of ' + names.length + '\nAdded: ' + added + '  Removed: ' + removed +
    '\nLocation: ' + root.getUrl(), SpreadsheetApp.getUi().ButtonSet.OK);
}


// ===== SECTION 9: WRITE PLAN BACK TO BOOK FINAL LAYOUT (menu: pfApplyPlanToLayout) =====
// Fills File Name, Year, Grade, Editorial Score (+ a "Spare Files" column) from Page Plan primaries.
// Fills blanks only unless PF_OVERWRITE_LAYOUT is true, so hand edits in the layout survive.
const PF_OVERWRITE_LAYOUT = false;

function pfApplyPlanToLayout() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PF_CFG.LAYOUT_SHEET);
  if (!sh) throw new Error('Missing sheet: ' + PF_CFG.LAYOUT_SHEET);
  const plan = pfReadSheet_(PF_CFG.PLAN_SHEET);

  // page -> entries; a full-bleed spread folder (e.g. P006-007) feeds both pages
  const byPage = {};
  plan.forEach(function (r) {
    if (!r['File ID']) return;
    const m = String(r['Folder']).match(/^P(\d+)-(\d+)/);
    const pages = m ? [+m[1], +m[2]] : [Number(r['Page'])];
    pages.forEach(function (p) {
      const e = byPage[p] = byPage[p] || { names: [], years: [], grades: [], scores: [], spares: [] };
      if (r['Role'] === 'Primary') {
        e.names.push(r['File Name']); e.years.push(r['Year']);
        e.grades.push(r['Grade']); e.scores.push(r['Editorial Score']);
      } else e.spares.push(r['File Name']);
    });
  });

  const uniq = function (a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); };
  const targets = {
    'File Name':       function (e) { return e.names.join(' + '); },
    'Year':            function (e) { return uniq(e.years).join(' / '); },
    'Grade':           function (e) { return e.grades.join(' / '); },
    'Editorial Score': function (e) { return e.scores.join(' / '); },
    'Spare Files':     function (e) { return e.spares.join(' | '); }
  };

  const values = sh.getDataRange().getValues();
  const header = values[0].map(String);
  const pageCol = header.indexOf('Page');
  if (pageCol < 0) throw new Error('Book Final Layout has no Page column');

  let written = 0;
  Object.keys(targets).forEach(function (name) {
    let c = header.indexOf(name);
    if (c < 0) {                                   // only "Spare Files" is ever created
      if (name !== 'Spare Files') return;
      c = header.length; header.push(name);
      if (c + 1 > sh.getMaxColumns()) sh.insertColumnsAfter(sh.getMaxColumns(), 1);
      sh.getRange(1, c + 1).setValue(name).setFontWeight('bold');
    }
    const col = [];
    for (let i = 1; i < values.length; i++) {
      const existing = values[i][c] === undefined ? '' : values[i][c];
      const e = byPage[Number(values[i][pageCol])];
      const val = e ? targets[name](e) : '';
      if (val !== '' && (PF_OVERWRITE_LAYOUT || existing === '')) { col.push([val]); written++; }
      else col.push([existing]);
    }
    if (col.length) sh.getRange(2, c + 1, col.length, 1).setValues(col);
  });
  SpreadsheetApp.getUi().alert('Layout updated', 'Cells written: ' + written, SpreadsheetApp.getUi().ButtonSet.OK);
}

