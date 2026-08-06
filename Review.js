/**
 * ==========================================================
 * REVIEW.GS
 * ----------------------------------------------------------
 * Controls the Image Reviewer workflow.
 *
 * Responsibilities
 * ----------------
 * • Manage current review position
 * • Load image records for review
 * • Save creative review decisions
 * • Track reviewer progress
 *
 * Communicates with:
 * • ReviewUI.gs
 * • ReviewHTML.html
 * • Database.gs (future)
 * • Config.gs
 * ==========================================================
 */

// ==========================================================
// REVIEWER SETTINGS
// ==========================================================


const REVIEWER = {

  /**
   * First data row in Media Database.
   *
   * Row 1 contains headers.
   */
  START_ROW: 2,

  /**
   * Stores the user's current review position.
   */
  LAST_ROW_PROPERTY:
    "REVIEWER_LAST_ROW",


  /**
   * Stores total reviewed images.
   *
   * Future use:
   * - Progress display
   * - Review dashboard
   */
  REVIEW_COUNT_PROPERTY:
    "REVIEWER_COUNT",


  /**
   * Stores last review timestamp.
   */
  LAST_REVIEW_PROPERTY:
    "REVIEWER_LAST_DATE"

};

// ==========================================================
// REVIEWER CACHE
// ==========================================================


const REVIEW_CACHE = {

  CURRENT_IMAGE: null

};

// ==========================================================
// MEDIA DATABASE COLUMN MAP
// ==========================================================
//
// Uses CONFIG.COL as the single source of truth.
//
// CONFIG.COL uses spreadsheet columns:
// A = 1
// B = 2
//
// Arrays from getValues() use:
// A = 0
// B = 1
//
// Therefore we subtract 1.
//

const REVIEW_COLUMNS = {};


Object.keys(COL).forEach(function(key) {

  REVIEW_COLUMNS[key] =
    COL[key] - 1;

});


// ==========================================================
// REVIEWER POSITION
// ==========================================================


/**
 * Returns the current review row.
 *
 * If no review has started,
 * returns the first media record.
 */
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

  return Number(lastRow);
}


/**
 * Saves the current reviewer position.
 *
 * Also records:
 * - review timestamp
 * - reviewed image count
 */
function saveReviewerPosition(rowNumber) {


  const properties =
    PropertiesService.getUserProperties();


  properties.setProperty(
    REVIEWER.LAST_ROW_PROPERTY,
    rowNumber
  );

  properties.setProperty(
    REVIEWER.LAST_REVIEW_PROPERTY,
    new Date().toISOString()
  );

}


/**
 * Returns the number of images reviewed.
 *
 * Calculated from current position.
 */
function getReviewCount() {


  const currentRow =
    getLastReviewedRow();


  return Math.max(
    0,
    currentRow - REVIEWER.START_ROW
  );

}


/**
 * Returns reviewer progress information.
 */
function getReviewProgress() {


  return {

    currentRow:
      getLastReviewedRow(),


    reviewed:
      getReviewCount(),


    lastReview:
      PropertiesService
        .getUserProperties()
        .getProperty(
          REVIEWER.LAST_REVIEW_PROPERTY
        )

  };

}

// ==========================================================
// IMAGE LOADING
// ==========================================================

/**
 * Gets the current image for review.
 *
 * Converts spreadsheet row data into
 * a reviewer object for the HTML interface.
 */
function getCurrentReviewImage() {


  const row =
    getLastReviewedRow();


  const record =
    getMediaRecordByRow(row);


  const sheet =
    SpreadsheetApp
      .getActive()
      .getSheetByName(
        CONFIG.SHEETS.MEDIA
      );

  return {

    row: row,

    total:
      sheet.getLastRow() - 1,


    fileName:
      record[REVIEW_COLUMNS.FILE_NAME],


    imageUrl:
      "https://drive.google.com/thumbnail?id=" +
      record[REVIEW_COLUMNS.FILE_ID] +
      "&sz=w1200",


    metadata: {


      year:
        record[REVIEW_COLUMNS.YEAR],


      photographer:
        record[REVIEW_COLUMNS.PHOTOGRAPHER],


      camera:
        record[REVIEW_COLUMNS.CAMERA_MODEL],


      category:
        record[REVIEW_COLUMNS.CATEGORY] ||
        "Unassigned"

    },


    creative: {


      layoutSuitability:
        record[REVIEW_COLUMNS.LAYOUT_SUITABILITY] ||
        "",

      printSuitability:
        record[REVIEW_COLUMNS.PRINT_SUITABILITY] ||
        "",

      grade:
        record[REVIEW_COLUMNS.GRADE] ||
        "",

      storyValue:
        record[REVIEW_COLUMNS.STORY_VALUE] ||
        "",

      heroImage:
        record[REVIEW_COLUMNS.HERO_IMAGE] ||
        false,

      bookCandidate:
        record[REVIEW_COLUMNS.BOOK_CANDIDATE] ||
        false,

      finalBook:
        record[REVIEW_COLUMNS.FINAL_BOOK] ||
        false,

      selectionStage:
        record[REVIEW_COLUMNS.SELECTION_STAGE] ||
        "",

      caption:
        record[REVIEW_COLUMNS.CAPTION] ||
        "",

      spread:
        record[REVIEW_COLUMNS.SPREAD] ||
        "",

      page:
        record[REVIEW_COLUMNS.PAGE] ||
        "",

      notes:
        record[REVIEW_COLUMNS.NOTES] ||
        "",

      reviewDate:
        record[REVIEW_COLUMNS.REVIEW_DATE] ||
        "",


      reviewStatus:
        record[REVIEW_COLUMNS.REVIEW_STATUS] ||
        "Not Reviewed"

    }
  };

}

// ==========================================================
// MEDIA DATABASE LOOKUP
// ==========================================================

/**
 * Gets one media record by row number.
 *
 * Temporary connection to Media Database.
 */
function getMediaRecordByRow(rowNumber) {


  const sheet =
    SpreadsheetApp
      .getActive()
      .getSheetByName(
        CONFIG.SHEETS.MEDIA
      );


  if (!sheet) {

    throw new Error(
      "Media Database sheet not found."
    );
  }


  if (
    rowNumber > sheet.getLastRow()
  ) {

    throw new Error(
      "No media record exists for row " + rowNumber
    );
  }


  const values =
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        sheet.getLastColumn()
      )
      .getValues()[0];

  return values;

}

// ==========================================================
// SAVE REVIEW
// ==========================================================

/**
 * Saves creative review information.
 *
 * Updates only editable review columns.
 */
function saveReview(reviewData) {


  const currentRow =
    getLastReviewedRow();

  const sheet =
    SpreadsheetApp
      .getActive()
      .getSheetByName(
        CONFIG.SHEETS.MEDIA
      );


  if (!sheet) {

    throw new Error(
      "Media Database sheet not found."
    );

  }

  console.log(
    "Saving review for row:",
    currentRow
  );


  console.log(
    reviewData
  );

  const updates = {};


  updates[COL.LAYOUT_SUITABILITY] =
    reviewData.layoutSuitability || "";


  updates[COL.PRINT_SUITABILITY] =
    reviewData.printSuitability || "";


  updates[COL.CATEGORY] =
    reviewData.category || "";


  updates[COL.GRADE] =
    reviewData.grade || "";


  updates[COL.STORY_VALUE] =
    reviewData.storyValue || "";


  updates[COL.HERO_IMAGE] =
    reviewData.heroImage === true;


  updates[COL.BOOK_CANDIDATE] =
    reviewData.bookCandidate === true;


  updates[COL.FINAL_BOOK] =
    reviewData.finalBook === true;


  updates[COL.SELECTION_STAGE] =
    reviewData.selectionStage || "";


  updates[COL.CAPTION] =
    reviewData.caption || "";


  updates[COL.SPREAD] =
    reviewData.spread || "";


  updates[COL.PAGE] =
    reviewData.page || "";


  updates[COL.NOTES] =
    reviewData.notes || "";


  updates[COL.REVIEW_DATE] =
    new Date();


  updates[COL.REVIEW_STATUS] =
    "Reviewed";


  // ======================================================
// WRITE VALUES
// ======================================================

Object.keys(updates)
  .forEach(function(column){

    sheet
      .getRange(
        currentRow,
        Number(column),
        1,
        1
      )
      .setValue(
        updates[column]
      );

  });


// ======================================================
// CALCULATE EDITORIAL SCORE
// ======================================================

const updatedRecord =
  getMediaRecordByRow(currentRow);

const score =
  calculateSelectionScore(
    updatedRecord
  );

Logger.log(
  "Editorial Score: " + score
);


// ======================================================
// MOVE TO NEXT IMAGE
// ======================================================

saveReviewerPosition(
  currentRow + 1
);

return {

  success:
    true,

  message:
    "Review saved",

  nextRow:
    currentRow + 1

};

}



// ==========================================================
// NAVIGATION
// ==========================================================

/**
 * Moves to next image.
 */

function nextReviewImage() {


  const currentRow =
    getLastReviewedRow();

  saveReviewerPosition(
    currentRow + 1
  );

  return getCurrentReviewImage();

}


/**
 * Moves to previous image.
 */

function previousReviewImage() {

  const currentRow =
    getLastReviewedRow();

  if (
    currentRow > REVIEWER.START_ROW
  ) {

    saveReviewerPosition(
      currentRow - 1
    );
  }

  return getCurrentReviewImage();
}

// ==========================================================
// RESET
// ==========================================================

/**
 * Resets reviewer progress.
 *
 * Useful during testing.
 */
function resetReviewerPosition() {

  PropertiesService
    .getUserProperties()
    .deleteProperty(
      REVIEWER.LAST_ROW_PROPERTY
    );


}


/**
 * Checks the current reviewer position.
 *
 * Used during development testing.
 */

function checkReviewerPosition() {

  Logger.log(
    getLastReviewedRow()
  );

}


// ==========================================================
// DEBUG TOOLS
// ==========================================================


/**
 * Shows the values of the current review row.
 *
 * Used to confirm column positions.
 */
function debugCurrentReviewRow() {


  const row =
    getLastReviewedRow();


  const record =
    getMediaRecordByRow(row);


  Logger.log(
    "Review Row: " + row
  );


  for (
    let i = 0;
    i < record.length;
    i++
  ) {


    Logger.log(
      i + " = " + record[i]
    );

  }

}


