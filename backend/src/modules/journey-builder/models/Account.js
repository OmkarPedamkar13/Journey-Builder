const mongoose = require('mongoose');
const { Schema } = mongoose;

const uploadedDocSchema = new Schema(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    filePath: { type: String, required: true },
  },
  { _id: false }
);

const accountSchema = new Schema(
  {
    customerId: { type: mongoose.Types.ObjectId },
    leadId: { type: String, required: true },
    status: { type: String, required: true },
    createdBy: { type: String, required: true },
    updatedBy: { type: String },
    accountNumber: { type: String, unique: true },
    accId: { type: String },
    platformLoginId: { type: String },
    openingDate: { type: Date },
    softDeleted: { type: Boolean, default: false },
    formSubmittedAt: { type: Date },
    formSubmittedBy: { type: String },
    expectedFundingAmount: { type: String },

    commissionForex: { type: String },
    commissionCFDs: { type: String },
    commissionOthers: { type: String },

    spread: { type: mongoose.Types.ObjectId },
    spreadProfile: { type: String },
    holdingCost: { type: String },
    commissionProfile: { type: String },

    fundingDate: { type: Date },
    initialFunding: { type: mongoose.Mixed },
    accountType: { type: String },
    tradingType: { type: String },
    tradingApproach: { type: String },
    principal: { type: String },
    clientRelationsOfficer: { type: String },
    crAssignedDate: { type: Date },
    tradingHorizon: { type: Number },
    riskAppetite: { type: Number },
    rewardAppetite: { type: Number },
    riskReward: { type: Number },
    clientType: { type: Number, default: 0 },
    callFrequency: { type: Number, default: 2 },
    ib1: { type: String },
    ib2: { type: String },
    ib3: { type: String },

    isUnsubscribed: { type: Boolean, default: true },
    isReceived: { type: Boolean, default: false },
    processStarted: { type: mongoose.Mixed },
    processCompleted: { type: mongoose.Mixed },
    formRejected: { type: Date },
    isDoc1Verified: { type: Boolean, default: false },
    isDoc2Verified: { type: Boolean, default: false },
    uploadedDocs: { type: [uploadedDocSchema], default: [] },
    isAcOpenedMailSent: { type: Boolean, default: false },
    isAcFundedMailSent: { type: Boolean, default: false },
    isAdvisorMappedMailSent: { type: Boolean, default: false },
    isFilled: { type: Boolean, default: false },
    isRmTrainingCompleted: { type: Boolean, default: false },
    isCrTrainingCompleted: { type: Boolean, default: false },
    accountTransactionType: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.account || mongoose.model('account', accountSchema);
