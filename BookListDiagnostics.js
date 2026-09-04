// ==========================================================
// DIAGNOSTIC: BOOK LIST SYNC HEALTH
// ----------------------------------------------------------
// Scans the ENTIRE Media Database (not a partial/truncated
// view) and answers two questions directly:
//
// 1. How many reviewed images actually have Hero Image
//    and/or Final Book checked right now?
//
// 2. Of those, how many are ACTUALLY present in Final Book
//    Image Possibilities — and which ones are missing?
//
// Also reports every Status value currently found in Final
// Book Image Possibilities, so any unexpected/legacy values
// (e.g. leftover "Shortlisted" entries) are visible.
//
// Entirely read-only. Makes no changes.
// ==========================================================

function diagnoseBookListSyncHealth() {

  Logger.log("==========================================");
  Logger.log("BOOK LIST SYNC HEALTH DIAGNOSTIC");
  Logger.log("==========================================");


  const media =
    getAllMedia();

  let heroCount = 0;
  let finalBookCount = 0;
  let taggedTestCount = 0;

  const shouldBePushed = [];


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

    const isTagged =
      matchesTestTag(record);

    if (isTagged) {
      taggedTestCount++;
    }

    if (record.hero === true) {
      heroCount++;
    }

    if (record.finalBook === true) {
      finalBookCount++;
    }

    if (
      record.hero === true ||
      record.finalBook === true
    ) {

      shouldBePushed.push({
        id: record.id,
        name: record.name,
        hero: record.hero === true,
        finalBook: record.finalBook === true,
        taggedTest: isTagged
      });

    }

  }


  Logger.log(
    "Total Media Database rows: " +
    (media.length - 1)
  );

  Logger.log(
    "Rows with Hero Image = TRUE: " +
    heroCount
  );

  Logger.log(
    "Rows with Final Book = TRUE: " +
    finalBookCount
  );

  Logger.log(
    "Rows with \"test\" in Caption/Notes: " +
    taggedTestCount
  );

  Logger.log(
    "Rows that SHOULD be in Book List " +
    "(Hero or Final Book checked): " +
    shouldBePushed.length
  );

  Logger.log("------------------------------------------");


  // --------------------------------------------------------
  // Cross-check against actual Book List rows
  // --------------------------------------------------------

  const bookFileIds =
    getBookListFileIdSet();

  const missing =
    shouldBePushed.filter(function(item) {

      return !bookFileIds[item.id];

    });


  Logger.log(
    "Currently present in Book List: " +
    Object.keys(bookFileIds).length
  );

  Logger.log(
    "MISSING from Book List (should be there, aren't): " +
    missing.length
  );

  missing.forEach(function(item) {

    Logger.log(
      "  MISSING -> " + item.name +
      " (Hero: " + item.hero +
      ", Final Book: " + item.finalBook +
      ", tagged test: " + item.taggedTest + ")"
    );

  });

  Logger.log("------------------------------------------");


  // --------------------------------------------------------
  // Status value breakdown in Book List
  // --------------------------------------------------------

  const sheet =
    getBookSheet();

  const lastRow =
    sheet.getLastRow();

  const statusCounts = {};

  if (
    lastRow >= BOOKLIST.START_ROW
  ) {

    const statuses =
      sheet
        .getRange(
          BOOKLIST.START_ROW,
          BOOKLIST.COLUMNS.STATUS,
          lastRow - BOOKLIST.START_ROW + 1,
          1
        )
        .getValues();

    statuses.forEach(function(row) {

      const status =
        row[0] || "(blank)";

      statusCounts[status] =
        (statusCounts[status] || 0) + 1;

    });

  }

  Logger.log(
    "Book List Status value breakdown:"
  );

  Object.keys(statusCounts).forEach(function(status) {

    Logger.log(
      "  " + status + ": " + statusCounts[status]
    );

  });


  Logger.log("==========================================");
  Logger.log("DIAGNOSTIC COMPLETE");
  Logger.log("==========================================");

  return {

    heroCount: heroCount,
    finalBookCount: finalBookCount,
    taggedTestCount: taggedTestCount,
    shouldBePushedCount: shouldBePushed.length,
    currentlyInBookList: Object.keys(bookFileIds).length,
    missingCount: missing.length,
    statusCounts: statusCounts

  };

}