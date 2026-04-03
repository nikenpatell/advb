const TypeRegistry = require("../models/TypeRegistry.model");
const AppError = require("../utils/AppError");
const CacheUtil = require("../utils/cacheUtil");

exports.getRegistryByCategory = async (orgId, category) => {
  const cacheKey = `registry:${orgId}:${category}`;
  const cachedData = CacheUtil.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  const data = await TypeRegistry.find({ organizationId: orgId, category }).sort({ isPrime: -1, title: 1 }).lean();
  CacheUtil.set(cacheKey, data, 120); // Cache for 2 minutes
  return data;
};

exports.createType = async (orgId, data) => {
  const { title, category, isPrime } = data;
  
  // If this item is marked as Prime, unset other items in the same category/org
  if (isPrime) {
    await TypeRegistry.updateMany({ organizationId: orgId, category }, { isPrime: false });
  }

  const existing = await TypeRegistry.findOne({ organizationId: orgId, category, title });
  if (existing) throw new AppError("A classification with this title already exists in this category.", 400);

  const record = await TypeRegistry.create({
    ...data,
    organizationId: orgId,
  });

  // Invalidate Cache
  CacheUtil.clear(`registry:${orgId}:${category}`);
  return record;
};

exports.updateType = async (id, orgId, data) => {
  const { isPrime, category } = data;
  
  const type = await TypeRegistry.findOne({ _id: id, organizationId: orgId });
  if (!type) throw new AppError("Target registry classification not found.", 404);

  if (isPrime && !type.isPrime) {
    // Unset others if this one is becoming Prime
    await TypeRegistry.updateMany({ organizationId: orgId, category: type.category }, { isPrime: false });
  }

  const updated = await TypeRegistry.findByIdAndUpdate(id, data, { new: true });
  
  // Invalidate Cache
  CacheUtil.clear(`registry:${orgId}:${type.category}`);
  return updated;
};

exports.deleteType = async (id, orgId) => {
  const result = await TypeRegistry.deleteOne({ _id: id, organizationId: orgId });
  if (result.deletedCount === 0) throw new AppError("Target registry item dissolved or inaccessible.", 404);
  
  // Invalidate matching patterns (since we don't have category here, clear org prefix)
  CacheUtil.clearPattern(`registry:${orgId}:`);
  return true;
};
