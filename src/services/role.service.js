const Role = require("../models/Role.model");
const AppError = require("../utils/AppError");

exports.createRole = async (orgId, data) => {
  const { name, permissions } = data;
  
  const existing = await Role.findOne({ organizationId: orgId, name });
  if (existing) throw new AppError("The role identifier already exists in this registry.", 400);

  return await Role.create({
    ...data,
    organizationId: orgId,
  });
};

exports.getRolesByOrg = async (orgId) => {
  return await Role.find({ organizationId: orgId }).sort({ name: 1 }).lean();
};

exports.updateRole = async (id, orgId, data) => {
  const role = await Role.findOne({ _id: id, organizationId: orgId });
  if (!role) throw new AppError("Target role workspace not found.", 404);

  return await Role.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteRole = async (id, orgId) => {
  const result = await Role.deleteOne({ _id: id, organizationId: orgId });
  if (result.deletedCount === 0) throw new AppError("Target role dissolved or inaccessible.", 404);
  return true;
};
