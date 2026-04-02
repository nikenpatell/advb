const Hearing = require("../models/Hearing.model");
const Task = require("../models/Task.model");
const Membership = require("../models/Membership.model");
const Case = require("../models/Case.model");

const getCalendarEvents = async (userId, orgId) => {
  const membership = await Membership.findOne({ userId, organizationId: orgId });
  if (!membership) throw new Error("Access Denied: Workspace context not found.");

  let hearingQuery = { organizationId: orgId };
  let taskQuery = { organizationId: orgId };

  // Roles: Admin and Team Member (Technical Council) see all.
  // Clients only see their own context.
  if (membership.role === "CLIENT") {
     // Clients see their cases' hearings
     const clientCases = await Case.find({ clientId: userId }).distinct("_id");
     hearingQuery.caseId = { $in: clientCases };
     
     // Clients see tasks assigned to them (if any) or created by them (unlikely for now)
     taskQuery.$or = [
       { assignedTo: userId },
       { createdBy: userId }
     ];
  }

  let caseQuery = { organizationId: orgId, nextHearingDate: { $exists: true, $ne: null } };
  if (membership.role === "CLIENT") {
     caseQuery.clientId = userId;
  }

  const [hearings, tasks, registryCases] = await Promise.all([
    Hearing.find(hearingQuery).populate("caseId", "title caseNumber"),
    Task.find(taskQuery).populate("assignedTo", "name"),
    Case.find(caseQuery)
  ]);

  const hearingEvents = hearings.map(h => ({
    id: h.caseId?._id || h._id,
    title: `Hearing: ${h.caseId?.title || "Unknown Case"}`,
    date: h.hearingDate,
    type: "HEARING",
    details: h.notes,
    caseNumber: h.caseId?.caseNumber
  }));

  const caseEvents = registryCases.map(c => ({
    id: c._id,
    title: `Registry Reminder: ${c.title}`,
    date: c.nextHearingDate,
    type: "HEARING",
    details: `Official Industrial Registry reminder for Case #${c.caseNumber} next hearing event.`,
    caseNumber: c.caseNumber
  }));

  const taskEvents = tasks.map(t => ({
    id: t._id,
    title: `Task: ${t.title}`,
    date: t.dueDate,
    type: "TASK",
    details: t.description,
    status: t.status,
    priority: t.priority
  }));

  return [...hearingEvents, ...caseEvents, ...taskEvents].filter(e => e.date);
};

module.exports = {
  getCalendarEvents
};
