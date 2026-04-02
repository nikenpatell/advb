const Task = require("../models/Task.model");
const AppError = require("../utils/AppError");

exports.getTasks = async (userId, orgId) => {
  // Access Policy: You see tasks you created OR tasks assigned to you within the workspace.
  // Org Admins see all tasks in the org (optional, usually preferred for transparency).
  // But strictly per user:
  return await Task.find({
    organizationId: orgId,
    $or: [{ createdBy: userId }, { assignedTo: userId }],
  })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 })
    .lean();
};

exports.getOrgAuditTasks = async (orgId) => {
  // Visibility for Admins (if we implement a global view)
  return await Task.find({ organizationId: orgId })
    .populate("createdBy", "name email")
    .populate("assignedTo", "name email")
    .sort({ createdAt: -1 })
    .lean();
};

exports.createTask = async (userId, orgId, data) => {
  return await Task.create({
    ...data,
    createdBy: userId,
    organizationId: orgId,
    history: [{ action: "CREATED", performedBy: userId, details: "Project initiative initialized." }],
  });
};

exports.updateTask = async (taskId, userId, orgId, data) => {
  const task = await Task.findOne({ _id: taskId, organizationId: orgId });
  if (!task) throw new AppError("Target task dissolved or inaccessible.", 404);

  // Authorization: Only creator or assignee can update
  if (!task.createdBy.equals(userId) && !task.assignedTo?.equals(userId)) {
    throw new AppError("Unauthorized: Identity context mismatch for this task.", 403);
  }

  // Log changes to history if status or assignment changes
  if (data.status && data.status !== task.status) {
    task.history.push({ action: "STATUS_CHANGE", performedBy: userId, details: `Status updated to ${data.status}.` });
  }
  if (data.assignedTo && !task.assignedTo?.equals(data.assignedTo)) {
    task.history.push({ action: "ASSIGNMENT_CHANGE", performedBy: userId, details: "Personnel reassigned." });
  }

  Object.assign(task, data);
  return await task.save();
};

exports.deleteTask = async (taskId, userId, orgId) => {
  const result = await Task.deleteOne({ 
    _id: taskId, 
    organizationId: orgId, 
    createdBy: userId // Usually only creator can delete
  });
  if (result.deletedCount === 0) throw new AppError("Task deletion failed: Identity context or target missing.", 404);
  return true;
};
