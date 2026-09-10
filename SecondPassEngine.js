/**
 * ==========================================================
 * SECONDPASSENGINE.GS
 * ----------------------------------------------------------
 * Controls the Second Pass Reviewer workflow.
 *
 * Purpose
 * -------
 * The First Pass Reviewer already auto-pushes Hero Image and
 * Final Book selections straight into Final Book Image
 * Possibilities (Status = "Pushed").
 *
 * Second Pass looks at every OTHER "Reviewed" image and, one
 * category at a time, asks whether it should also be added
 * to Final Book Image Possibilities — working toward a target
 * of double the number of images actually needed per category
 * (so there are 2 options to choose from per book slot).
 *
 * Category quotas are calculated directly from the Book Final
 * Layout sheet (94-page structure), NOT hardcoded, so they
 * stay accurate if the layout changes.
 *
 * Decisions are stamped on the Media Database using the
 * existing "Selection Stage" column (COL.SELECTION_STAGE):
 *   "Book Possibility" = added during Second Pass
 *   "Not Selected"      = skipped during Second Pass
 *
 * Communicates with:
 * • Config.gs   (getMediaSheet, getBookLayoutSheet, COL)
 * • Database.gs (getAllMedia)
 * • MediaObject.gs (rowToMediaObject)
 * • BookList.gs (getBookSheet, BOOKLIST, syncSingleMediaRecordToBookList)
 * • SecondPassUI.gs / SecondPassHTML.html
 * ==========================================================
 */


// ==========================================================
// BOOK FINAL LAYOUT COLUMNS
// ----------------------------------------------------------
// These match the Book Final Layout worksheet exactly.
// ==========================================================

const BOOK_LAYOUT_COL = {

  THUMBNAIL: 1,
  PAGE: 2,
  POSITION: 3,
  FILE_ID: 4,
  FILE_NAME: 5,
  YEAR: 6,
  PHOTOGRAPHER: 7,
  CATEGORY: 8,
  SECTION: 9,
  GRADE: 10,
  STORY_VALUE: 11,
  HERO: 12,
  EDITORIAL_SCORE: 13,
  LAYOUT_SUITABILITY: 14,
  PRINT_SUITABILITY: 15,
  ASPECT_RATIO: 16,
  ORIENTATION: 17,
  LAYOUT_TYPE: 18,
  SPREAD: 19,
  SEQUENCE: 20,
  CAPTION: 21,
  STATUS: 22,
  NOTES: 23

};

const BOOK_LAYOUT_START_ROW = 2;


// ==========================================================
// GRADE RANKING
// ----------------------------------------------------------
// Used to sort Second Pass candidates strongest-first within
// a category, so the target is filled with the best available
// remaining images.
// ==========================================================

const SECOND_PASS_GRADE_RANK = {

  "S": 5,
  "A": 4,
  "B": 3,
  "C": 2,
  "Reject": 1

};

function secondPassGradeRank(grade) {

  return (
    SECOND_PASS_GRADE_RANK[grade] || 0
  );

}


// ==========================================================
// CATEGORY QUOTAS
// ----------------------------------------------------------
// Reads the Book Final Layout sheet and works out how many
// real photographed images each category actually needs.
//
// Rules:
// • Rows with Status = "Already created" need no new image
//   (AI artwork, covers, etc. are already done).
// • Rows with Layout Type = "Text" need no image.
// • A Hero row that is part of a spread (e.g. pages 6-7,
//   both marked Hero = YES with the same Spread value) only
//   needs ONE image shared across both pages.
// • A row whose Layout Type contains "Dual" needs 2 images.
// • Every other row needs 1 image.
//
// Target per category = needed x 2 (double, so there are
// 2 candidate images to choose between per book slot).
// ==========================================================

function calculateCategoryQuotas() {

  const sheet =
    getBookLayoutSheet();

  const lastRow =
    sheet.getLastRow();

  const quotas = {};

  let totalNeeded = 0;


  if (
    lastRow < BOOK_LAYOUT_START_ROW
  ) {

    return {
      categories: quotas,
      totalNeeded: totalNeeded
    };

  }


  const rows =
    sheet
      .getRange(
        BOOK_LAYOUT_START_ROW,
        1,
        lastRow - BOOK_LAYOUT_START_ROW + 1,
        BOOK_LAYOUT_COL.NOTES
      )
      .getValues();


  const seenSpreads = {};


  rows.forEach(function(row) {

    const status =
      row[BOOK_LAYOUT_COL.STATUS - 1];

    if (status === "Already created") {
      return;
    }

    const layoutType =
      String(
        row[BOOK_LAYOUT_COL.LAYOUT_TYPE - 1] || ""
      );

    if (layoutType === "Text") {
      return;
    }

    const category =
      row[BOOK_LAYOUT_COL.CATEGORY - 1] ||
      "Uncategorized";

    const hero =
      row[BOOK_LAYOUT_COL.HERO - 1];

    const spread =
      row[BOOK_LAYOUT_COL.SPREAD - 1];

    let contribution = 1;

    if (hero === "YES" && spread) {

      if (seenSpreads[spread]) {
        return;
      }

      seenSpreads[spread] = true;
      contribution = 1;

    }

    else if (
      layoutType.toLowerCase().indexOf("dual") !== -1
    ) {

      contribution = 2;

    }


    if (!quotas[category]) {

      quotas[category] = {
        needed: 0,
        target: 0
      };

    }

    quotas[category].needed += contribution;
    totalNeeded += contribution;

  });


   Object.keys(quotas).forEach(function(category) {

    quotas[category].target =
      quotas[category].needed * 2;

  });


  // --------------------------------------------------------
  // MANUAL CATEGORY TARGETS
  // ----------------------------------------------------------
  // Categories not tied to specific Book Final Layout pages
  // (e.g. "Portraits & Extras") get their quota from
  // CONFIG.MANUAL_CATEGORY_TARGETS instead of being counted
  // from layout rows.
  // --------------------------------------------------------

  Object.keys(
    CONFIG.MANUAL_CATEGORY_TARGETS || {}
  ).forEach(function(category) {

    const needed =
      CONFIG.MANUAL_CATEGORY_TARGETS[category];

    quotas[category] = {
      needed: needed,
      target: needed * 2
    };

    totalNeeded += needed;

  });


  return {
    categories: quotas,
    totalNeeded: totalNeeded
  };

}


// ==========================================================
// BOOK LIST CATEGORY COUNTS
// ----------------------------------------------------------
// Counts how many images currently exist in Final Book Image
// Possibilities per category (any row with a File ID).
// ==========================================================

function getBookListCategoryCounts() {

  const sheet =
    getBookSheet();

  const lastRow =
    sheet.getLastRow();

  const counts = {};


  if (
    lastRow < BOOKLIST.START_ROW
  ) {

    return counts;

  }


  const rows =
    sheet
      .getRange(
        BOOKLIST.START_ROW,
        1,
        lastRow - BOOKLIST.START_ROW + 1,
        BOOKLIST.COLUMNS.NOTES
      )
      .getValues();


  rows.forEach(function(row) {

    const fileId =
      row[BOOKLIST.COLUMNS.FILE_ID - 1];

    if (!fileId) {
      return;
    }

    const category =
      row[BOOKLIST.COLUMNS.CATEGORY - 1] ||
      "Uncategorized";

    counts[category] =
      (counts[category] || 0) + 1;

  });


  return counts;

}


// ==========================================================
// BOOK LIST FILE ID SET
// ----------------------------------------------------------
// Used to quickly exclude images already present in Final
// Book Image Possibilities from the Second Pass candidate
// pool.
// ==========================================================

function getBookListFileIdSet() {

  const sheet =
    getBookSheet();

  const lastRow =
    sheet.getLastRow();

  const set = {};


  if (
    lastRow < BOOKLIST.START_ROW
  ) {

    return set;

  }


  const ids =
    sheet
      .getRange(
        BOOKLIST.START_ROW,
        BOOKLIST.COLUMNS.FILE_ID,
        lastRow - BOOKLIST.START_ROW + 1,
        1
      )
      .getValues();


  ids.forEach(function(row) {

    if (row[0]) {
      set[row[0]] = true;
    }

  });


  return set;

}


// ==========================================================
// SECOND PASS PROGRESS
// ----------------------------------------------------------
// Returns one entry per category showing how many images
// are currently in Final Book Image Possibilities versus
// the target (needed x 2).
//
// status: "under" | "met" | "over"
// ==========================================================

function getSecondPassProgress() {

  const quotaData =
    calculateCategoryQuotas();

  const counts =
    getBookListCategoryCounts();

  const progress = [];


  CONFIG.CATEGORIES.forEach(function(category) {

    const quota =
      quotaData.categories[category] ||
      { needed: 0, target: 0 };

    const current =
      counts[category] || 0;

    const remaining =
      Math.max(
        0,
        quota.target - current
      );

    let status =
      quota.target > 0
        ? "under"
        : "met";

    if (
      quota.target > 0 &&
      current >= quota.target
    ) {

      status =
        current > quota.target
          ? "over"
          : "met";

    }


    progress.push({

      category: category,
      needed: quota.needed,
      target: quota.target,
      current: current,
      remaining: remaining,
      status: status

    });

  });


  return progress;

}


// ==========================================================
// SECOND PASS CANDIDATES
// ----------------------------------------------------------
// Returns Media Database candidates for a given category,
// sorted strongest-first (Grade, then Story Value).
//
// A candidate must be:
// • Review Status = "Reviewed"
// • NOT already Hero Image / Final Book (those were already
//   auto-pushed by the First Pass Reviewer)
// • NOT already decided by Second Pass ("Book Possibility"
//   or "Not Selected")
// • NOT already present in Final Book Image Possibilities
// ==========================================================

function getSecondPassCandidates(category) {

  const media =
    getAllMedia();

  const bookFileIds =
    getBookListFileIdSet();

  const candidates = [];


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

    if (record.category !== category) {
      continue;
    }

        if (
      String(record.reviewStatus || "").trim() !==
      "Reviewed"
    ) {
      continue;
    }

    // --------------------------------------------------------
    // EXCLUDE REJECTED IMAGES
    // ----------------------------------------------------------
    // Reject is a First Pass "Not for Book" decision. It must
    // be a hard, permanent exclusion — Second Pass should never
    // re-surface an image Enos already rejected, even if a
    // category runs short on S/A/B/C candidates.
    // --------------------------------------------------------

    if (
      String(record.grade || "").trim() ===
      "Reject"
    ) {
      continue;
    }

    if (
      record.hero === true ||
      record.finalBook === true
    ) {
      continue;
    }

    const stage =
      String(record.selectionStage || "").trim();

    if (
      stage === "Book Possibility" ||
      stage === "Not Selected"
    ) {
      continue;
    }

    if (bookFileIds[record.id]) {
      continue;
    }

    candidates.push({
      row: i + 1,
      record: record
    });

  }


  candidates.sort(function(a, b) {

    const gradeDiff =
      secondPassGradeRank(b.record.grade) -
      secondPassGradeRank(a.record.grade);

    if (gradeDiff !== 0) {
      return gradeDiff;
    }

    return (
      (Number(b.record.storyValue) || 0) -
      (Number(a.record.storyValue) || 0)
    );

  });


  return candidates;

}


// ==========================================================
// SCALED PREVIEW (Drive API thumbnail)
// ----------------------------------------------------------
// Fetches a resized preview via the Drive Advanced Service
// (already enabled in this project) instead of sending the
// full-resolution original through google.script.run.
//
// Full-resolution JPEGs can be tens of MB — pushing that much
// base64 text back to the dialog can exceed google.script.run's
// transfer limits and surface as a generic
// "JavaScript engine reported an unexpected error. Error code
// INTERNAL" with no useful message. A ~1600px preview is more
// than enough for a selection decision and avoids that entirely.
//
// Returns null (rather than throwing) if no thumbnail is
// available yet, so the caller can fall back to the full image.
// ==========================================================

function getScaledSecondPassPreview(fileId) {

  let meta;

  try {

    meta =
      Drive.Files.get(
        fileId,
        { fields: "thumbnailLink" }
      );

  }

  catch (error) {

    return null;

  }

  if (!meta || !meta.thumbnailLink) {
    return null;
  }

  // Drive's default thumbnail is small (~220px). Request a
  // larger size by swapping the trailing =sNN size parameter.
  const url =
    meta.thumbnailLink.replace(
      /=s\d+$/,
      "=s1600"
    );

  const response =
    UrlFetchApp.fetch(
      url,
      {
        headers: {
          Authorization:
            "Bearer " + ScriptApp.getOAuthToken()
        },
        muteHttpExceptions: true
      }
    );

  if (response.getResponseCode() !== 200) {
    return null;
  }

  const blob =
    response.getBlob();

  const contentType =
    blob.getContentType() || "image/jpeg";

  const base64 =
    Utilities.base64Encode(
      blob.getBytes()
    );

  return (
    "data:" +
    contentType +
    ";base64," +
    base64
  );

}


// ==========================================================
// IMAGE LOADING
// ----------------------------------------------------------
// Tries a scaled Drive thumbnail first (small payload, fast).
// Falls back to the full-resolution Base64 data URL — the
// same approach as the First Pass Reviewer — only if no
// thumbnail is available yet.
// ==========================================================

function loadSecondPassImage(fileId, row, fileName) {

  try {

    const preview =
      getScaledSecondPassPreview(
        fileId
      );

    if (preview) {
      return preview;
    }

  }

  catch (thumbError) {

    Logger.log(
      "Second Pass: scaled preview failed, falling back to " +
      "full image. Row: " + row +
      " | File: " + fileName +
      " | " + thumbError.message
    );

  }

  try {

    const file =
      DriveApp.getFileById(
        fileId
      );

    const blob =
      file.getBlob();

    const contentType =
      blob.getContentType();

    const base64 =
      Utilities
        .base64Encode(
          blob.getBytes()
        );

    return (
      "data:" +
      contentType +
      ";base64," +
      base64
    );

  }

  catch (error) {

    throw new Error(
      "Could not load image from Google Drive. " +
      "Row: " + row +
      " | File: " + fileName +
      " | " + error.message
    );

  }

}


// ==========================================================
// GET NEXT SECOND PASS IMAGE
// ----------------------------------------------------------
// Returns the strongest remaining un-decided candidate for
// a category, ready for display in the Second Pass Reviewer.
// ==========================================================

function getNextSecondPassImage(category) {

  const candidates =
    getSecondPassCandidates(category);

  if (candidates.length === 0) {

    return {
      hasImage: false,
      category: category,
      remainingCandidates: 0
    };

  }


  const next =
    candidates[0];

  const record =
    next.record;

  const imageUrl =
    loadSecondPassImage(
      record.id,
      next.row,
      record.name
    );


  return {

    hasImage: true,
    row: next.row,
    category: category,
    remainingCandidates: candidates.length,
    fileName: record.name || "",
    imageUrl: imageUrl,
    grade: record.grade || "",
    storyValue: record.storyValue || "",
    layoutSuitability: record.layoutSuitability || "",
    caption: record.caption || "",
    notes: record.notes || ""

  };

}


// ==========================================================
// SAVE SECOND PASS DECISION
// ----------------------------------------------------------
// decision: "add" or "skip"
//
// "add"  → stamps Selection Stage = "Book Possibility" and
//          syncs the record into Final Book Image
//          Possibilities with Status = "Reviewed".
//
// "skip" → stamps Selection Stage = "Not Selected" so the
//          image is not shown again by Second Pass.
// ==========================================================

function saveSecondPassDecision(row, decision) {

  const sheet =
    getMediaSheet();

  if (!sheet) {

    throw new Error(
      "Media Database sheet not found."
    );

  }

  const lastRow =
    sheet.getLastRow();

  if (
    row < REVIEWER.START_ROW ||
    row > lastRow
  ) {

    throw new Error(
      "Invalid Media Database row: " + row
    );

  }


  if (decision === "add") {

    sheet
      .getRange(
        row,
        COL.SELECTION_STAGE
      )
      .setValue(
        "Book Possibility"
      );

    const rawRow =
      sheet
        .getRange(
          row,
          1,
          1,
          sheet.getLastColumn()
        )
        .getValues()[0];

    try {

      syncSingleMediaRecordToBookList(
        rawRow,
        "Reviewed"
      );

    }

    catch (error) {

      Logger.log(
        "Second Pass: could not sync record to Book List: " +
        error.message
      );

    }

  }

  else if (decision === "skip") {

    sheet
      .getRange(
        row,
        COL.SELECTION_STAGE
      )
      .setValue(
        "Not Selected"
      );

  }

  else {

    throw new Error(
      "Unknown Second Pass decision: " + decision
    );

  }


  return {
    success: true
  };

}


// ==========================================================
// FIRST UNDER-TARGET CATEGORY
// ----------------------------------------------------------
// Used to auto-select a sensible starting category when the
// Second Pass Reviewer is opened.
// ==========================================================

function getFirstUnderTargetCategory() {

  const progress =
    getSecondPassProgress();

  for (
    let i = 0;
    i < progress.length;
    i++
  ) {

    if (progress[i].status === "under") {
      return progress[i].category;
    }

  }

  return (
    progress.length
      ? progress[0].category
      : null
  );

}


// ==========================================================
// DEVELOPMENT TESTS
// ==========================================================

/**
 * Read-only test. Logs category quotas and the total number
 * of images needed across the whole book (should be close to
 * CONFIG.TARGETS.FINAL_BOOK).
 */
function testCalculateCategoryQuotas() {

  const result =
    calculateCategoryQuotas();

  Logger.log(
    "Total images needed: " +
    result.totalNeeded
  );

  Object.keys(result.categories).forEach(function(category) {

    const quota =
      result.categories[category];

    Logger.log(
      category +
      " — needed: " + quota.needed +
      " | target (x2): " + quota.target
    );

  });

}


/**
 * Read-only test. Logs the current Second Pass progress
 * for every category.
 */
function testSecondPassProgress() {

  const progress =
    getSecondPassProgress();

  progress.forEach(function(p) {

    Logger.log(
      p.category +
      ": " + p.current + " / " + p.target +
      " (" + p.status + ")"
    );

  });

}