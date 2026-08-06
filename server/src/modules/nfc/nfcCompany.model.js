/**
 * NfcCompany — a customer company in the "NFC Customers" directory.
 *
 * Deliberately separate from the Client module (M5): NFC customers are their own
 * book of companies whose people carry NFC cards, tracked independently of the
 * manpower-supply clients. Their people live in NfcEmployee (referenced), so each
 * has its own lifecycle and CRUD.
 */
import mongoose from 'mongoose';

const nfcCompanySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    city: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// The list screen sorts by name; the index keeps that off a full scan.
nfcCompanySchema.index({ companyName: 1 });

export default mongoose.model('NfcCompany', nfcCompanySchema);
