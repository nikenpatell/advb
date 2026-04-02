const Organization = require("../models/Organization.model");
const Membership = require("../models/Membership.model");

exports.createOrg = async (data, userId) => {
  const org = await Organization.create({
    name: data.name,
    address: data.address,
    email: data.email,
    contactNo: data.contactNo,
    createdBy: userId,
  });

  await Membership.create({
    userId,
    organizationId: org._id,
    role: "ORG_ADMIN",
  });

  return org;
};

exports.updateOrg = async (orgId, data, userId) => {
  const org = await Organization.findById(orgId);
  if (!org) throw new Error("Organization not found");

  if (org.createdBy.toString() !== userId.toString()) {
    throw new Error("You are not the owner of this organization");
  }

  org.name = data.name || org.name;
  org.address = data.address !== undefined ? data.address : org.address;
  org.email = data.email !== undefined ? data.email : org.email;
  org.contactNo = data.contactNo !== undefined ? data.contactNo : org.contactNo;

  await org.save();
  return org;
};

exports.deleteOrg = async (orgId, userId) => {
  const org = await Organization.findById(orgId);
  if (!org) throw new Error("Organization not found");

  if (org.createdBy.toString() !== userId.toString()) {
    throw new Error("You are not the owner of this organization");
  }

  await Membership.deleteMany({ organizationId: orgId });
  await Organization.deleteOne({ _id: orgId });
  return true;
};
