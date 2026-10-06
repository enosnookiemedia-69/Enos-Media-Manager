// ==========================================================
// SELECTION AUDIT  (READ-ONLY)
// ----------------------------------------------------------
// New file. Writes NOTHING to any sheet - results go to the
// execution log only. Safe to run any time.
//
// Run from the Apps Script editor: auditFinalBookPossibilities
//
// Answers four questions:
//  1. What does calculateCategoryQuotas() actually return
//     (needed / x3 cap per category)?
//  2. Does every category in Final Book Possibilities have a
//     quota entry? (No entry => the rebuild applies NO cap.)
//  3. How many rows per category are over their cap?
//  4. How are Candidate scores distributed, and how many
//     would a score floor remove vs. keep Pushed rows?
// ==========================================================

const AUDIT_SCORE_FLOOR = 40;   // for the what-if only


function auditFinalBookPossibilities() {

  const quotaData = calculateCategoryQuotas();
  const sheet = getBookSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < BOOKLIST.START_ROW) {
    info("Final Book Possibilities is empty.");
    return;
  }

  const rows = sheet
    .getRange(
      BOOKLIST.START_ROW, 1,
      lastRow - BOOKLIST.START_ROW + 1,
      BOOKLIST.COLUMNS.NOTES
    )
    .getValues();

  const C = BOOKLIST.COLUMNS;
  const perCat = {};
  const bands = { "<40": 0, "40-47": 0, "48-57": 0, "58+": 0 };
  let belowFloorCandidates = 0;
  let belowFloorPushed = 0;

  rows.forEach(function (r) {

    if (!r[C.FILE_ID - 1]) { return; }

    const cat = String(r[C.CATEGORY - 1] || "").trim() || "(blank)";
    const status = String(r[C.STATUS - 1] || "").trim();
    const score = Number(r[C.EDITORIAL_SCORE - 1]) || 0;

    if (!perCat[cat]) { perCat[cat] = { rows: 0, pushed: 0 }; }
    perCat[cat].rows++;
    if (status === "Pushed") { perCat[cat].pushed++; }

    if (status === "Candidate") {
      if (score < 40) { bands["<40"]++; }
      else if (score < 48) { bands["40-47"]++; }
      else if (score < 58) { bands["48-57"]++; }
      else { bands["58+"]++; }
      if (score < AUDIT_SCORE_FLOOR) { belowFloorCandidates++; }
    } else if (status === "Pushed" && score < AUDIT_SCORE_FLOOR) {
      belowFloorPushed++;
    }

  });

  info("=== QUOTAS (from Book Final Layout) ===");
  Object.keys(quotaData.categories).forEach(function (cat) {
    const q = quotaData.categories[cat];
    info(cat + " : needed " + q.needed +
         " | x" + FINAL_BOOK_POSSIBILITIES_CAP_MULTIPLIER +
         " cap " + (q.needed * FINAL_BOOK_POSSIBILITIES_CAP_MULTIPLIER));
  });
  info("Total needed : " + quotaData.totalNeeded);

  info("=== SHEET vs CAP ===");
  Object.keys(perCat).forEach(function (cat) {
    const q = quotaData.categories[cat];
    const cap = q ? q.needed * FINAL_BOOK_POSSIBILITIES_CAP_MULTIPLIER : null;
    info(
      cat + " : " + perCat[cat].rows + " rows (" +
      perCat[cat].pushed + " Pushed) | " +
      (cap === null
        ? "NO QUOTA ENTRY -> rebuild applies NO cap to this category"
        : "cap " + cap + (perCat[cat].rows > cap ? "  ** OVER **" : ""))
    );
  });

  info("=== CANDIDATE SCORE BANDS ===");
  Object.keys(bands).forEach(function (b) {
    info(b + " : " + bands[b]);
  });

  info("=== WHAT-IF: floor " + AUDIT_SCORE_FLOOR + " ===");
  info("Candidates below floor : " + belowFloorCandidates);
  info("Pushed below floor (must stay, override) : " + belowFloorPushed);

}