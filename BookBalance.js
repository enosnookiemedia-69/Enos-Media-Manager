/**
 * ==========================================================
 * BOOKBALANCE.GS
 * ----------------------------------------------------------
 * Manages the Book Image Balance workflow.
 *
 * Purpose
 * -------
 * Final Book Image Possibilities holds every image that has
 * been auto-pushed (Hero Image / Final Book from the First
 * Pass Reviewer) or added by the Second Pass Reviewer.
 *
 * Book Image Balance is the curated subset of that list — the
 * actual final candidate pool the book will be laid out from.
 * It holds ONE record per image for:
 *
 * • Every image auto-pushed as Hero Image or Final Book
 *   (Status = "Pushed") — these will almost certainly be
 *   used in the book.
 * • Every image added by the Second Pass Reviewer
 *   (Status = "Reviewed") — these passed Second Pass and
 *   count toward each category's x2 target.
 *
 * Together this is the ~246-image balanced pool (2x the 123
 * images actually needed — CONFIG.TARGETS.FINAL_BOOK) ready
 * for final layout selection.
 *
 * Row structure is identical to Final Book Image Possibilities
 * (BOOKLIST.COLUMNS), so buildBookRow() from BookList.gs is
 * reused directly rather than duplicated here.
 *
 * Communicates with:
 * • Config.gs (CONFIG.SHEETS.BOOK_BALANCE)
 * • Database.gs (getAllMedia)
 * • MediaObject.gs (rowToMediaObject)
 * • BookList.gs (BOOKLIST.COLUMNS, buildBookRow)
 * • Review.gs (Hero / Final Book auto-push)
 * • SecondPassEngine.gs (Second Pass "add" decisions)
 * ==========================================================
 */


// ==========================================================
// BOOK BALANCE SETTINGS
// ----------------------------------------------------------
// Column layout is identical to Final Book Image
// Possibilities (BOOKLIST.COLUMNS), so buildBookRow() can be
// reused as-is to build a Book Image Balance row.
// ==========================================================

const BOOK_BALANCE = {

  START_ROW: 2,

  COLUMNS: BOOKLIST.COLUMNS

};


// ==========================================================
// SETUP
// ----------------------------------------------------------
// One-time setup — creates the Book Image Balance tab (if it
// doesn't already exist) and writes the header row so it
// matches BOOKLIST.COLUMNS exactly.
//
// Safe to re-run: if the sheet already exists with a header
// row in place, it leaves it alone rather than overwriting it.
//
// Run this once from the Apps Script editor (select
// setupBookImageBalanceSheet in the function dropdown, then
// Run) after pasting these files in, before using "Rebuild
// Book Image Balance" from the menu.
// ==========================================================

function setupBookImageBalanceSheet() {

  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  let sheet =
    spreadsheet.getSheetByName(
      CONFIG.SHEETS.BOOK_BALANCE
    );

  const headers = [

    "Thumbnail",
    "File ID",
    "File Name",
    "Year",
    "Photographer",
    "Category",
    "Grade",
    "Story Value",
    "Hero",
    "Editorial Score",
    "Layout Suitability",
    "Print Suitability",
    "Aspect Ratio",
    "Orientation",
    "Caption",
    "Spread",
    "Page",
    "Status",
    "Notes"

  ];

  if (!sheet) {

    sheet =
      spreadsheet.insertSheet(
        CONFIG.SHEETS.BOOK_BALANCE
      );

    Logger.log(
      "Created sheet: " +
      CONFIG.SHEETS.BOOK_BALANCE
    );

  }

  const existingHeaderRow =
    sheet
      .getRange(1, 1, 1, headers.length)
      .getValues()[0];

  const headerRowIsBlank =
    existingHeaderRow.every(
      function(cell) {
        return cell === "" || cell === null;
      }
    );

  if (!headerRowIsBlank) {

    Logger.log(
      "Header row already has content — leaving it " +
      "untouched. Delete row 1 first if you want it " +
      "rewritten."
    );

    return;

  }

  sheet
    .getRange(1, 1, 1, headers.length)
    .setValues([
      headers
    ]);

  sheet
    .getRange(1, 1, 1, headers.length)
    .setFontWeight("bold");

  sheet.setFrozenRows(1);

  Logger.log(
    "Header row written to " +
    CONFIG.SHEETS.BOOK_BALANCE
  );

}


// ==========================================================
// BOOK BALANCE SHEET CACHE
// ==========================================================

let BOOK_BALANCE_SHEET = null;


// ==========================================================
// BOOK BALANCE SHEET ACCESS
// ==========================================================

/**
 * Returns the Book Image Balance worksheet.
 *
 * The sheet must already exist (same convention as
 * getBookSheet() in BookList.gs) — create a tab named exactly
 * CONFIG.SHEETS.BOOK_BALANCE with a header row matching
 * BOOKLIST.COLUMNS before using this.
 *
 * @returns {Sheet}
 */
function getBookBalanceSheet() {

  if (!BOOK_BALANCE_SHEET) {

    BOOK_BALANCE_SHEET =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(
          CONFIG.SHEETS.BOOK_BALANCE
        );

  }


  if (!BOOK_BALANCE_SHEET) {

    throw new Error(
      "Book Image Balance sheet not found. Create a tab " +
      "named \"" + CONFIG.SHEETS.BOOK_BALANCE + "\" first."
    );

  }


  return BOOK_BALANCE_SHEET;

}


// ==========================================================
// FIND BOOK BALANCE RECORD
// ==========================================================

/**
 * Finds a Book Image Balance row using File ID.
 *
 * @param {String} fileId
 * @returns {Number|null}
 */
function findBookBalanceRecordRow(fileId) {

  const sheet =
    getBookBalanceSheet();


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow <
    BOOK_BALANCE.START_ROW
  ) {

    return null;

  }


  const fileIds =
    sheet
      .getRange(
        BOOK_BALANCE.START_ROW,
        BOOK_BALANCE.COLUMNS.FILE_ID,
        lastRow - BOOK_BALANCE.START_ROW + 1,
        1
      )
      .getValues();


  for (
    let i = 0;
    i < fileIds.length;
    i++
  ) {

    if (
      fileIds[i][0] === fileId
    ) {

      return (
        BOOK_BALANCE.START_ROW + i
      );

    }

  }


  return null;

}


// ==========================================================
// BOOK BALANCE RECORD CREATION / UPDATE
// ==========================================================

/**
 * Adds a new Media Object to Book Image Balance.
 */
function addBookBalanceRecord(media) {

  const sheet =
    getBookBalanceSheet();


  const row =
    buildBookRow(media);


  sheet.appendRow(row);

}


/**
 * Updates an existing Book Image Balance record.
 *
 * Reuses buildBookRow() so manual editorial fields
 * (Caption, Spread, Page, Status, Notes) are preserved
 * exactly the same way they are in Final Book Image
 * Possibilities.
 */
function updateBookBalanceRecord(
  rowNumber,
  media
) {

  const sheet =
    getBookBalanceSheet();


  const currentRow =
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        BOOK_BALANCE.COLUMNS.NOTES
      )
      .getValues()[0];


  const updatedRow =
    buildBookRow(
      media,
      currentRow
    );


  sheet
    .getRange(
      rowNumber,
      1,
      1,
      BOOK_BALANCE.COLUMNS.NOTES
    )
    .setValues([
      updatedRow
    ]);

}


// ==========================================================
// STAMP STATUS
// ----------------------------------------------------------
// Only writes the given label when the Status cell is
// currently blank, so manual editorial Status values
// (e.g. "Shortlisted", "Final Selection") are never
// overwritten. Mirrors stampStatusIfBlank() in BookList.gs.
// ==========================================================

function stampBalanceStatusIfBlank(rowNumber, statusLabel) {

  if (!rowNumber) {

    return;

  }


  const sheet =
    getBookBalanceSheet();


  const statusCell =
    sheet.getRange(
      rowNumber,
      BOOK_BALANCE.COLUMNS.STATUS
    );


  const currentStatus =
    statusCell.getValue();


  if (!currentStatus) {

    statusCell.setValue(
      statusLabel
    );

  }

}


// ==========================================================
// SYNC SINGLE RECORD TO BOOK BALANCE
// ----------------------------------------------------------
// Used by:
// • Review.gs — Hero Image / Final Book auto-push
//   (statusLabel = "Pushed")
// • SecondPassEngine.gs — "add" decisions
//   (statusLabel = "Reviewed")
// ==========================================================

function syncSingleMediaRecordToBookBalance(rawRow, statusLabel) {

  statusLabel =
    statusLabel || "Pushed";

  const mediaRecord =
    rowToMediaObject(
      rawRow
    );


  if (!mediaRecord.id) {

    return;

  }


  const existingRow =
    findBookBalanceRecordRow(
      mediaRecord.id
    );


  if (existingRow) {

    updateBookBalanceRecord(
      existingRow,
      mediaRecord
    );


    stampBalanceStatusIfBlank(
      existingRow,
      statusLabel
    );

  }

  else {

    addBookBalanceRecord(
      mediaRecord
    );


    const newRow =
      findBookBalanceRecordRow(
        mediaRecord.id
      );


    stampBalanceStatusIfBlank(
      newRow,
      statusLabel
    );

  }

}


// ==========================================================
// FULL BACKFILL / RESYNC  (BATCHED VERSION)
// ----------------------------------------------------------
// Replaces syncBookBalanceFromMedia() in BookBalance.js.
// Same rules as before, but the sheet is read ONCE and
// written ONCE instead of making several calls per image.
//
// • Hero Image = true   → Status "Pushed"
// • Final Book = true   → Status "Pushed"
// • Selection Stage = "Book Possibility" → Status "Reviewed"
//
// Existing rows are updated in place (manual Caption / Spread
// / Page / Status / Notes preserved via buildBookRow);
// new matches are added at the bottom.
// ==========================================================

function syncBookBalanceFromMedia() {

  info(
    "Synchronising Book Image Balance..."
  );


  const media =
    getAllMedia();

  const sheet =
    getBookBalanceSheet();

  const COLS =
    BOOK_BALANCE.COLUMNS;

  const width =
    COLS.NOTES;

  const startRow =
    BOOK_BALANCE.START_ROW;


  // --------------------------------------------------------
  // ONE read of the existing sheet
  // --------------------------------------------------------

  const lastRow =
    sheet.getLastRow();

  const existingCount =
    lastRow >= startRow
      ? lastRow - startRow + 1
      : 0;

  let values = [];      // evaluated values (passed to buildBookRow)
  let output = [];      // what gets written back

  if (existingCount > 0) {

    const range =
      sheet.getRange(
        startRow,
        1,
        existingCount,
        width
      );

    values =
      range.getValues();

    const formulas =
      range.getFormulas();

    // Untouched rows keep their formulas (e.g. thumbnails)
    output =
      values.map(
        function (rowValues, r) {
          return rowValues.map(
            function (v, c) {
              return formulas[r][c] || v;
            }
          );
        }
      );

  }


  // File ID → index in values/output
  const indexById = {};

  for (let i = 0; i < values.length; i++) {

    const id =
      values[i][COLS.FILE_ID - 1];

    if (id) {
      indexById[id] = i;
    }

  }


  // --------------------------------------------------------
  // Build everything in memory
  // --------------------------------------------------------

  let added = 0;

  let updated = 0;

  let skipped = 0;


  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    const record =
      rowToMediaObject(
        media[i]
      );

    if (!record.id) {
      continue;
    }

    const qualifies =
      record.hero === true ||
      record.finalBook === true ||
      String(record.selectionStage || "").trim() ===
        "Book Possibility";

    if (!qualifies) {
      skipped++;
      continue;
    }

    const statusLabel =
      (record.hero === true || record.finalBook === true)
        ? "Pushed"
        : "Reviewed";

    const idx =
      indexById[record.id];

    if (idx !== undefined) {

      const updatedRow =
        buildBookRow(
          record,
          values[idx]
        );

      if (!updatedRow[COLS.STATUS - 1]) {
        updatedRow[COLS.STATUS - 1] = statusLabel;
      }

      output[idx] = updatedRow;

      updated++;

    }

    else {

      const newRow =
        buildBookRow(record);

      if (!newRow[COLS.STATUS - 1]) {
        newRow[COLS.STATUS - 1] = statusLabel;
      }

      output.push(newRow);

      values.push(newRow);

      indexById[record.id] = output.length - 1;

      added++;

    }

  }


  // --------------------------------------------------------
  // ONE write
  // --------------------------------------------------------

  if (output.length > 0) {

    const neededLastRow =
      startRow + output.length - 1;

    const maxRows =
      sheet.getMaxRows();

    if (neededLastRow > maxRows) {

      sheet.insertRowsAfter(
        maxRows,
        neededLastRow - maxRows
      );

    }

    sheet
      .getRange(
        startRow,
        1,
        output.length,
        width
      )
      .setValues(output);

    SpreadsheetApp.flush();

  }


  info(
    "Book Image Balance Updated"
  );

  info(
    "Added : " + added
  );

  info(
    "Updated : " + updated
  );

  info(
    "Not qualifying : " + skipped
  );

  return {
    added: added,
    updated: updated,
    skipped: skipped
  };

}


// ==========================================================
// MENU COMMAND
// ==========================================================

/**
 * Rebuilds Book Image Balance from the Media Database.
 *
 * Called from the "Rebuild Book Image Balance" menu item.
 * Confirms first since this can write a large number of
 * rows the first time it is run.
 */
function syncBookBalanceMenu() {

  const ui =
    SpreadsheetApp.getUi();

  const response =
    ui.alert(

      "Rebuild Book Image Balance",

      "This will add/update every Hero Image, Final Book, " +
      "and Second-Pass-added image in Book Image Balance.\n\n" +
      "Manually edited Caption, Spread, Page, Status and " +
      "Notes values are preserved.\n\n" +
      "Continue?",

      ui.ButtonSet.YES_NO

    );

  if (
    response !== ui.Button.YES
  ) {

    return;

  }

  const result =
    syncBookBalanceFromMedia();

  showSuccess(
    "Book Image Balance rebuilt. Added " +
    result.added +
    ", updated " +
    result.updated +
    "."
  );

}


// ==========================================================
// DEVELOPMENT TESTS
// ==========================================================

/**
 * Read-only test. Confirms the sheet can be found and logs
 * how many images currently qualify, without writing anything.
 */
function testBookBalanceDryRun() {

  const sheet =
    getBookBalanceSheet();

  Logger.log(
    "Book Image Balance sheet: " +
    sheet.getName()
  );

  const media =
    getAllMedia();

  let qualifying = 0;

  let pushed = 0;

  let secondPass = 0;

  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    const record =
      rowToMediaObject(
        media[i]
      );

    if (!record.id) {
      continue;
    }

    if (
      record.hero === true ||
      record.finalBook === true
    ) {

      qualifying++;
      pushed++;
      continue;

    }

    if (
      String(record.selectionStage || "").trim() ===
      "Book Possibility"
    ) {

      qualifying++;
      secondPass++;

    }

  }

  Logger.log(
    "Qualifying images: " + qualifying +
    " (Pushed: " + pushed +
    " | Second Pass: " + secondPass + ")"
  );

  Logger.log(
    "Target (CONFIG.TARGETS.FINAL_BOOK x2): " +
    (CONFIG.TARGETS.FINAL_BOOK * 2)
  );

}




/**
 * Live-push wiring test for the Review.js (Hero/Final Book)
 * and SecondPassEngine.js (Second Pass "Add") integration.
 *
 * Both call sites now call syncSingleMediaRecordToBookBalance()
 * directly — this test calls that exact same function, so a
 * PASS here confirms both integration points will work without
 * needing to click through the Reviewer or Second Pass UI.
 *
 * WARNING: this DOES write to Book Image Balance (adds or
 * updates one row) — that's the only way to prove the push
 * actually lands. Pass a real File ID from Media Database to
 * test a specific image, or leave blank to auto-pick the first
 * Hero Image / Final Book image found.
 */
function testLivePushToBookBalance(fileId) {

  const media =
    getAllMedia();

  let rawRow = null;

  if (fileId) {

    for (let i = 1; i < media.length; i++) {

      if (media[i][COL.FILE_ID - 1] === fileId) {
        rawRow = media[i];
        break;
      }

    }

    if (!rawRow) {

      Logger.log(
        "No Media Database row found for File ID: " + fileId
      );

      return;

    }

  }

  else {

    for (let i = 1; i < media.length; i++) {

      const record =
        rowToMediaObject(
          media[i]
        );

      if (
        record.hero === true ||
        record.finalBook === true
      ) {

        rawRow = media[i];
        fileId = record.id;
        break;

      }

    }

    if (!rawRow) {

      Logger.log(
        "No Hero Image / Final Book image found to test " +
        "with. Pass a fileId instead, e.g. " +
        "testLivePushToBookBalance('your-file-id')."
      );

      return;

    }

  }

  Logger.log(
    "Testing live push for File ID: " + fileId
  );

  const beforeRow =
    findBookBalanceRecordRow(
      fileId
    );

  Logger.log(
    beforeRow
      ? "Already in Book Image Balance at row " + beforeRow +
        " before test — this run will update it."
      : "Not yet in Book Image Balance — this run will add it."
  );

  try {

    syncSingleMediaRecordToBookBalance(
      rawRow,
      "Pushed"
    );

  }

  catch (error) {

    Logger.log(
      "FAIL — syncSingleMediaRecordToBookBalance threw: " +
      error.message
    );

    return;

  }

  const afterRow =
    findBookBalanceRecordRow(
      fileId
    );

  if (afterRow) {

    Logger.log(
      "PASS — File ID found in Book Image Balance at row " +
      afterRow + "."
    );

  }

  else {

    Logger.log(
      "FAIL — File ID still not found in Book Image Balance " +
      "after push."
    );

  }

}








/**
 * Diagnostic: finds WHICH cell makes the Book Image Balance
 * update throw "Service error: Spreadsheets".
 *
 * Paste anywhere in BookBalance.js, pick
 * diagnoseBookBalanceRow in the function dropdown, Run.
 * Then send me the full Execution log.
 *
 * It writes the same values the real update would write,
 * one cell at a time, so the failing column is identified.
 */
function diagnoseBookBalanceRow() {

  // Same File ID as your failed test
  const fileId =
    "1p8r3uW-S7DPBWPNNA61YCJfcfaT8or8C";

  const sheet =
    getBookBalanceSheet();

  const width =
    BOOK_BALANCE.COLUMNS.NOTES;

  Logger.log("Sheet: " + sheet.getName() +
    " | maxRows=" + sheet.getMaxRows() +
    " | maxCols=" + sheet.getMaxColumns() +
    " | width needed=" + width);


  // Step 1 - find the row
  const rowNumber =
    findBookBalanceRecordRow(fileId);

  Logger.log("Step 1 row found: " + rowNumber);

  if (!rowNumber) { return; }


  // Step 2 - read current row
  let currentRow;

  try {
    currentRow = sheet.getRange(rowNumber, 1, 1, width).getValues()[0];
    Logger.log("Step 2 read OK, length " + currentRow.length);
  } catch (e) {
    Logger.log("Step 2 READ FAILED: " + e);
    return;
  }


  // Step 3 - find the media record and build the row
  const media = getAllMedia();

  let record = null;

  for (let i = 1; i < media.length; i++) {
    const r = rowToMediaObject(media[i]);
    if (r.id === fileId) { record = r; break; }
  }

  if (!record) {
    Logger.log("Step 3: media record not found in Media Database");
    return;
  }

  let updatedRow;

  try {
    updatedRow = buildBookRow(record, currentRow);
    Logger.log("Step 3 buildBookRow OK, length " + updatedRow.length);
  } catch (e) {
    Logger.log("Step 3 buildBookRow FAILED: " + e);
    return;
  }


  // Step 4 - inspect every value
  for (let c = 0; c < updatedRow.length; c++) {

    const v = updatedRow[c];
    const t = (v === null) ? "null" : typeof v;
    const len = (typeof v === "string") ? v.length : "";

    Logger.log("col " + (c + 1) + " type=" + t +
      (len !== "" ? " len=" + len : "") +
      " value=" + String(v).substring(0, 80));

  }


  // Step 5 - write cell by cell
  for (let c = 0; c < updatedRow.length; c++) {

    try {
      sheet.getRange(rowNumber, c + 1).setValue(updatedRow[c]);
    } catch (e) {
      Logger.log("Step 5 WRITE FAILED at column " + (c + 1) +
        ": " + e);
    }

  }

  Logger.log("Step 5 finished");

}