const mongoose = require('mongoose');
const { Schema } = mongoose;

const customerSchema = new Schema(
  {
    leadId: { type: String, required: true },
    createdBy: { type: String, required: true },
    updatedBy: { type: String },
    softDeleted: { type: Boolean, default: false },
    primaryCompanyId: { type: mongoose.Mixed },
    primaryPersonalId: { type: mongoose.Mixed },
    firstName: { type: String },
    lastName: { type: String },
    dob: { type: Date },
    companyName: { type: String },
    executive1: { type: String },
    executive2: { type: String },
    executive3: { type: String },
    mobile: { type: String },
    mobile2: { type: String },
    mobile3: { type: String },
    gender: { type: Number },
    passportExpiry: { type: Date },
    visaExpiry: { type: Date },
    email: { type: String },
    email2: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    townCity: { type: String },
    postalCode: { type: String },
    state: { type: String },
    areaOfBusiness: { type: Number },
    positionInCompany: { type: Number },
    location: { type: Number },
    nationality: { type: String },
    poBox: { type: String },
    sourceName: { type: String },
    status: { type: Number, default: 1 },
    isFilled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.customer || mongoose.model('customer', customerSchema);
