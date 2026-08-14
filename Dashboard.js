/**
 * ==========================================================
 * DASHBOARD.GS
 * ----------------------------------------------------------
 * Controls the Enos Media Manager sidebar.
 *
 * Responsibilities
 * ----------------
 * • Open dashboard sidebar
 * • Load dashboard interface
 * • Supply dashboard data
 *
 * Communicates with:
 * • DashboardHTML.html
 * • DashboardStylesHTML.html
 * • Database.gs
 * • Review.gs
 * ==========================================================
 */


// ==========================================================
// DASHBOARD SETTINGS
// ==========================================================

const DASHBOARD = {

  TITLE:
    "Enos Media Manager",

  WIDTH:
    340

};


// ==========================================================
// OPEN DASHBOARD
// ==========================================================

function openDashboard() {

  const template =
    HtmlService
      .createTemplateFromFile(
        "DashboardHTML"
      );

  template.dashboard =
    getDashboardData();

  const html =
    template
      .evaluate()
      .setTitle(
        DASHBOARD.TITLE
      );

  SpreadsheetApp
    .getUi()
    .showSidebar(
      html
    );

}


// ==========================================================
// DASHBOARD DATA
// ==========================================================

/**
 * Builds the data used by the Dashboard.
 *
 * Counts are taken directly from the Media Database
 * using CONFIG.COL as the single source of truth.
 */
function getDashboardData() {

  const media =
    getAllMedia();

  const reviewProgress =
    getReviewProgress();

  let candidates = 0;
  let finalImages = 0;

  // Skip row 1 because getAllMedia()
  // includes the header row.
  for (
    let i = 1;
    i < media.length;
    i++
  ) {

    const record =
      media[i];

    const bookCandidate =
      record[COL.BOOK_CANDIDATE - 1];

    const finalBook =
      record[COL.FINAL_BOOK - 1];

    // ------------------------------------------------------
    // Book Candidate
    // ------------------------------------------------------

    if (
      bookCandidate === true ||
      bookCandidate === "TRUE"
    ) {

      candidates++;

    }

    // ------------------------------------------------------
    // Final Book
    // ------------------------------------------------------

    if (
      finalBook === true ||
      finalBook === "TRUE"
    ) {

      finalImages++;

    }

  }

  return {

    version:
      APP.VERSION,

    imageCount:
      media.length - 1,

    reviewedCount:
      reviewProgress.reviewed,

    candidateCount:
      candidates,

    finalCount:
      finalImages,

    lastReview:
      reviewProgress.lastReview

  };

}


// ==========================================================
// TEST FUNCTIONS
// ==========================================================

/**
 * Tests the Dashboard data pipeline.
 *
 * This test is read-only.
 */
function testDashboardData() {

  Logger.log("==========================================");
  Logger.log("DASHBOARD DATA TEST");
  Logger.log("==========================================");

  const media =
    getAllMedia();

  const mediaCount =
    getMediaCount();

  const dashboard =
    getDashboardData();

  Logger.log(
    "getAllMedia() length: " +
    media.length
  );

  Logger.log(
    "getMediaCount(): " +
    mediaCount
  );

  Logger.log("------------------------------------------");

  Logger.log(
    "Dashboard version: " +
    dashboard.version
  );

  Logger.log(
    "Dashboard image count: " +
    dashboard.imageCount
  );

  Logger.log(
    "Dashboard reviewed count: " +
    dashboard.reviewedCount
  );

  Logger.log(
    "Dashboard candidate count: " +
    dashboard.candidateCount
  );

  Logger.log(
    "Dashboard final count: " +
    dashboard.finalCount
  );

  Logger.log(
    "Dashboard last review: " +
    dashboard.lastReview
  );

  Logger.log("------------------------------------------");

  Logger.log(
    "Actual media records: " +
    mediaCount
  );

  Logger.log(
    "Dashboard image count difference: " +
    (dashboard.imageCount - mediaCount)
  );

  Logger.log("==========================================");
  Logger.log("DASHBOARD DATA TEST COMPLETE");
  Logger.log("==========================================");

}