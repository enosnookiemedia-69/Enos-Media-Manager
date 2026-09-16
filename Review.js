/**
 * ==========================================================
 * REVIEW.GS
 * ----------------------------------------------------------
 * Controls the Image Reviewer workflow.
 *
 * Current workflow:
 *
 * Media Database
 *       ↓
 *     Review
 *       ↓
 *    Reviewed
 *       ↓
 *   Hero / Final Book
 *
 * The reviewer does NOT control:
 * • Book Candidate
 * • Selection Stage
 * • Book List synchronisation
 * • Spread
 * • Page
 *
 * ==========================================================
 */


// ==========================================================
// REVIEWER SETTINGS
// ==========================================================

const REVIEWER = {

  START_ROW: 2,

  LAST_ROW_PROPERTY:
    "REVIEWER_LAST_ROW",

  LAST_REVIEW_PROPERTY:
    "REVIEWER_LAST_DATE"

};


// ==========================================================
// REVIEWER POSITION
// ==========================================================

function getLastReviewedRow() {

  const properties =
    PropertiesService.getUserProperties();

  const lastRow =
    properties.getProperty(
      REVIEWER.LAST_ROW_PROPERTY
    );

  if (!lastRow) {

    return REVIEWER.START_ROW;

  }

  const parsedRow =
    Number(lastRow);

  if (
    !Number.isFinite(parsedRow) ||
    parsedRow < REVIEWER.START_ROW
  ) {

    return REVIEWER.START_ROW;

  }

  return parsedRow;

}


// ==========================================================
// SAVE REVIEWER POSITION
// ==========================================================

function saveReviewerPosition(rowNumber) {

  const properties =
    PropertiesService.getUserProperties();

  properties.setProperty(
    REVIEWER.LAST_ROW_PROPERTY,
    String(rowNumber)
  );

  properties.setProperty(
    REVIEWER.LAST_REVIEW_PROPERTY,
    new Date().toISOString()
  );

}


// ==========================================================
// REVIEW COUNT
// ==========================================================

function getReviewCount() {

  const media =
    getAllMedia();

  let reviewedCount = 0;

  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    const reviewStatus =
      media[i][COL.REVIEW_STATUS - 1];

    if (
      String(reviewStatus || "").trim() ===
      "Reviewed"
    ) {

      reviewedCount++;

    }

  }

  return reviewedCount;

}


// ==========================================================
// REVIEW PROGRESS
// ==========================================================

function getReviewProgress() {

  const properties =
    PropertiesService.getUserProperties();

  return {

    currentRow:
      getLastReviewedRow(),

    reviewed:
      getReviewCount(),

    lastReview:
      properties.getProperty(
        REVIEWER.LAST_REVIEW_PROPERTY
      ) || ""

  };

}


// ==========================================================
// SAFE VALUE
// ==========================================================
//
// Google Apps Script's google.script.run transport is much
// happier when the returned object contains only simple,
// JSON-safe values.
//
// In particular, do not return Date objects directly.
// Convert them to strings first.
// ==========================================================

function reviewSafeValue(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }

  if (
    value instanceof Date
  ) {

    return value.toISOString();

  }

  if (
    typeof value === "boolean"
  ) {

    return value;

  }

  if (
    typeof value === "number"
  ) {

    return Number.isFinite(value)
      ? value
      : "";

  }

  return String(value);

}


// ==========================================================
// SAFE BOOLEAN
// ==========================================================

function reviewBoolean(value) {

  return (
    value === true ||
    String(value).toUpperCase() === "TRUE"
  );

}


// ==========================================================
// IMAGE LOADING
// ==========================================================

/**
 * Gets the current image for review.
 *
 * IMPORTANT:
 * The returned object contains only primitive JSON-safe
 * values so it can safely cross google.script.run.
 *
 * The image is loaded directly from Google Drive and
 * converted to a Base64 data URL. This avoids relying on
 * the Google Drive thumbnail endpoint inside the HTML
 * sandbox.
 */
function getCurrentReviewImage() {

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
    lastRow < REVIEWER.START_ROW
  ) {

    throw new Error(
      "Media Database contains no image records."
    );

  }


  // --------------------------------------------------------
  // ALWAYS START AT THE FIRST UNREVIEWED IMAGE
  // ----------------------------------------------------------
  // getCurrentReviewImage() is only called for a fresh
  // Reviewer load (page open / sidebar open) — Next and Back
  // use loadReviewImageForRow() directly and do plain +1 / -1,
  // with no skipping.
  //
  // On a fresh load, ignore whatever row happened to be
  // stored and scan from row 2 for the first row that has no
  // reviewing info yet, so the Reviewer always resumes exactly
  // where genuine review work left off — not at row 2, and not
  // at a row that was already reviewed.
  // --------------------------------------------------------

  const row =
    findFirstUnreviewedRow();


  if (row === null) {

    throw new Error(
      "First Pass review complete — " +
      "every image has been reviewed or marked Reject."
    );

  }


  saveReviewerPosition(
    row
  );


  return loadReviewImageForRow(
    row
  );

}


// ==========================================================
// LOAD REVIEW IMAGE FOR A SPECIFIC ROW
// ----------------------------------------------------------
// Builds the JSON-safe payload for exactly the row given —
// no lookup, no clamping, no skipping. This is the shared
// low-level loader used by getCurrentReviewImage() (after it
// has decided which row to show) and directly by
// nextReviewImage() / previousReviewImage(), so that Next and
// Back are plain +1 / -1 with nothing smarter layered on top.
// ==========================================================

function loadReviewImageForRow(row) {

  const sheet =
    getMediaSheet();


  if (!sheet) {

    throw new Error(
      "Media Database sheet not found."
    );

  }


  const lastRow =
    sheet.getLastRow();


  const record =
    getMediaRecordByRow(
      row
    );


  if (!record) {

    throw new Error(
      "No media record was returned for row " +
      row
    );

  }


  const fileId =
    reviewSafeValue(
      record[COL.FILE_ID - 1]
    );


  const fileName =
    reviewSafeValue(
      record[COL.NAME - 1]
    );


  if (!fileId) {

    throw new Error(
      "Image record has no File ID. Row: " +
      row +
      " | File: " +
      fileName
    );

  }


  // --------------------------------------------------------
  // LOAD IMAGE DIRECTLY FROM GOOGLE DRIVE
  // --------------------------------------------------------
  //
  // Instead of returning:
  //
  // https://drive.google.com/thumbnail?id=...
  //
  // we load the Drive file here and return a Base64
  // data URL that the HTML reviewer can display directly.
  //
  // --------------------------------------------------------

  let imageUrl = "";


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


    imageUrl =
      "data:" +
      contentType +
      ";base64," +
      base64;

  }

  catch (error) {

    throw new Error(
      "Could not load image from Google Drive. " +
      "Row: " +
      row +
      " | File: " +
      fileName +
      " | " +
      error.message
    );

  }


  // --------------------------------------------------------
  // Build the object using ONLY JSON-safe values.
  // --------------------------------------------------------

  const result = {

    row:
      row,


    total:
      lastRow -
      REVIEWER.START_ROW +
      1,


    fileName:
      fileName,


    imageUrl:
      imageUrl,


    metadata: {

      year:
        reviewSafeValue(
          record[COL.YEAR - 1]
        ),


      photographer:
        reviewSafeValue(
          record[COL.PHOTOGRAPHER - 1]
        ),


      camera:
        reviewSafeValue(
          record[COL.CAMERA_MODEL - 1]
        ),


      category:
        reviewSafeValue(
          record[COL.CATEGORY - 1]
        )

    },


    creative: {

      layoutSuitability:
        reviewSafeValue(
          record[COL.LAYOUT_SUITABILITY - 1]
        ),


      printSuitability:
        reviewSafeValue(
          record[COL.PRINT_SUITABILITY - 1]
        ),


      grade:
        reviewSafeValue(
          record[COL.GRADE - 1]
        ),


      storyValue:
        reviewSafeValue(
          record[COL.STORY_VALUE - 1]
        ),


      heroImage:
        reviewBoolean(
          record[COL.HERO_IMAGE - 1]
        ),


      finalBook:
        reviewBoolean(
          record[COL.FINAL_BOOK - 1]
        ),


      caption:
        reviewSafeValue(
          record[COL.CAPTION - 1]
        ),


      spread:
        reviewSafeValue(
          record[COL.SPREAD - 1]
        ),


      page:
        reviewSafeValue(
          record[COL.PAGE - 1]
        ),


      notes:
        reviewSafeValue(
          record[COL.NOTES - 1]
        ),


      reviewDate:
        reviewSafeValue(
          record[COL.REVIEW_DATE - 1]
        ),


      reviewStatus:
        reviewSafeValue(
          record[COL.REVIEW_STATUS - 1]
        )

    }

  };


  Logger.log(
    "Reviewer loaded row " +
    row +
    ": " +
    fileName
  );


  Logger.log(
    "File ID: " +
    fileId
  );


  Logger.log(
    "Image loaded from Drive successfully."
  );


  Logger.log(
    "Image MIME type: " +
    imageUrl.substring(
      0,
      imageUrl.indexOf(";")
    )
  );


  return result;

}


// ==========================================================
// THUMBNAIL URL
// ==========================================================

function buildThumbnailUrl(fileId) {

  if (!fileId) {

    return "";

  }


  return (
    "https://drive.google.com/thumbnail?id=" +
    encodeURIComponent(fileId) +
    "&sz=w1600"
  );

}


// ==========================================================
// MEDIA DATABASE LOOKUP
// ==========================================================

function getMediaRecordByRow(rowNumber) {

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
    rowNumber < REVIEWER.START_ROW ||
    rowNumber > lastRow
  ) {

    throw new Error(
      "No media record exists for row " +
      rowNumber
    );

  }

  return sheet
    .getRange(
      rowNumber,
      1,
      1,
      sheet.getLastColumn()
    )
    .getValues()[0];

}


// ==========================================================
// FIND FIRST UNREVIEWED ROW
// ----------------------------------------------------------
// Scans the Media Database from row 2 downward and returns the
// row number of the first row that has no reviewing info yet —
// i.e. COL.REVIEW_STATUS is NOT "Reviewed". Rows graded
// "Reject" count as reviewed too, since saveReview() always
// stamps REVIEW_STATUS = "Reviewed" regardless of Grade.
//
// Returns null when every row has been reviewed (used as the
// "First Pass complete" signal).
//
// This is a single-column bulk read (one getRange call), so
// it's cheap to call on every fresh Reviewer load.
//
// This does NOT look at populated metadata (Name, Width,
// Height, Aspect Ratio, Megapixels, etc.) — only the actual
// review status field counts.
// ==========================================================

function findFirstUnreviewedRow() {

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
    lastRow < REVIEWER.START_ROW
  ) {

    return null;

  }

  const statusValues =
    sheet
      .getRange(
        REVIEWER.START_ROW,
        COL.REVIEW_STATUS,
        lastRow - REVIEWER.START_ROW + 1,
        1
      )
      .getValues();

  for (
    let i = 0;
    i < statusValues.length;
    i++
  ) {

    const status =
      String(
        statusValues[i][0] || ""
      ).trim();

    if (
      status !== "Reviewed"
    ) {

      return REVIEWER.START_ROW + i;

    }

  }

  return null;

}


// ==========================================================
// SAVE REVIEW
// ==========================================================

function saveReview(reviewData) {

  if (!reviewData) {

    throw new Error(
      "No review data was supplied."
    );

  }

  const currentRow =
    getLastReviewedRow();

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
    currentRow < REVIEWER.START_ROW ||
    currentRow > lastRow
  ) {

    throw new Error(
      "Cannot save review. Invalid Media Database row: " +
      currentRow
    );

  }

  // --------------------------------------------------------
  // Helper to write a single database cell.
  //
  // This makes the reviewer extremely explicit about which
  // fields it owns and prevents accidental overwrites.
  // --------------------------------------------------------

  function setReviewField(column, value) {

    sheet
      .getRange(
        currentRow,
        column
      )
      .setValue(value);

  }

  // --------------------------------------------------------
  // CREATIVE REVIEW
  // --------------------------------------------------------

  setReviewField(
    COL.LAYOUT_SUITABILITY,
    reviewData.layoutSuitability || ""
  );

  setReviewField(
    COL.PRINT_SUITABILITY,
    reviewData.printSuitability || ""
  );

  setReviewField(
    COL.CATEGORY,
    reviewData.category || ""
  );

  setReviewField(
    COL.GRADE,
    reviewData.grade || ""
  );

  setReviewField(
    COL.STORY_VALUE,
    reviewData.storyValue || ""
  );

  // --------------------------------------------------------
  // HERO
  // --------------------------------------------------------

  setReviewField(
    COL.HERO_IMAGE,
    reviewData.heroImage === true
  );

  // --------------------------------------------------------
  // FINAL BOOK
  // --------------------------------------------------------

  setReviewField(
    COL.FINAL_BOOK,
    reviewData.finalBook === true
  );

  // --------------------------------------------------------
  // CAPTION
  // --------------------------------------------------------

  setReviewField(
    COL.CAPTION,
    reviewData.caption || ""
  );

  // --------------------------------------------------------
  // NOTES
  // --------------------------------------------------------

  setReviewField(
    COL.NOTES,
    reviewData.notes || ""
  );

  // --------------------------------------------------------
  // REVIEW TRACKING
  // --------------------------------------------------------

  setReviewField(
    COL.REVIEW_DATE,
    new Date()
  );

  setReviewField(
    COL.REVIEW_STATUS,
    "Reviewed"
  );

  // --------------------------------------------------------
  // EDITORIAL SCORE
  // --------------------------------------------------------

  const updatedRecord =
    getMediaRecordByRow(
      currentRow
    );

  try {

    const score =
      calculateSelectionScore(
        updatedRecord
      );

    Logger.log(
      "Editorial Score: " +
      score
    );

  }

  catch (error) {

    Logger.log(
      "Editorial score could not be calculated: " +
      error.message
    );

  }

 // --------------------------------------------------------
  // AUTO-ADD TO FINAL BOOK IMAGE POSSIBILITIES
  //
  // Hero Image and Final Book are strong editorial signals
  // that this image will very likely make the book, so it
  // is synced immediately rather than waiting for a full
  // Book List sync. Status is stamped "Pushed" so you can
  // see it arrived here via this shortcut rather than a
  // future Second Pass sync.
  // --------------------------------------------------------

  if (
    reviewData.heroImage === true ||
    reviewData.finalBook === true
  ) {

    try {

      syncSingleMediaRecordToBookList(
        updatedRecord
      );

    }

    catch (error) {

      Logger.log(
        "Could not sync record to Final Book Image Possibilities: " +
        error.message
      );

    }

    // ------------------------------------------------------
    // ALSO LIVE-PUSH INTO BOOK IMAGE BALANCE
    //
    // Hero Image / Final Book are certainties for the 246
    // pool, not just candidates — so push straight into Book
    // Image Balance too, not only Final Book Possibilities.
    // Status "Pushed" matches the label syncBookBalanceFromMedia()
    // already uses for Hero/Final Book images.
    // ------------------------------------------------------

    try {

      syncSingleMediaRecordToBookBalance(
        updatedRecord,
        "Pushed"
      );

    }

    catch (error) {

      Logger.log(
        "Could not sync record to Book Image Balance: " +
        error.message
      );

    }

  }

 recordReviewActivity(
    "FIRST_PASS",
    "First Pass Review"
  );



  // --------------------------------------------------------
  // NOTE: saveReview() intentionally does NOT move the
  // reviewer position anymore.
  //
  // Previously this function advanced REVIEWER_LAST_ROW to
  // currentRow + 1, and the Next button ALSO advanced it —
  // silently skipping a row on every Save-then-Next click.
  // Next/Back now do plain +1 / -1 on their own, and
  // findFirstUnreviewedRow() (used by getCurrentReviewImage()
  // on a fresh load, and by nextReviewImage() to detect
  // completion) reports when every row has been reviewed.
  // Saving a review no longer has any side effect on position.
  // --------------------------------------------------------

  return {

    success:
      true,

    message:
      "Review saved",

    currentRow:
      currentRow

  };

}


// ==========================================================
// NAVIGATION — NEXT
// ==========================================================

function nextReviewImage() {

  // If every row is already reviewed, show the completion
  // message instead of moving — don't do this check via
  // getCurrentReviewImage(), since that function re-locates to
  // the first unreviewed row, which would undo plain +1 math.

  if (
    findFirstUnreviewedRow() === null
  ) {

    throw new Error(
      "First Pass review complete — " +
      "every image has been reviewed or marked Reject."
    );

  }

  const sheet =
    getMediaSheet();

  if (!sheet) {

    throw new Error(
      "Media Database sheet not found."
    );

  }

  const lastRow =
    sheet.getLastRow();

  const currentRow =
    getLastReviewedRow();

  const nextRow =
    Math.min(
      currentRow + 1,
      lastRow
    );

  saveReviewerPosition(
    nextRow
  );

  return loadReviewImageForRow(
    nextRow
  );

}


// ==========================================================
// NAVIGATION — PREVIOUS
// ==========================================================

function previousReviewImage() {

  const currentRow =
    getLastReviewedRow();

  const previousRow =
    Math.max(
      REVIEWER.START_ROW,
      currentRow - 1
    );

  saveReviewerPosition(
    previousRow
  );

  return loadReviewImageForRow(
    previousRow
  );

}


// ==========================================================
// RESET
// ==========================================================

function resetReviewerPosition() {

  const properties =
    PropertiesService.getUserProperties();

  properties.deleteProperty(
    REVIEWER.LAST_ROW_PROPERTY
  );

  properties.deleteProperty(
    REVIEWER.LAST_REVIEW_PROPERTY
  );

  Logger.log(
    "Reviewer position reset."
  );

}


// ==========================================================
// DEBUG — FIRST UNREVIEWED ROW
// ----------------------------------------------------------
// Read-only. Confirms which row the Reviewer will jump to on
// its next fresh load, without opening the Reviewer or
// changing any stored position.
// ==========================================================

function debugFindFirstUnreviewedRow() {

  const row =
    findFirstUnreviewedRow();

  if (row === null) {

    Logger.log(
      "No unreviewed row found — " +
      "First Pass review is complete."
    );

  } else {

    Logger.log(
      "First unreviewed row: " +
      row
    );

  }

}


// ==========================================================
// DEBUG
// ==========================================================

function checkReviewerPosition() {

  Logger.log(
    "Current reviewer row: " +
    getLastReviewedRow()
  );

}


// ==========================================================
// DEBUG CURRENT ROW
// ==========================================================

function debugCurrentReviewRow() {

  const row =
    getLastReviewedRow();

  const record =
    getMediaRecordByRow(row);

  Logger.log(
    "=========================================="
  );

  Logger.log(
    "REVIEW ROW: " +
    row
  );

  Logger.log(
    "=========================================="
  );

  for (
    let i = 0;
    i < record.length;
    i++
  ) {

    Logger.log(
      "Column " +
      (i + 1) +
      " = " +
      record[i]
    );

  }

}


// ==========================================================
// TEST — REVIEW DATA PAYLOAD
// ==========================================================
//
// THIS IS THE IMPORTANT TEST.
//
// Run this from Apps Script before opening the reviewer.
// It confirms that getCurrentReviewImage() actually returns
// the object expected by ReviewHTML.html.
// ==========================================================

function testCurrentReviewImage() {

  Logger.log(
    "=========================================="
  );

  Logger.log(
    "CURRENT REVIEW IMAGE TEST"
  );

  Logger.log(
    "=========================================="
  );

  try {

    const data =
      getCurrentReviewImage();

    Logger.log(
      JSON.stringify(data)
    );

    Logger.log(
      "Row: " +
      data.row
    );

    Logger.log(
      "Total: " +
      data.total
    );

    Logger.log(
      "File: " +
      data.fileName
    );

    Logger.log(
      "Image URL: " +
      data.imageUrl
    );

    Logger.log(
      "=========================================="
    );

    Logger.log(
      "RESULT: REVIEW DATA PAYLOAD OK"
    );

  }

  catch (error) {

    Logger.log(
      "=========================================="
    );

    Logger.log(
      "RESULT: FAILED"
    );

    Logger.log(
      error.message
    );

    Logger.log(
      error.stack
    );

  }

  Logger.log(
    "=========================================="
  );

}