const Case = require("../models/Case.model");
const Task = require("../models/Task.model");
const User = require("../models/User.model");
const Membership = require("../models/Membership.model");

exports.globalSearch = async (userId, orgId, query) => {
  if (!query || query.trim() === "") return { cases: [], tasks: [], clients: [] };

  const searchRegex = new RegExp(query, "i");
  const membership = await Membership.findOne({ userId, organizationId: orgId }).lean();
  if (!membership) return { cases: [], tasks: [], clients: [] };

  const role = membership.role;
  const isPrivileged = role === "ORG_ADMIN" || role === "TEAM_MEMBER"; // Technical council

  // 1. Search Cases
  let caseQuery = {
    organizationId: orgId,
    $or: [{ title: searchRegex }, { caseNumber: searchRegex }, { description: searchRegex }]
  };

  if (!isPrivileged) {
    caseQuery.$and = [
      { $or: [{ assignedMembers: userId }, { clientId: userId }, { createdBy: userId }] }
    ];
  }
  
  const cases = await Case.find(caseQuery)
    .select("title caseNumber status type")
    .limit(10).lean();

  if (role === "CLIENT") {
     // Clients cannot see tasks or other clients by requirement (Optional logic)
     return { cases, tasks: [], clients: [] };
  }

  // 2. Search Tasks
  let taskQuery = {
    organizationId: orgId,
    $or: [{ title: searchRegex }, { description: searchRegex }]
  };

  // If not admin, tasks are restricted to assigned or created
  if (role !== "ORG_ADMIN") {
     taskQuery.$and = [
       { $or: [{ createdBy: userId }, { assignedTo: userId }] }
     ];
  }

  const tasks = await Task.find(taskQuery)
    .select("title status priority")
    .limit(10).lean();

  // 3. Search Clients / Members (User Model via Membership)
  // We search for users in this organization matching the query
  const matchingUsers = await User.find({
    $or: [{ name: searchRegex }, { email: searchRegex }, { contactNumber: searchRegex }]
  }).select("_id name email").lean();

  const userIds = matchingUsers.map(u => u._id);

  const memberships = await Membership.find({
    organizationId: orgId,
    userId: { $in: userIds },
    role: "CLIENT"
  }).populate("userId", "name email").limit(10).lean();

  const clients = memberships.map(m => m.userId);

  return {
    cases,
    tasks,
    clients
  };
};
