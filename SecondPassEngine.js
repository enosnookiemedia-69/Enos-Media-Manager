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

  FILE_NAME: 1,
  YEAR: 2,
  CATEGORY: 3,
  POSITION: 4,
  SEQUENCE: 5,
  PAGE: 6,
  SECTION: 7,
  LAYOUT_SUITABILITY: 8,
  ORIENTATION: 9,
  LAYOUT_TYPE: 10,
  SPREAD: 11,
  CAPTION: 12,
  NOTES: 13,
  PHOTOGRAPHER: 14,
  EDITORIAL_SCORE: 15,
  GRADE: 16,
  STORY_VALUE: 17,
  HERO: 18,
  PRINT_SUITABILITY: 19,
  ASPECT_RATIO: 20,
  STATUS: 21

};

const BOOK_LAYOUT_START_ROW = 2;

// ==========================================================
// BOOK LAYOUT CATEGORY ALIASES
// ----------------------------------------------------------
// Book Final Layout spells some categories differently from
// the Media Database. Map them here so quota keys match.
// ==========================================================

const BOOK_LAYOUT_CATEGORY_ALIASES = {
  "Artwork & Burns": "Artworks & Burns"
};



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
        BOOK_LAYOUT_COL.STATUS
      )
      .getValues();


  const seenSpreads = {};

  const manualTargets =
    CONFIG.MANUAL_CATEGORY_TARGETS || {};


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

    const layoutSuitability =
      String(
        row[BOOK_LAYOUT_COL.LAYOUT_SUITABILITY - 1] || ""
      );

    if (
      layoutType === "Text" ||
      layoutSuitability === "Text"
    ) {
      return;
    }

    const rawCategory =
      String(
        row[BOOK_LAYOUT_COL.CATEGORY - 1] || ""
      ).trim();

    const category =
      BOOK_LAYOUT_CATEGORY_ALIASES[rawCategory] ||
      rawCategory ||
      "Uncategorized";

    // Skip (and report) anything that is not a real photo category.
    if (
      CONFIG.CATEGORIES.indexOf(category) === -1 &&
      !manualTargets[category]
    ) {

      Logger.log(
        "Quota skip: page " +
        row[BOOK_LAYOUT_COL.PAGE - 1] +
        " has category \"" + category + "\""
      );

      return;

    }

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
      (layoutType + " " + layoutSuitability)
        .toLowerCase()
        .indexOf("dual") !== -1
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

  Object.keys(manualTargets).forEach(function(category) {

    const needed =
      manualTargets[category];

    // Avoid double counting if layout rows already
    // contributed to this category.
    if (quotas[category]) {
      totalNeeded -= quotas[category].needed;
    }

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
// Counts how many images currently count TOWARD each
// category's target in Final Book Possibilities.
//
// Only rows already DECIDED in are counted:
// • Status = "Pushed"   (Hero / Final Book certainty)
// • Status = "Selected" (added during Second Pass)
//
// Status = "Candidate" (undecided Second Pass pool) and
// Status = "Not Selected" (Second Pass skip) do NOT count —
// otherwise progress would look "met" the moment the rebuild
// fills the ~350 pool, before Second Pass has decided anything.
// ==========================================================

const BOOKLIST_DECIDED_STATUSES = {
  "Pushed": true,
  "Selected": true
};

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

    const status =
      String(
        row[BOOKLIST.COLUMNS.STATUS - 1] || ""
      ).trim();

    if (!BOOKLIST_DECIDED_STATUSES[status]) {
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
// Returns candidates for a given category, sorted
// strongest-first (Grade, then Story Value).
//
// SOURCE: Final Book Possibilities (not Media Database).
// rebuildFinalBookPossibilities() (BookList.gs) already built
// the curated ~350-image pool — Reviewed, non-Reject, ranked
// by editorial score, capped per category — so Second Pass
// now narrows THAT pool down instead of re-deriving it from
// the full Media Database.
//
// A candidate must be a Final Book Possibilities row with:
// • Category = the requested category
// • Status = "Candidate" (undecided — NOT "Pushed", which is
//   a First Pass Hero/Final Book certainty already counted in,
//   and NOT "Selected" / "Not Selected", which Second Pass has
//   already decided on)
// ==========================================================

function getSecondPassCandidates(category) {

  const sheet =
    getBookSheet();

  const lastRow =
    sheet.getLastRow();

  const candidates = [];


  if (
    lastRow < BOOKLIST.START_ROW
  ) {

    return candidates;

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


  rows.forEach(function(row, index) {

    const fileId =
      row[BOOKLIST.COLUMNS.FILE_ID - 1];

    if (!fileId) {
      return;
    }

    if (
      row[BOOKLIST.COLUMNS.CATEGORY - 1] !==
      category
    ) {
      return;
    }

    const status =
      String(
        row[BOOKLIST.COLUMNS.STATUS - 1] || ""
      ).trim();

    if (status !== "Candidate") {
      return;
    }

    candidates.push({

      row:
        BOOKLIST.START_ROW + index,

      record: {

        id: fileId,
        name: row[BOOKLIST.COLUMNS.FILE_NAME - 1],
        grade: row[BOOKLIST.COLUMNS.GRADE - 1],
        storyValue: row[BOOKLIST.COLUMNS.STORY_VALUE - 1],
        layoutSuitability:
          row[BOOKLIST.COLUMNS.LAYOUT_SUITABILITY - 1],
        caption: row[BOOKLIST.COLUMNS.CAPTION - 1],
        notes: row[BOOKLIST.COLUMNS.NOTES - 1]

      }

    });

  });


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
// "row" is now a FINAL BOOK POSSIBILITIES row (candidates come
// from that sheet — see getSecondPassCandidates() above), not
// a Media Database row.
//
// "add"  → stamps that Final Book Possibilities row's Status
//          = "Selected" (now counts toward the category
//          target — see BOOKLIST_DECIDED_STATUSES) and mirrors
//          Selection Stage = "Book Possibility" onto the
//          matching Media Database row for back-reference.
//
// "skip" → stamps Status = "Not Selected" so the row is
//          excluded from future candidate queries but stays
//          in the sheet for reference, and mirrors Selection
//          Stage = "Not Selected" onto Media Database.
// ==========================================================

function saveSecondPassDecision(row, decision) {

  const sheet =
    getBookSheet();

  const lastRow =
    sheet.getLastRow();

  if (
    row < BOOKLIST.START_ROW ||
    row > lastRow
  ) {

    throw new Error(
      "Invalid Final Book Possibilities row: " + row
    );

  }

  if (
    decision !== "add" &&
    decision !== "skip"
  ) {

    throw new Error(
      "Unknown Second Pass decision: " + decision
    );

  }


  const fileId =
    sheet
      .getRange(
        row,
        BOOKLIST.COLUMNS.FILE_ID
      )
      .getValue();

  const newStatus =
    decision === "add"
      ? "Selected"
      : "Not Selected";

  sheet
    .getRange(
      row,
      BOOKLIST.COLUMNS.STATUS
    )
    .setValue(
      newStatus
    );


    // --------------------------------------------------------
  // Mirror the decision onto Media Database for back-reference
  // (Selection Stage column). Best-effort — Second Pass's own
  // state lives on the Final Book Possibilities row above, so
  // this must never block the decision if it fails.
  // --------------------------------------------------------

  try {

    const mediaRow =
      findRowByFileId(
        fileId
      );

    if (mediaRow !== -1) {

      getMediaSheet()
        .getRange(
          mediaRow,
          COL.SELECTION_STAGE
        )
        .setValue(
          decision === "add"
            ? "Book Possibility"
            : "Not Selected"
        );

      // ----------------------------------------------------
      // LIVE-PUSH "ADD" DECISIONS INTO BOOK IMAGE BALANCE
      //
      // An "Add" decision should land in the 246 pool
      // immediately, not wait for a separate "Rebuild Book
      // Image Balance" batch run. Status "Reviewed" matches
      // the label syncBookBalanceFromMedia() already uses
      // for Second-Pass-added images.
      // ----------------------------------------------------

      if (decision === "add") {

        try {

          const mediaRawRow =
            getMediaRecordByRow(
              mediaRow
            );

          syncSingleMediaRecordToBookBalance(
            mediaRawRow,
            "Reviewed"
          );

        }

        catch (balanceError) {

          Logger.log(
            "Second Pass: could not sync 'add' decision to " +
            "Book Image Balance: " + balanceError.message
          );

        }

      }

    }

  }

  catch (error) {

    Logger.log(
      "Second Pass: could not mirror decision to Media " +
      "Database: " + error.message
    );

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
}
