// ==========================================================
// QUOTA CHECK (read-only)
// ----------------------------------------------------------
// Logs category quotas and total images needed. Writes nothing.
// ==========================================================

function runQuotaCheck() {

  const result =
    calculateCategoryQuotas();

  Logger.log(
    "Total images needed: " +
    result.totalNeeded
  );

  Object.keys(result.categories).forEach(function(category) {

    const quota =
      result.categories[category];

    Logger.log(
      category +
      " — needed: " + quota.needed +
      " | target (x2): " + quota.target
    );

  });

}