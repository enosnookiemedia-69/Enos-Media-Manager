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
// ==========================================================
// REVIEW COUNT
// ==========================================================

/**
 * Returns the actual number of images that have been reviewed.
 *
 * Review Status in the Media Database is the authoritative
 * source for this value.
 *
 * This is intentionally separate from the current reviewer
 * position because the reviewer can skip images.
 */
function getReviewCount() {

  const media =
    getAllMedia();

  let reviewedCount = 0;

  // Skip row 1 because it contains the headers.
  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    const reviewStatus =
      media[i][COL.REVIEW_STATUS - 1];

    if (
      reviewStatus === "Reviewed"
    ) {

      reviewedCount++;

    }

  }

  return reviewedCount;

}


// ==========================================================
// REVIEW PROGRESS
// ==========================================================

/**
 * Returns reviewer progress information.
 *
 * Current row:
 *   The image currently being viewed.
 *
 * Reviewed:
 *   The actual number of images marked "Reviewed"
 *   in the Media Database.
 *
 * Last review:
 *   The timestamp stored in User Properties.
 */
function getReviewProgress() {

  const properties =
    PropertiesService
      .getUserProperties();

  return {

    currentRow:
      getLastReviewedRow(),

    reviewed:
      getReviewCount(),

    lastReview:
      properties.getProperty(
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
// SYNCHRONISE BOOK CANDIDATE
// ======================================================
//
// If the image has been marked as a Book Candidate,
// synchronise it into Final Book Possibilities.
//

if (
  updatedRecord[COL.BOOK_CANDIDATE - 1] === true
) {

  Logger.log(
    "Book Candidate: TRUE"
  );

  syncBookList();

} else {

  Logger.log(
    "Book Candidate: FALSE"
  );

}

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


// ==========================================================
// TEST FUNCTIONS
// ==========================================================

/**
 * Tests the reviewer progress system.
 *
 * This test is completely read-only.
 *
 * Compares:
 * • Current reviewer position
 * • Calculated reviewer count
 * • Actual Review Status records
 * • Last review timestamp
 */
function testReviewProgress() {

  Logger.log("==========================================");
  Logger.log("REVIEW PROGRESS TEST");
  Logger.log("==========================================");

  // --------------------------------------------------------
  // Reviewer position
  // --------------------------------------------------------

  const currentRow =
    getLastReviewedRow();

  const reviewCount =
    getReviewCount();

  const progress =
    getReviewProgress();

  Logger.log(
    "Reviewer start row: " +
    REVIEWER.START_ROW
  );

  Logger.log(
    "Current reviewer row: " +
    currentRow
  );

  Logger.log(
    "Calculated review count: " +
    reviewCount
  );

  Logger.log(
    "Progress reviewed value: " +
    progress.reviewed
  );

  Logger.log(
    "Last review timestamp: " +
    progress.lastReview
  );

  Logger.log("------------------------------------------");

  // --------------------------------------------------------
  // Actual database review status
  // --------------------------------------------------------

  const media =
    getAllMedia();

  let actualReviewed = 0;

  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    const status =
      media[i][COL.REVIEW_STATUS - 1];

    if (
      status === "Reviewed"
    ) {

      actualReviewed++;

    }

  }

  Logger.log(
    "Media database records: " +
    (media.length - 1)
  );

  Logger.log(
    "Actual 'Reviewed' records: " +
    actualReviewed
  );

  Logger.log("------------------------------------------");

  // --------------------------------------------------------
  // Comparison
  // --------------------------------------------------------

  Logger.log(
    "Reviewer count: " +
    reviewCount
  );

  Logger.log(
    "Actual reviewed records: " +
    actualReviewed
  );

  Logger.log(
    "Difference: " +
    (reviewCount - actualReviewed)
  );

  Logger.log("------------------------------------------");

  if (
    reviewCount === actualReviewed
  ) {

    Logger.log(
      "RESULT: Reviewer progress matches database."
    );

  } else {

    Logger.log(
      "RESULT: Reviewer progress DOES NOT match database."
    );

  }

  Logger.log("==========================================");
  Logger.log("REVIEW PROGRESS TEST COMPLETE");
  Logger.log("==========================================");

}




/**
 * ==========================================================
 * REVIEW STATUS AUDIT TEST
 * ----------------------------------------------------------
 * Audits the actual Review Status values stored in the
 * Media Database.
 *
 * This test is completely read-only.
 *
 * It does NOT:
 * • Change reviewer position
 * • Change review status
 * • Modify the Media Database
 * • Modify user properties
 *
 * Purpose:
 * • Show exactly how many records have each Review Status
 * • Confirm the database state before changing review logic
 * ==========================================================
 */
function testReviewStatusAudit() {

  Logger.log("==========================================");
  Logger.log("REVIEW STATUS AUDIT TEST");
  Logger.log("==========================================");

  const media =
    getAllMedia();

  const statusColumn =
    COL.REVIEW_STATUS - 1;

  const statusCounts = {};

  let totalRecords = 0;

  // --------------------------------------------------------
  // Scan Media Database
  // --------------------------------------------------------

  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    totalRecords++;

    let status =
      media[i][statusColumn];

    // Treat blank cells as "Blank"
    if (
      status === null ||
      status === undefined ||
      status === ""
    ) {

      status = "Blank";

    }

    statusCounts[status] =
      (statusCounts[status] || 0) + 1;
  }

  // --------------------------------------------------------
  // Results
  // --------------------------------------------------------

  Logger.log(
    "Total media records: " +
    totalRecords
  );

  Logger.log("------------------------------------------");

  Object.keys(statusCounts)
    .sort()
    .forEach(function(status) {

      Logger.log(
        status +
        " : " +
        statusCounts[status]
      );

    });

  Logger.log("------------------------------------------");

  Logger.log(
    "Reviewed records: " +
    (statusCounts["Reviewed"] || 0)
  );

  Logger.log(
    "Reviewer progress: " +
    getReviewCount()
  );

  Logger.log("------------------------------------------");

  Logger.log("REVIEW STATUS AUDIT COMPLETE");

  Logger.log("==========================================");
}




/**
 * ==========================================================
 * TEST: REVIEW STATUS RECORDS
 * ----------------------------------------------------------
 * Lists every media record currently marked as Reviewed.
 *
 * Used to compare the actual database review state against
 * the reviewer's stored progress position.
 * ==========================================================
 */
function testReviewStatusRecords() {

  Logger.log("==========================================");
  Logger.log("REVIEW STATUS RECORDS TEST");
  Logger.log("==========================================");

  const media =
    getAllMedia();

  let reviewedCount = 0;

  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    const status =
      media[i][COL.REVIEW_STATUS - 1];

    if (status === "Reviewed") {

      reviewedCount++;

      const rowNumber = i + 1;

      const fileName =
        media[i][COL.NAME - 1];

      const reviewDate =
        media[i][COL.REVIEW_DATE - 1];

      const grade =
        media[i][COL.GRADE - 1];

      const bookCandidate =
        media[i][COL.BOOK_CANDIDATE - 1];

      const finalBook =
        media[i][COL.FINAL_BOOK - 1];

      Logger.log("------------------------------------------");

      Logger.log(
        "Row: " +
        rowNumber
      );

      Logger.log(
        "File: " +
        fileName
      );

      Logger.log(
        "Review Date: " +
        reviewDate
      );

      Logger.log(
        "Grade: " +
        grade
      );

      Logger.log(
        "Book Candidate: " +
        bookCandidate
      );

      Logger.log(
        "Final Book: " +
        finalBook
      );

    }

  }

  Logger.log("------------------------------------------");

  Logger.log(
    "Total Reviewed records: " +
    reviewedCount
  );

  Logger.log(
    "Reviewer calculated count: " +
    getReviewCount()
  );

  Logger.log(
    "Current reviewer row: " +
    getLastReviewedRow()
  );

  Logger.log("==========================================");
  Logger.log("REVIEW STATUS RECORDS TEST COMPLETE");
  Logger.log("==========================================");

}

// ==========================================================
// REVIEW COUNTING TEST
// ==========================================================

/**
 * Tests the actual review and book-selection counts.
 *
 * This test is completely read-only.
 *
 * Compares:
 * • Reviewer position count
 * • Actual Review Status records
 * • Book Candidate records
 * • Final Book records
 *
 * Also lists every reviewed image.
 */
function testReviewCounting() {

  Logger.log("==========================================");
  Logger.log("REVIEW COUNTING TEST");
  Logger.log("==========================================");

  // --------------------------------------------------------
  // REVIEWER POSITION
  // --------------------------------------------------------

  const currentRow =
    getLastReviewedRow();

  const reviewerCount =
    getReviewCount();

  Logger.log(
    "Reviewer start row: " +
    REVIEWER.START_ROW
  );

  Logger.log(
    "Current reviewer row: " +
    currentRow
  );

  Logger.log(
    "Reviewer position count: " +
    reviewerCount
  );

  Logger.log("------------------------------------------");

  // --------------------------------------------------------
  // READ MEDIA DATABASE
  // --------------------------------------------------------

  const media =
    getAllMedia();

  let actualReviewed = 0;
  let bookCandidates = 0;
  let finalBookCount = 0;

  const reviewedImages = [];

  // --------------------------------------------------------
  // COUNT DATABASE VALUES
  // --------------------------------------------------------

  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    const record =
      media[i];

    const rowNumber =
      i + 1;

    const fileName =
      record[COL.NAME - 1];

    const reviewStatus =
      record[COL.REVIEW_STATUS - 1];

    const reviewDate =
      record[COL.REVIEW_DATE - 1];

    const grade =
      record[COL.GRADE - 1];

    const bookCandidate =
      record[COL.BOOK_CANDIDATE - 1];

    const finalBook =
      record[COL.FINAL_BOOK - 1];

    // ------------------------------------------------------
    // REVIEWED
    // ------------------------------------------------------

    if (
      reviewStatus === "Reviewed"
    ) {

      actualReviewed++;

      reviewedImages.push({

        row:
          rowNumber,

        fileName:
          fileName,

        reviewDate:
          reviewDate,

        grade:
          grade,

        bookCandidate:
          bookCandidate,

        finalBook:
          finalBook

      });

    }

    // ------------------------------------------------------
    // BOOK CANDIDATE
    // ------------------------------------------------------

    if (
      bookCandidate === true ||
      bookCandidate === "TRUE"
    ) {

      bookCandidates++;

    }

    // ------------------------------------------------------
    // FINAL BOOK
    // ------------------------------------------------------

    if (
      finalBook === true ||
      finalBook === "TRUE"
    ) {

      finalBookCount++;

    }

  }

  // --------------------------------------------------------
  // DATABASE TOTALS
  // --------------------------------------------------------

  Logger.log(
    "Media database records: " +
    (media.length - 1)
  );

  Logger.log(
    "Actual Reviewed records: " +
    actualReviewed
  );

  Logger.log(
    "Actual Book Candidate records: " +
    bookCandidates
  );

  Logger.log(
    "Actual Final Book records: " +
    finalBookCount
  );

  Logger.log("------------------------------------------");

  // --------------------------------------------------------
  // REVIEWED IMAGE DETAILS
  // --------------------------------------------------------

  Logger.log(
    "REVIEWED IMAGE RECORDS"
  );

  Logger.log("------------------------------------------");

  if (
    reviewedImages.length === 0
  ) {

    Logger.log(
      "No reviewed images found."
    );

  } else {

    reviewedImages.forEach(
      function(image) {

        Logger.log(
          "Row: " +
          image.row
        );

        Logger.log(
          "File: " +
          image.fileName
        );

        Logger.log(
          "Review Date: " +
          image.reviewDate
        );

        Logger.log(
          "Grade: " +
          image.grade
        );

        Logger.log(
          "Book Candidate: " +
          image.bookCandidate
        );

        Logger.log(
          "Final Book: " +
          image.finalBook
        );

        Logger.log(
          "------------------------------------------"
        );

      }
    );

  }

  // --------------------------------------------------------
  // REVIEW COUNT COMPARISON
  // --------------------------------------------------------

  Logger.log(
    "REVIEW COUNT COMPARISON"
  );

  Logger.log("------------------------------------------");

  Logger.log(
    "Reviewer position count: " +
    reviewerCount
  );

  Logger.log(
    "Actual reviewed count: " +
    actualReviewed
  );

  Logger.log(
    "Difference: " +
    (reviewerCount - actualReviewed)
  );

  Logger.log("------------------------------------------");

  if (
    reviewerCount === actualReviewed
  ) {

    Logger.log(
      "RESULT: Reviewer count matches actual reviewed records."
    );

  } else {

    Logger.log(
      "RESULT: Reviewer count DOES NOT match actual reviewed records."
    );

  }

  // --------------------------------------------------------
  // BOOK SELECTION TOTALS
  // --------------------------------------------------------

  Logger.log("------------------------------------------");

  Logger.log(
    "Book Candidates: " +
    bookCandidates
  );

  Logger.log(
    "Final Book: " +
    finalBookCount
  );

  Logger.log("==========================================");
  Logger.log("REVIEW COUNTING TEST COMPLETE");
  Logger.log("==========================================");

}