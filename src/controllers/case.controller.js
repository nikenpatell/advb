const caseService = require("../services/case.service");
const asyncHandler = require("../utils/asyncHandler");

exports.getCases = asyncHandler(async (req, res) => {
  const data = await caseService.getCases(req.user.id, req.user.orgId);
  res.json({ success: true, message: "Workspace cases synchronized.", data });
});

exports.getCaseById = asyncHandler(async (req, res) => {
  const data = await caseService.getCaseById(req.params.id, req.user.id, req.user.orgId);
  res.json({ success: true, message: "Case portfolio loaded.", data });
});

exports.createCase = asyncHandler(async (req, res) => {
  const data = await caseService.createCase(req.user.id, req.user.orgId, req.body);
  res.status(201).json({ success: true, message: "New case profile registered and assigned.", data });
});

exports.updateCase = asyncHandler(async (req, res) => {
  const data = await caseService.updateCase(req.params.id, req.user.id, req.user.orgId, req.body);
  res.json({ success: true, message: "Case parameters modified.", data });
});

exports.deleteCase = asyncHandler(async (req, res) => {
  await caseService.deleteCase(req.params.id, req.user.id, req.user.orgId);
  res.json({ success: true, message: "Case profile dissolved and removed from registry." });
});

exports.addHearing = asyncHandler(async (req, res) => {
  const data = await caseService.addHearing(req.params.caseId, req.user.id, req.user.orgId, req.body);
  res.status(201).json({ success: true, message: "New hearing event scheduled and logged.", data });
});

exports.addComment = asyncHandler(async (req, res) => {
  const data = await caseService.addComment(req.params.id, req.user.id, req.user.orgId, req.body.text);
  res.status(201).json({ success: true, message: "Comment added to registry.", data });
});
