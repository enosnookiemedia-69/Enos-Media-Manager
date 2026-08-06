/**
 * ==========================================================
 * REVIEWUI.GS
 * ----------------------------------------------------------
 * Controls the Image Reviewer interface.
 *
 * Responsibilities:
 * • Open the reviewer dialog
 * • Load ReviewHTML interface
 * • Manage reviewer window settings
 * • Provide development testing tools
 *
 * Communicates with:
 * • Review.gs
 * • ReviewHTML.html
 * • StylesHTML.html
 * ==========================================================
 */


// ==========================================================
// REVIEWER UI SETTINGS
// ==========================================================

const REVIEW_UI = {

  TITLE:
    "Image Reviewer",

  WIDTH:
    1300,

  HEIGHT:
    950

};


// ==========================================================
// OPEN REVIEWER
// ==========================================================

/**
 * Opens the Image Reviewer dialog.
 *
 * Main entry point from the menu.
 */
function openImageReviewer() {

  const html = HtmlService
    .createTemplateFromFile(
      "ReviewHTML"
    )
    .evaluate()
    .setWidth(
      REVIEW_UI.WIDTH
    )
    .setHeight(
      REVIEW_UI.HEIGHT
    );

  SpreadsheetApp
    .getUi()
    .showModalDialog(
      html,
      REVIEW_UI.TITLE
    );

}


// ==========================================================
// HTML INCLUDE SYSTEM
// ==========================================================

/**
 * Includes HTML files inside other HTML files.
 *
 * Used for:
 * • StylesHTML.html
 */
function include(filename) {

  try {

    return HtmlService
      .createHtmlOutputFromFile(
        filename
      )
      .getContent();

  } catch (error) {

    return (
      "<!-- ERROR LOADING " +
      filename +
      ": " +
      error.message +
      " -->"
    );

  }

}


// ==========================================================
// DEVELOPMENT TOOLS
// ==========================================================

/**
 * Opens the reviewer manually while developing.
 *
 * Avoids needing to refresh the spreadsheet menu.
 */
function testOpenImageReviewer() {

  openImageReviewer();

}