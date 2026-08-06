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

const template = HtmlService
    .createTemplateFromFile(
      "DashboardHTML"
    );


template.dashboard =
  getDashboardData();



const html = template
    .evaluate()
    .setTitle(
      DASHBOARD.TITLE
    );


// ==========================================================
// DASHBOARD DATA
// ==========================================================

function getDashboardData() {


  const media =
    getAllMedia();


  const reviewProgress =
    getReviewProgress();



  let candidates = 0;

  let finalImages = 0;



  media.forEach(function(record){


    if(
      record.BookCandidate === true ||
      record.BookCandidate === "TRUE"
    ){

      candidates++;

    }


    if(
      record.FinalBook === true ||
      record.FinalBook === "TRUE"
    ){

      finalImages++;

    }


  });



  return {


    version:
      APP.VERSION,


    imageCount:
      media.length,


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

