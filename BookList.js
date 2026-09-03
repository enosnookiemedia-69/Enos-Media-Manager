/**
 * ==========================================================
 * BOOKLIST.GS
 * ----------------------------------------------------------
 * Manages the Final Book Possibilities workflow.
 *
 * Responsibilities
 * ----------------
 * • Synchronise Media Database images into Final Book
 *   Possibilities
 * • Calculate editorial scores
 * • Carry important image metadata into the book list
 * • Preserve manual editorial fields
 * • Provide book-list statistics
 *
 * IMPORTANT
 * ----------------------------------------------------------
 * There is NO "Book Candidate" filter.
 *
 * Every image in the Media Database is considered a possible
 * book image.
 *
 * Hero Image and Final Book remain important editorial flags.
 *
 * Workflow
 * --------
 * Media Database
 *       ↓
 * Final Book Possibilities
 *       ↓
 * Editorial selection
 *       ↓
 * Book Final Layout
 *
 * Communicates with:
 * • Database.gs
 * • MediaObject.gs
 * • SelectionEngine.gs
 * • Config.gs
 *
 * ==========================================================
 */


// ==========================================================
// BOOK LIST SETTINGS
// ==========================================================

const BOOKLIST = {

  /**
   * First data row in the worksheet.
   *
   * Row 1 contains headers.
   */
  START_ROW: 2,


  /**
   * Final Book Possibilities columns.
   *
   * These match the worksheet structure exactly.
   */
  COLUMNS: {

    THUMBNAIL: 1,
    FILE_ID: 2,
    FILE_NAME: 3,
    YEAR: 4,
    PHOTOGRAPHER: 5,
    CATEGORY: 6,
    GRADE: 7,
    STORY_VALUE: 8,
    HERO: 9,
    EDITORIAL_SCORE: 10,
    LAYOUT_SUITABILITY: 11,
    PRINT_SUITABILITY: 12,
    ASPECT_RATIO: 13,
    ORIENTATION: 14,
    CAPTION: 15,
    SPREAD: 16,
    PAGE: 17,
    STATUS: 18,
    NOTES: 19

  }

};


// ==========================================================
// BOOK SHEET CACHE
// ==========================================================

let BOOK_SHEET = null;


// ==========================================================
// BOOK SHEET ACCESS
// ==========================================================

/**
 * Returns the Final Book Possibilities worksheet.
 *
 * @returns {Sheet}
 */
function getBookSheet() {

  if (!BOOK_SHEET) {

    BOOK_SHEET =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(
          CONFIG.SHEETS.BOOK
        );

  }


  if (!BOOK_SHEET) {

    throw new Error(
      "Final Book Possibilities sheet not found."
    );

  }


  return BOOK_SHEET;

}


// ==========================================================
// BOOK LIST SYNCHRONISATION
// ==========================================================

/**
 * Synchronises ALL images from the Media Database
 * into Final Book Possibilities.
 *
 * There is deliberately no Book Candidate filter.
 *
 * Every image is considered a possible book image.
 *
 * Existing records are updated while manual editorial
 * fields are preserved.
 */
function syncBookList() {

  info(
    "Synchronising Final Book Possibilities..."
  );


  const media =
    getAllMedia();


  getBookSheet();


  let added = 0;

  let updated = 0;


  // --------------------------------------------------------
  // Skip row 0 — headers.
  // --------------------------------------------------------

  for (
    let i = 1;
    i < media.length;
    i++
  ) {


    // ------------------------------------------------------
    // Convert spreadsheet row into Media Object.
    // ------------------------------------------------------

    const mediaRecord =
      rowToMediaObject(
        media[i]
      );


    // ------------------------------------------------------
    // Ignore rows without a File ID.
    //
    // This prevents blank/incomplete spreadsheet rows
    // from being added to the book list.
    // ------------------------------------------------------

    if (!mediaRecord.id) {

      continue;

    }


    // ------------------------------------------------------
    // Look for an existing book record.
    // ------------------------------------------------------

    const existingRow =
      findBookRecordRow(
        mediaRecord.id
      );


    if (existingRow) {

      updateBookRecord(
        existingRow,
        mediaRecord
      );

      updated++;

    }

    else {

      addBookRecord(
        mediaRecord
      );

      added++;

    }

  }


  info(
    "Final Book Possibilities Updated"
  );


  info(
    "Added : " +
    added
  );


  info(
    "Updated : " +
    updated
  );

}


// ==========================================================
// SYNC SINGLE RECORD TO BOOK LIST
// ----------------------------------------------------------
// Used by the Reviewer to immediately sync one image into
// Final Book Image Possibilities the moment it is marked
// Hero Image or Final Book, without scanning the entire
// Media Database.
//
// Status is stamped "Pushed" only when the row is new or
// the Status cell is still blank — this records that the
// image was auto-pushed by a Hero/Final Book selection,
// while never overwriting a Status you've already set
// manually (e.g. Shortlisted, Final Selection).
// ==========================================================

function syncSingleMediaRecordToBookList(rawRow, statusLabel) {

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
    findBookRecordRow(
      mediaRecord.id
    );


  if (existingRow) {

    updateBookRecord(
      existingRow,
      mediaRecord
    );


    stampStatusIfBlank(
      existingRow,
      statusLabel
    );

  }

  else {

    addBookRecord(
      mediaRecord
    );


    const newRow =
      findBookRecordRow(
        mediaRecord.id
      );


    stampStatusIfBlank(
      newRow,
      statusLabel
    );

  }

}


// ==========================================================
// STAMP STATUS
// ----------------------------------------------------------
// Only writes the given label when the Status cell is
// currently blank, so manual editorial Status values are
// never overwritten.
// ==========================================================

function stampStatusIfBlank(rowNumber, statusLabel) {

  if (!rowNumber) {

    return;

  }


  const sheet =
    getBookSheet();


  const statusCell =
    sheet.getRange(
      rowNumber,
      BOOKLIST.COLUMNS.STATUS
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
// FIND BOOK RECORD
// ==========================================================

/**
 * Finds a Book List row using File ID.
 *
 * @param {String} fileId
 * @returns {Number|null}
 */
function findBookRecordRow(fileId) {

  const sheet =
    getBookSheet();


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow <
    BOOKLIST.START_ROW
  ) {

    return null;

  }


  const fileIds =
    sheet
      .getRange(
        BOOKLIST.START_ROW,
        BOOKLIST.COLUMNS.FILE_ID,
        lastRow - BOOKLIST.START_ROW + 1,
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
        BOOKLIST.START_ROW + i
      );

    }

  }


  return null;

}


// ==========================================================
// BOOK RECORD CREATION
// ==========================================================

/**
 * Adds a new Media Object to
 * Final Book Possibilities.
 */
function addBookRecord(media) {

  const sheet =
    getBookSheet();


  const row =
    buildBookRow(media);


  sheet.appendRow(row);

}


// ==========================================================
// BOOK RECORD UPDATE
// ==========================================================

/**
 * Updates an existing Book List record.
 *
 * Automatically calculated and metadata fields
 * are refreshed.
 *
 * Manual editorial fields are preserved.
 */
function updateBookRecord(
  rowNumber,
  media
) {

  const sheet =
    getBookSheet();


  const currentRow =
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        BOOKLIST.COLUMNS.NOTES
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
      BOOKLIST.COLUMNS.NOTES
    )
    .setValues([
      updatedRow
    ]);

}


// ==========================================================
// BUILD BOOK ROW
// ==========================================================

/**
 * Builds a worksheet row from a Media Object.
 *
 * Automatically updated fields:
 * • Thumbnail
 * • File ID
 * • File Name
 * • Year
 * • Photographer
 * • Category
 * • Grade
 * • Story Value
 * • Hero
 * • Editorial Score
 * • Layout Suitability
 * • Print Suitability
 * • Aspect Ratio
 * • Orientation
 *
 * Manual fields preserved:
 * • Caption
 * • Spread
 * • Page
 * • Status
 * • Notes
 */
function buildBookRow(
  media,
  existingRow
) {

  existingRow =
    existingRow || [];


  // --------------------------------------------------------
  // Calculate editorial score.
  // --------------------------------------------------------

  const score =
    calculateSelectionScore(
      mediaObjectToSelectionRecord(
        media
      )
    );


  return [

    // ------------------------------------------------------
    // Metadata
    // ------------------------------------------------------

    media.thumbnail || "",

    media.id || "",

    media.name || "",

    media.year || "",

    media.photographer || "",

    media.category || "",

    media.grade || "",

    media.storyValue || "",

    media.hero === true,


    // ------------------------------------------------------
    // Editorial Score
    // ------------------------------------------------------

    score,


    // ------------------------------------------------------
    // Suitability
    // ------------------------------------------------------

    media.layoutSuitability || "",

    media.printSuitability || "",


    // ------------------------------------------------------
    // Image Format
    // ------------------------------------------------------

    calculateAspectRatio(
      media.width,
      media.height
    ),

    media.orientation || "",


    // ------------------------------------------------------
    // Manual Editorial Fields
    // ------------------------------------------------------

    preserveValue(
      existingRow,
      BOOKLIST.COLUMNS.CAPTION
    ),

    preserveValue(
      existingRow,
      BOOKLIST.COLUMNS.SPREAD
    ),

    preserveValue(
      existingRow,
      BOOKLIST.COLUMNS.PAGE
    ),

    preserveValue(
      existingRow,
      BOOKLIST.COLUMNS.STATUS
    ),

    preserveValue(
      existingRow,
      BOOKLIST.COLUMNS.NOTES
    )

  ];

}


// ==========================================================
// SELECTION ENGINE CONNECTION
// ==========================================================

/**
 * Converts a Media Object into the array structure
 * expected by SelectionEngine.gs.
 *
 * SelectionEngine currently works from spreadsheet
 * column positions rather than Media Object properties.
 *
 * Book Candidate is intentionally NOT included.
 *
 * The Selection Engine considers the actual editorial
 * qualities of the image instead.
 */
function mediaObjectToSelectionRecord(media) {

  const record = [];


  record[COL.GRADE - 1] =
    media.grade || "";


  record[COL.STORY_VALUE - 1] =
    media.storyValue || "";


  record[COL.PRINT_SUITABILITY - 1] =
    media.printSuitability || "";


  record[COL.LAYOUT_SUITABILITY - 1] =
    media.layoutSuitability || "";


  record[COL.HERO_IMAGE - 1] =
    media.hero === true;


  return record;

}


// ==========================================================
// ASPECT RATIO
// ==========================================================

/**
 * Calculates an image aspect ratio.
 *
 * Example:
 * 4032 × 3024 → 1.333
 *
 * Returns an empty string when dimensions
 * are unavailable.
 *
 * @param {Number} width
 * @param {Number} height
 * @returns {Number|String}
 */
function calculateAspectRatio(
  width,
  height
) {

  const w =
    Number(width);


  const h =
    Number(height);


  if (
    !w ||
    !h
  ) {

    return "";

  }


  return Number(
    (w / h).toFixed(3)
  );

}


// ==========================================================
// PRESERVE MANUAL VALUE
// ==========================================================

/**
 * Returns an existing manual value when available.
 *
 * Used so synchronisation does not overwrite
 * editorial work.
 *
 * @param {Array} row
 * @param {Number} column
 * @returns {*}
 */
function preserveValue(
  row,
  column
) {

  if (
    row &&
    row.length >= column &&
    row[column - 1] !== ""
  ) {

    return row[column - 1];

  }


  return "";

}


// ==========================================================
// BOOK LIST VALIDATION
// ==========================================================

/**
 * Finds Book List records that are missing
 * their File ID.
 *
 * Grade and Story Value are NOT considered mandatory.
 *
 * An image can legitimately exist in the Final Book
 * Possibilities list before it has been reviewed.
 *
 * @returns {Array}
 */
function findIncompleteBookRecords() {

  const sheet =
    getBookSheet();


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow <
    BOOKLIST.START_ROW
  ) {

    return [];

  }


  const records =
    sheet
      .getRange(
        BOOKLIST.START_ROW,
        1,
        lastRow - BOOKLIST.START_ROW + 1,
        BOOKLIST.COLUMNS.NOTES
      )
      .getValues();


  return records.filter(
    function(row) {

      return (
        !row[
          BOOKLIST.COLUMNS.FILE_ID - 1
        ]
      );

    }
  );

}


// ==========================================================
// BOOK LIST STATISTICS
// ==========================================================

/**
 * Returns basic statistics for
 * Final Book Possibilities.
 *
 * Status values are counted only if they
 * actually exist in the worksheet.
 */
function getBookListStatistics() {

  const sheet =
    getBookSheet();


  const lastRow =
    sheet.getLastRow();


  if (
    lastRow <
    BOOKLIST.START_ROW
  ) {

    return {

      total: 0,

      shortlisted: 0,

      finalSelection: 0,

      heroImages: 0

    };

  }


  const records =
    sheet
      .getRange(
        BOOKLIST.START_ROW,
        1,
        lastRow - BOOKLIST.START_ROW + 1,
        BOOKLIST.COLUMNS.NOTES
      )
      .getValues();


  let shortlisted = 0;

  let finalSelection = 0;

  let heroImages = 0;


  records.forEach(
    function(row) {

      const status =
        row[
          BOOKLIST.COLUMNS.STATUS - 1
        ];


      const hero =
        row[
          BOOKLIST.COLUMNS.HERO - 1
        ];


      // ----------------------------------------------------
      // Status
      // ----------------------------------------------------

      if (
        status === "Shortlisted"
      ) {

        shortlisted++;

      }


      if (
        status === "Final Selection"
      ) {

        finalSelection++;

      }


      // ----------------------------------------------------
      // Hero
      // ----------------------------------------------------

      if (
        hero === true ||
        hero === "TRUE"
      ) {

        heroImages++;

      }

    }
  );


  return {

    total:
      records.length,

    shortlisted:
      shortlisted,

    finalSelection:
      finalSelection,

    heroImages:
      heroImages

  };

}

// ==========================================================
// DEVELOPMENT TESTS
// ==========================================================

/**
 * Tests access to the Book List worksheet.
 */
function testBookSheet() {

  const sheet =
    getBookSheet();


  Logger.log(
    "Book Sheet: " +
    sheet.getName()
  );

}


// ==========================================================
// ASPECT RATIO TEST
// ==========================================================

/**
 * Tests the aspect ratio calculation.
 */
function testBookAspectRatio() {

  const result =
    calculateAspectRatio(
      4032,
      3024
    );


  Logger.log(
    "4032 × 3024 aspect ratio: " +
    result
  );

}


// ==========================================================
// BOOK LIST SYNC TEST
// ==========================================================

/**
 * Read-only test that counts Media Database records
 * that are eligible to be synchronised.
 *
 * Since there is no Book Candidate filter anymore,
 * every valid media record is eligible.
 *
 * This test does NOT modify the spreadsheet.
 */
function testBookListSourceRecords() {

  info("==========================================");

  info(
    "BOOK LIST SOURCE RECORD TEST"
  );

  info("==========================================");


  const media =
    getAllMedia();


  let validRecords = 0;

  let missingFileId = 0;


  // --------------------------------------------------------
  // Skip row 0 — headers.
  // --------------------------------------------------------

  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    const mediaRecord =
      rowToMediaObject(
        media[i]
      );


    if (
      mediaRecord.id
    ) {

      validRecords++;

    }

    else {

      missingFileId++;

    }

  }


  info("------------------------------------------");


  info(
    "Media Database records: " +
    (media.length - 1)
  );


  info(
    "Valid records available for Book List: " +
    validRecords
  );


  info(
    "Records missing File ID: " +
    missingFileId
  );


  info("------------------------------------------");


  info(
    "RESULT: All valid Media Database images " +
    "are treated as possible book images."
  );


  info("==========================================");

  info(
    "BOOK LIST SOURCE RECORD TEST COMPLETE"
  );

  info("==========================================");

}


// ==========================================================
// SELECTION SCORE TEST
// ==========================================================

/**
 * Tests the Selection Engine connection.
 *
 * Uses the first valid media record.
 *
 * This test is completely read-only.
 */
function testBookSelectionScore() {

  const media =
    getAllMedia();


  if (
    media.length <= 1
  ) {

    Logger.log(
      "No media records found."
    );

    return;

  }


  let testRecord = null;


  // --------------------------------------------------------
  // Find first valid media record.
  // --------------------------------------------------------

  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    const mediaRecord =
      rowToMediaObject(
        media[i]
      );


    if (
      mediaRecord.id
    ) {

      testRecord =
        mediaRecord;

      break;

    }

  }


  if (!testRecord) {

    Logger.log(
      "No valid media record found."
    );

    return;

  }


  const record =
    mediaObjectToSelectionRecord(
      testRecord
    );


  const score =
    calculateSelectionScore(
      record
    );


  Logger.log(
    "File: " +
    testRecord.name
  );


  Logger.log(
    "Editorial Score: " +
    score
  );

}


// ==========================================================
// BOOK LIST STATISTICS TEST
// ==========================================================

/**
 * Tests the Book List statistics.
 *
 * This test is completely read-only.
 */
function testBookListStatistics() {

  Logger.log("==========================================");

  Logger.log(
    "BOOK LIST STATISTICS TEST"
  );

  Logger.log("==========================================");


  const statistics =
    getBookListStatistics();


  Logger.log(
    "Total: " +
    statistics.total
  );


  Logger.log(
    "Shortlisted: " +
    statistics.shortlisted
  );


  Logger.log(
    "Final Selection: " +
    statistics.finalSelection
  );


  Logger.log(
    "Hero Images: " +
    statistics.heroImages
  );


  Logger.log(
    "Final Book: " +
    statistics.finalBook
  );


  Logger.log("==========================================");

  Logger.log(
    "BOOK LIST STATISTICS TEST COMPLETE"
  );

  Logger.log("==========================================");

}