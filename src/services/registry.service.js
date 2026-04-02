const TypeRegistry = require("../models/TypeRegistry.model");
const AppError = require("../utils/AppError");

exports.getRegistryByCategory = async (orgId, category) => {
  return await TypeRegistry.find({ organizationId: orgId, category }).sort({ isPrime: -1, title: 1 }).lean();
};

exports.createType = async (orgId, data) => {
  const { title, category, isPrime } = data;
  
  // If this item is marked as Prime, unset other items in the same category/org
  if (isPrime) {
    await TypeRegistry.updateMany({ organizationId: orgId, category }, { isPrime: false });
  }

  const existing = await TypeRegistry.findOne({ organizationId: orgId, category, title });
  if (existing) throw new AppError("A classification with this title already exists in this category.", 400);

  return await TypeRegistry.create({
    ...data,
    organizationId: orgId,
  });
};

exports.updateType = async (id, orgId, data) => {
  const { isPrime, category } = data;
  
  const type = await TypeRegistry.findOne({ _id: id, organizationId: orgId });
  if (!type) throw new AppError("Target registry classification not found.", 404);

  if (isPrime && !type.isPrime) {
    // Unset others if this one is becoming Prime
    await TypeRegistry.updateMany({ organizationId: orgId, category: type.category }, { isPrime: false });
  }

  return await TypeRegistry.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteType = async (id, orgId) => {
  const result = await TypeRegistry.deleteOne({ _id: id, organizationId: orgId });
  if (result.deletedCount === 0) throw new AppError("Target registry item dissolved or inaccessible.", 404);
  return true;
};
