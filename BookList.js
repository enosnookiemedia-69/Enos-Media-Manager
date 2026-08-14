/**
 * ==========================================================
 * BOOKLIST.GS
 * ----------------------------------------------------------
 * Manages the Final Book Possibilities workflow.
 *
 * Responsibilities
 * ----------------
 * • Synchronise Book Candidates into Final Book Possibilities
 * • Calculate editorial scores
 * • Carry important image metadata into the book list
 * • Preserve manual editorial fields
 * • Validate book candidate records
 *
 * Communicates with:
 * • Database.gs
 * • MediaObject.gs
 * • SelectionEngine.gs
 * • Config.gs
 *
 * Workflow
 * --------
 * Media Database
 *       ↓
 * Book Candidate
 *       ↓
 * Final Book Possibilities
 *       ↓
 * Second-pass editorial selection
 *       ↓
 * Book Final Layout
 *
 * ==========================================================
 */


// ==========================================================
// BOOK LIST SETTINGS
// ==========================================================

const BOOKLIST = {

  /**
   * First data row in the worksheet.
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
 * Synchronises Book Candidate images from
 * the Media Database into Final Book Possibilities.
 *
 * Existing records are updated while manual
 * editorial fields are preserved.
 */
function syncBookList() {

  info(
    "Synchronising Final Book Possibilities..."
  );


  const media =
    getAllMedia();


  const bookSheet =
    getBookSheet();


  let added = 0;
  let updated = 0;


  media.forEach(function(mediaRecord) {


    // ------------------------------------------------------
    // Only include Book Candidates
    // ------------------------------------------------------

    if (!isBookCandidate(mediaRecord)) {

      return;

    }


    // ------------------------------------------------------
    // Existing record?
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

  });


  info(
    "Final Book Possibilities Updated"
  );


  info(
    "Added : " + added
  );


  info(
    "Updated : " + updated
  );


  return {

    added: added,

    updated: updated

  };

}


// ==========================================================
// BOOK CANDIDATE CHECK
// ==========================================================

/**
 * Determines whether a Media Object
 * is marked as a Book Candidate.
 *
 * Handles both boolean and spreadsheet
 * string values.
 */
function isBookCandidate(media) {

  return (
    media.bookCandidate === true ||
    media.bookCandidate === "TRUE"
  );

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


  sheet
    .appendRow(row);

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
function updateBookRecord(rowNumber, media) {

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
 * Manual fields are preserved when an existing
 * row is supplied.
 */
function buildBookRow(media, existingRow) {

  existingRow =
    existingRow || [];


  const score =
    calculateSelectionScore(
      mediaObjectToSelectionRecord(media)
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

    media.hero || false,


    // ------------------------------------------------------
    // Selection Engine
    // ------------------------------------------------------

    score,

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
      BOOKLIST.COLUMNS.STATUS,
      "Shortlisted"
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


  record[COL.BOOK_CANDIDATE - 1] =
    media.bookCandidate === true;


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
 */
function calculateAspectRatio(width, height) {

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
 */
function preserveValue(
  row,
  column,
  defaultValue
) {

  if (
    row &&
    row.length >= column &&
    row[column - 1] !== ""
  ) {

    return row[column - 1];

  }


  return defaultValue || "";

}


// ==========================================================
// BOOK LIST VALIDATION
// ==========================================================

/**
 * Finds Book List records that are missing
 * important editorial information.
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


  return records.filter(function(row) {

    return (
      !row[BOOKLIST.COLUMNS.FILE_ID - 1] ||
      !row[BOOKLIST.COLUMNS.GRADE - 1] ||
      !row[BOOKLIST.COLUMNS.STORY_VALUE - 1]
    );

  });

}


// ==========================================================
// BOOK LIST STATISTICS
// ==========================================================

/**
 * Returns basic statistics for
 * Final Book Possibilities.
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

      finalSelection: 0

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


  records.forEach(function(row) {

    const status =
      row[BOOKLIST.COLUMNS.STATUS - 1];


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

  });


  return {

    total:
      records.length,

    shortlisted:
      shortlisted,

    finalSelection:
      finalSelection

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


/**
 * Tests the aspect ratio calculation.
 */
function testBookAspectRatio() {

  Logger.log(
    calculateAspectRatio(
      4032,
      3024
    )
  );

}


/**
 * Tests the Selection Engine connection.
 */
function testBookSelectionScore() {

  const media =
    getAllMedia();


  if (
    !media.length
  ) {

    Logger.log(
      "No media records found."
    );

    return;

  }


  const candidate =
    media.find(
      isBookCandidate
    );


  if (!candidate) {

    Logger.log(
      "No Book Candidate found."
    );

    return;

  }


  const record =
    mediaObjectToSelectionRecord(
      candidate
    );


  Logger.log(
    "File: " +
    candidate.name
  );


  Logger.log(
    "Editorial Score: " +
    calculateSelectionScore(record)
  );

}