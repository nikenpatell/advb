const searchService = require("../services/search.service");
const asyncHandler = require("../utils/asyncHandler");

exports.globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const orgId = req.headers["x-org-id"];
  
  if (!orgId) throw new Error("Organization Context Missing");

  const data = await searchService.globalSearch(req.user.id, orgId, q);

  res.json({
    success: true,
    data
  });
});
