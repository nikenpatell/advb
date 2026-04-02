const Case = require("../models/Case.model");
const Hearing = require("../models/Hearing.model");
const Membership = require("../models/Membership.model");
const AppError = require("../utils/AppError");

const getCases = async (userId, orgId) => {
  const membership = await Membership.findOne({ userId, organizationId: orgId });
  if (!membership) throw new AppError("Access Denied: Organization not recognized.", 403);

  let query = { organizationId: orgId };

  // Access Control: Admins and Team Members (Technical Council) see all. Clients see assigned/owned context.
  if (membership.role !== "ORG_ADMIN" && membership.role !== "TEAM_MEMBER") {
    query.$or = [
      { assignedMembers: userId },
      { clientId: userId },
      { createdBy: userId }
    ];
  }

  return await Case.find(query)
    .populate("clientId", "name email contactNumber")
    .populate("assignedMembers", "name email role")
    .sort({ createdAt: -1 });
};

const getCaseById = async (id, userId, orgId) => {
  const membership = await Membership.findOne({ userId, organizationId: orgId });
  if (!membership) throw new AppError("Access Denied: Organization not recognized.", 403);

  const data = await Case.findOne({ _id: id, organizationId: orgId })
    .populate("clientId", "name email contactNumber")
    .populate("assignedMembers", "name email role")
    .populate("history.performedBy", "name");

  if (!data) throw new AppError("Case registry entry not found.", 404);

  // Access Control check
  if (membership.role !== "ORG_ADMIN" && membership.role !== "TEAM_MEMBER") {
    const isAssigned = data.assignedMembers.some(m => m._id.toString() === userId.toString());
    const isClient = data.clientId._id.toString() === userId.toString();
    const isCreator = data.createdBy.toString() === userId.toString();
    if (!isAssigned && !isClient && !isCreator) {
      throw new AppError("Unauthorized: Personnel not assigned to this case.", 403);
    }
  }

  // Get Hearings
  const hearings = await Hearing.find({ caseId: id }).populate("createdBy", "name").sort({ hearingDate: -1 });

  return { ...data.toObject(), hearings };
};

const createCase = async (userId, orgId, data) => {
  return await Case.create({
    ...data,
    organizationId: orgId,
    createdBy: userId,
    history: [{ action: "REGISTRY_INITIALIZED", performedBy: userId, details: "New litigation record registered in workspace." }]
  });
};

const updateCase = async (id, userId, orgId, data) => {
  const existing = await Case.findOne({ _id: id, organizationId: orgId });
  if (!existing) throw new AppError("Target registry entry not identified.", 404);

  // Admin OR Creator can edit
  if (existing.createdBy.toString() !== userId.toString()) {
     const membership = await Membership.findOne({ userId, organizationId: orgId });
     if (membership.role !== "ORG_ADMIN" && membership.role !== "TEAM_MEMBER") {
        throw new AppError("Unauthorized: Identity lacks management privilege.", 403);
     }
  }

  const logs = [];
  if (data.changeNote) {
    logs.push({ action: "REGISTRY_UPDATE", performedBy: userId, details: data.changeNote });
  }

  // Industrial change detection for granular logging
  const trackedFields = ["status", "stage", "title", "caseNumber", "caseType", "courtName", "nextHearingDate"];
  trackedFields.forEach(field => {
    if (data[field] !== undefined && String(data[field]) !== String(existing[field])) {
       logs.push({ 
         action: `${field.toUpperCase()}_MODIFIED`, 
         performedBy: userId, 
         details: `Parameter ${field} transitioned to '${data[field]}'.` 
       });
    }
  });

  // Stakeholder tracking
  if (data.clientId && String(data.clientId) !== String(existing.clientId)) {
    logs.push({ action: "CLIENT_REASSIGNED", performedBy: userId, details: "Primary stakeholder identity transitioned in registry." });
  }
  if (data.assignedMembers && JSON.stringify([...data.assignedMembers].sort()) !== JSON.stringify([...(existing.assignedMembers || [])].map(m => String(m)).sort())) {
    logs.push({ action: "COUNCIL_MODIFIED", performedBy: userId, details: "Industrial technical council assignments updated." });
  }

  const updatePayload = { ...data };
  delete updatePayload.changeNote;

  if (logs.length > 0) {
    return await Case.findByIdAndUpdate(id, { 
      $set: updatePayload,
      $push: { history: { $each: logs } } 
    }, { new: true });
  }

  return await Case.findByIdAndUpdate(id, updatePayload, { new: true });
};

const deleteCase = async (id, userId, orgId) => {
  const existing = await Case.findOne({ _id: id, organizationId: orgId });
  if (!existing) throw new AppError("Target registry entry not identified.", 404);

  // Admin OR Creator can delete
  if (existing.createdBy.toString() !== userId.toString()) {
     const membership = await Membership.findOne({ userId, organizationId: orgId });
     if (membership.role !== "ORG_ADMIN" && membership.role !== "TEAM_MEMBER") {
        throw new AppError("Unauthorized: Identity lacks management privilege.", 403);
     }
  }

  await Case.findByIdAndDelete(id);
  await Hearing.deleteMany({ caseId: id });
  return true;
};

const addHearing = async (caseId, userId, orgId, data) => {
  const target = await Case.findOne({ _id: caseId, organizationId: orgId });
  if (!target) throw new AppError("Case context not identified.", 404);

  const hearing = await Hearing.create({
    ...data,
    caseId,
    organizationId: orgId,
    createdBy: userId
  });

  // Update nextHearingDate if this date is in the future
  const now = new Date();
  if (new Date(data.hearingDate) > now) {
      await Case.findByIdAndUpdate(caseId, { nextHearingDate: data.hearingDate });
  }

  return hearing;
};

module.exports = {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  addHearing
};
