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


  let row =
    getLastReviewedRow();


  // --------------------------------------------------------
  // Clamp the saved position to the actual database.
  // --------------------------------------------------------

  if (
    row < REVIEWER.START_ROW
  ) {

    row =
      REVIEWER.START_ROW;

  }


  if (
    row > lastRow
  ) {

    row =
      lastRow;


    saveReviewerPosition(
      row
    );

  }


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
  // MOVE TO NEXT IMAGE
  // --------------------------------------------------------

  const nextRow =
    Math.min(
      currentRow + 1,
      lastRow
    );

  saveReviewerPosition(
    nextRow
  );

  return {

    success:
      true,

    message:
      "Review saved",

    currentRow:
      currentRow,

    nextRow:
      nextRow

  };

}


// ==========================================================
// NAVIGATION — NEXT
// ==========================================================

function nextReviewImage() {

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

  return getCurrentReviewImage();

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

  return getCurrentReviewImage();

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