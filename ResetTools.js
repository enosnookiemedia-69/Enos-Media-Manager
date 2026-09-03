/**
 * ==========================================================
 * RESETTOOLS.GS
 * ----------------------------------------------------------
 * Scoped reset tools for the First Pass and Second Pass
 * Reviewers.
 *
 * Unlike clearMediaDatabase() (Database.gs), which wipes the
 * ENTIRE Media Database, these tools only reset the REVIEW
 * fields on matching rows — Drive metadata (File ID, name,
 * dimensions, EXIF, etc.) is left completely untouched. This
 * is meant for cleaning up test data (e.g. a handful of
 * images reviewed just to check the reviewers work) without
 * losing real editorial work already done.
 *
 * Resetting a row:
 * • Clears Layout Suitability through Review Status
 *   (Media Database columns 22-36 — the full block of
 *   editorial/review fields, including Category, Grade,
 *   Hero Image, Final Book, Selection Stage, Caption,
 *   Notes, Review Status, etc.)
 * • Does NOT touch File ID, Name, Folder Path, Size, Year,
 *   Photographer, dimensions, or any other Drive/EXIF field.
 * • If the image was already pushed into Final Book Image
 *   Possibilities (via Hero/Final Book auto-push or a
 *   Second Pass Add), that row is also removed from Final
 *   Book Image Possibilities, so no stale entry is left
 *   referencing an image that is now unreviewed again.
 *
 * Two scopes are provided:
 * • By Category — resets every reviewed row in one category.
 * • By "test" tag — resets every row whose Caption or Notes
 *   contains the word "test" (case-insensitive), so ad-hoc
 *   test reviews can be tagged and cleared without affecting
 *   real reviewed images.
 *
 * Communicates with:
 * • Config.gs   (getMediaSheet, COL, REVIEWER)
 * • MediaObject.gs (rowToMediaObject)
 * • BookList.gs (getBookSheet, findBookRecordRow)
 * ==========================================================
 */


// ==========================================================
// CORE RESET ENGINE
// ----------------------------------------------------------
// matcherFn receives a Media Object (from rowToMediaObject)
// and should return true for rows that should be reset.
// ==========================================================

function resetMediaRecords(matcherFn) {

  const sheet =
    getMediaSheet();

  const lastRow =
    sheet.getLastRow();


  if (
    lastRow < REVIEWER.START_ROW
  ) {

    return {
      resetCount: 0,
      bookListRemoved: 0
    };

  }


  const numRows =
    lastRow - REVIEWER.START_ROW + 1;

  const range =
    sheet.getRange(
      REVIEWER.START_ROW,
      1,
      numRows,
      COL.REVIEW_STATUS
    );

  const rows =
    range.getValues();

  const matchedFileIds = [];

  let resetCount = 0;


  for (
    let i = 0;
    i < rows.length;
    i++
  ) {

    const record =
      rowToMediaObject(
        rows[i]
      );

    if (!record.id) {
      continue;
    }

    if (!matcherFn(record)) {
      continue;
    }


    for (
      let col = COL.LAYOUT_SUITABILITY;
      col <= COL.REVIEW_STATUS;
      col++
    ) {

      rows[i][col - 1] = "";

    }


    matchedFileIds.push(
      record.id
    );

    resetCount++;

  }


  range.setValues(rows);


  const bookListRemoved =
    removeBookListRecordsByFileIds(
      matchedFileIds
    );


  return {
    resetCount: resetCount,
    bookListRemoved: bookListRemoved
  };

}


// ==========================================================
// REMOVE MATCHING BOOK LIST ROWS
// ----------------------------------------------------------
// Deletes any Final Book Image Possibilities rows whose
// File ID is in the given list. Deletes from the bottom up
// so row numbers don't shift mid-loop.
// ==========================================================

function removeBookListRecordsByFileIds(fileIds) {

  if (
    !fileIds ||
    fileIds.length === 0
  ) {

    return 0;

  }


  const sheet =
    getBookSheet();

  const rowsToDelete = [];


  fileIds.forEach(function(fileId) {

    const row =
      findBookRecordRow(fileId);

    if (row) {
      rowsToDelete.push(row);
    }

  });


  rowsToDelete
    .sort(function(a, b) {
      return b - a;
    })
    .forEach(function(row) {
      sheet.deleteRow(row);
    });


  return rowsToDelete.length;

}


// ==========================================================
// MATCHERS
// ==========================================================

function matchesCategory(record, category) {

  return (
    String(record.category || "")
      .trim()
      .toLowerCase() ===
    category.trim().toLowerCase()
  );

}


function matchesTestTag(record) {

  const caption =
    String(record.caption || "")
      .toLowerCase();

  const notes =
    String(record.notes || "")
      .toLowerCase();

  return (
    caption.indexOf("test") !== -1 ||
    notes.indexOf("test") !== -1
  );

}


// ==========================================================
// MENU: RESET BY CATEGORY
// ==========================================================

function resetByCategoryMenu() {

  const ui =
    SpreadsheetApp.getUi();

  const promptResult =
    ui.prompt(
      "Reset Reviewed Images by Category",
      "Enter the exact category name to reset " +
      "(matches CONFIG.CATEGORIES):\n\n" +
      CONFIG.CATEGORIES.join(", "),
      ui.ButtonSet.OK_CANCEL
    );


  if (
    promptResult.getSelectedButton() !==
    ui.Button.OK
  ) {

    return;

  }


  const category =
    promptResult
      .getResponseText()
      .trim();


  const validCategory =
    CONFIG.CATEGORIES.find(function(c) {

      return (
        c.toLowerCase() ===
        category.toLowerCase()
      );

    });


  if (!validCategory) {

    ui.alert(
      "\"" + category + "\" is not a recognised category. " +
      "No changes were made."
    );

    return;

  }


  const confirm =
    ui.alert(

      "Reset Category: " + validCategory,

      "This will clear all review data (Category, Grade, " +
      "Hero Image, Final Book, Selection Stage, Caption, " +
      "Notes, etc.) for every reviewed image currently in " +
      "\"" + validCategory + "\", and remove any of those " +
      "images already pushed to Final Book Image " +
      "Possibilities.\n\n" +
      "File ID, Name, and other Drive metadata are NOT " +
      "affected — only review data is cleared.\n\n" +
      "This cannot be undone. Continue?",

      ui.ButtonSet.YES_NO

    );


  if (
    confirm !== ui.Button.YES
  ) {

    return;

  }


  const result =
    resetMediaRecords(function(record) {

      return matchesCategory(
        record,
        validCategory
      );

    });


  showSuccess(

    "Reset complete. " +
    result.resetCount +
    " image(s) reset in \"" + validCategory + "\". " +
    result.bookListRemoved +
    " matching row(s) removed from Final Book Image " +
    "Possibilities."

  );

}


// ==========================================================
// MENU: RESET "TEST" TAGGED IMAGES
// ==========================================================

function resetTestImagesMenu() {

  const ui =
    SpreadsheetApp.getUi();

  const confirm =
    ui.alert(

      "Reset Test Images",

      "This will clear all review data for every image " +
      "whose Caption or Notes contains the word \"test\" " +
      "(case-insensitive), and remove any of those images " +
      "already pushed to Final Book Image Possibilities.\n\n" +
      "File ID, Name, and other Drive metadata are NOT " +
      "affected — only review data is cleared.\n\n" +
      "This cannot be undone. Continue?",

      ui.ButtonSet.YES_NO

    );


  if (
    confirm !== ui.Button.YES
  ) {

    return;

  }


  const result =
    resetMediaRecords(
      matchesTestTag
    );


  showSuccess(

    "Reset complete. " +
    result.resetCount +
    " test image(s) reset. " +
    result.bookListRemoved +
    " matching row(s) removed from Final Book Image " +
    "Possibilities."

  );

}


// ==========================================================
// DEVELOPMENT TESTS
// ==========================================================

/**
 * Read-only test. Logs how many rows WOULD be reset for a
 * given category, without actually changing anything.
 */
function testResetByCategoryDryRun(category) {

  const media =
    getAllMedia();

  let count = 0;


  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    const record =
      rowToMediaObject(
        media[i]
      );

    if (
      matchesCategory(
        record,
        category
      )
    ) {

      count++;

    }

  }


  Logger.log(
    category +
    ": " + count + " row(s) would be reset."
  );

}


/**
 * Read-only test. Logs how many rows WOULD be reset by the
 * "test" tag matcher, without actually changing anything.
 */
function testResetTestImagesDryRun() {

  const media =
    getAllMedia();

  let count = 0;


  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    const record =
      rowToMediaObject(
        media[i]
      );

    if (
      matchesTestTag(record)
    ) {

      count++;

    }

  }


  Logger.log(
    count + " row(s) would be reset."
  );

}