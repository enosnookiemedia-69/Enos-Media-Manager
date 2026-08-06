/**
 * ==========================================================
 * BOOKLIST.GS
 * ----------------------------------------------------------
 * Manages the Book Workflow.
 *
 * Responsibilities
 * ----------------
 * • Sync Book Candidates
 * • Manage Final Book selections
 * • Update Book List worksheet
 * • Export book data
 * • Book validation
 *
 * Communicates with:
 * • Database.gs
 * • MediaObject.gs
 * • Config.gs
 * ==========================================================
 */



// ==========================================================
// BOOK WORKFLOW
// ==========================================================

/**
 * Book workflow stages.
 *
 * Candidate
 * → Selected for consideration.
 *
 * Final Book
 * → Confirmed for publication.
 */



// ==========================================================
// BOOK SHEET
// ==========================================================

/**
 * Cached Book worksheet.
 */
let BOOK_SHEET = null;


/**
 * Returns the Book worksheet.
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

  return BOOK_SHEET;

}


// ==========================================================
// BOOK LIST SYNCHRONISATION
// ==========================================================

/**
 * Synchronises the Book List with
 * the Media Database.
 *
 * Only images marked as
 * Book Candidate = TRUE
 * are included.
 */
function syncBookList() {

  info(
    "Synchronising Book List..."
  );

  const media =
    getAllMedia();

  let added = 0;

  let updated = 0;

  media.forEach(function(item) {

    // ------------------------------------------
    // Ignore non-candidates
    // ------------------------------------------

    if (!item.bookCandidate) {

      return;

    }

    // ------------------------------------------
    // Existing record?
    // ------------------------------------------

    if (bookExists(item.id)) {

      updateBookRecord(item);

      updated++;

    }

    else {

      addBookRecord(item);

      added++;

    }

  });

  info(
    "Book List Updated"
  );

  info(
    "Added : " + added
  );

  info(
    "Updated : " + updated
  );

}

