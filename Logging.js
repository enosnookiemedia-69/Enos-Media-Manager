/**
 * ==========================================================
 * LOGGING.GS
 * ==========================================================
 */

// ==========================================================
// INFORMATION
// ==========================================================

function info(message) {
  Logger.log("INFO: " + message);
}

// ==========================================================
// WARNINGS
// ==========================================================

function warning(message) {
  Logger.log("WARNING: " + message);
}

// ==========================================================
// ERRORS
// ==========================================================

function error(message) {
  Logger.log("ERROR: " + message);
}

// ==========================================================
// DIALOGS
// ==========================================================

function showSuccess(message) {

  SpreadsheetApp.getUi().alert(message);

}

function showError(message) {

  SpreadsheetApp.getUi().alert(
    "Error",
    message,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

}




// ==========================================================
// SYNC LOG SHEET
// ----------------------------------------------------------
// Appends one summary row to the "Sync Log" sheet
// (CONFIG.SHEETS.LOG). Column order matches the sheet's
// existing header row exactly:
//
// Timestamp | Action | Added | Updated | Skipped | Errors |
// Duration (s) | Notes
//
// Used by:
// • Sync.gs — after every Drive sync run
// • recordReviewActivity() below — after every review session
// ==========================================================

function appendSyncLogRow(action, stats, durationSeconds, notes) {

  try {

    const sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(
          CONFIG.SHEETS.LOG
        );

    if (!sheet) {

      Logger.log(
        "Sync Log sheet not found (\"" +
        CONFIG.SHEETS.LOG +
        "\") — skipping log row."
      );

      return;

    }

    sheet.appendRow([

      new Date(),

      action || "",

      stats.added || 0,

      stats.updated || 0,

      stats.skipped || 0,

      stats.errors || 0,

      Number(durationSeconds || 0).toFixed(1),

      notes || ""

    ]);

  }

  catch (error) {

    Logger.log(
      "Could not write to Sync Log: " + error.message
    );

  }

}


// ==========================================================
// REVIEW SESSION TRACKING
// ----------------------------------------------------------
// Reviewing isn't a single event like a Drive sync — it's a
// stream of individual saves over time. Since Apps Script has
// no reliable "dialog closed" hook, a session is inferred from
// activity gaps instead: each save bumps a running per-reviewer
// counter, and a gap of REVIEW_SESSION_GAP_MS or more means the
// previous session has ended, so it gets flushed as one summary
// row before a new session starts.
//
// sessionKey: "FIRST_PASS" or "SECOND_PASS" — tracked
// independently so switching reviewers doesn't corrupt either
// session's stats.
// ==========================================================

const REVIEW_SESSION_GAP_MS = 20 * 60 * 1000; // 20 minutes idle

function recordReviewActivity(sessionKey, actionLabel) {

  try {

    const properties =
      PropertiesService.getUserProperties();

    const lastKey =
      sessionKey + "_SESSION_LAST";

    const countKey =
      sessionKey + "_SESSION_COUNT";

    const startKey =
      sessionKey + "_SESSION_START";

    const now =
      new Date().getTime();

    const lastActivity =
      Number(
        properties.getProperty(lastKey)
      ) || 0;

    const gap =
      lastActivity
        ? now - lastActivity
        : Infinity;

    if (gap > REVIEW_SESSION_GAP_MS) {

      flushReviewSession(
        sessionKey,
        actionLabel,
        properties
      );

      properties.setProperty(startKey, String(now));
      properties.setProperty(countKey, "0");

    }

    const newCount =
      (Number(properties.getProperty(countKey)) || 0) + 1;

    properties.setProperty(countKey, String(newCount));
    properties.setProperty(lastKey, String(now));

  }

  catch (error) {

    Logger.log(
      "Could not record review activity: " + error.message
    );

  }

}


function flushReviewSession(sessionKey, actionLabel, properties) {

  properties =
    properties ||
    PropertiesService.getUserProperties();

  const startKey = sessionKey + "_SESSION_START";
  const countKey = sessionKey + "_SESSION_COUNT";
  const lastKey = sessionKey + "_SESSION_LAST";

  const count =
    Number(properties.getProperty(countKey)) || 0;

  if (count === 0) {
    return;
  }

  const start =
    Number(properties.getProperty(startKey)) || 0;

  const last =
    Number(properties.getProperty(lastKey)) || start;

  const durationSeconds =
    start
      ? (last - start) / 1000
      : 0;

  appendSyncLogRow(

    actionLabel,

    {
      added: count,
      updated: 0,
      skipped: 0,
      errors: 0
    },

    durationSeconds,

    count +
    " image" +
    (count === 1 ? "" : "s") +
    " reviewed this session"

  );

  properties.deleteProperty(startKey);
  properties.deleteProperty(countKey);
  properties.deleteProperty(lastKey);

}


// ==========================================================
// FLUSH STALE SESSIONS ON OPEN
// ----------------------------------------------------------
// Safety net: if the sheet is closed mid-session (browser tab
// closed, laptop shut, etc.) the session would otherwise never
// get logged. Called from onOpen() in Menu.gs — if a pending
// session's last activity is already stale by the time the
// sheet is reopened, flush it immediately.
// ==========================================================

function flushStaleReviewSessions() {

  [
    { key: "FIRST_PASS", label: "First Pass Review" },
    { key: "SECOND_PASS", label: "Second Pass Review" }
  ].forEach(function(session) {

    try {

      const properties =
        PropertiesService.getUserProperties();

      const lastActivity =
        Number(
          properties.getProperty(
            session.key + "_SESSION_LAST"
          )
        ) || 0;

      if (
        lastActivity &&
        (new Date().getTime() - lastActivity) >
          REVIEW_SESSION_GAP_MS
      ) {

        flushReviewSession(
          session.key,
          session.label,
          properties
        );

      }

    }

    catch (error) {

      Logger.log(
        "Could not flush stale review session (" +
        session.key + "): " + error.message
      );

    }

  });

}

