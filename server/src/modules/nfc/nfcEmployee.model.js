/**
 * NfcEmployee — a person under an NfcCompany who carries an NFC card.
 *
 * The card number is the point of this register, so it is uniquely held: the
 * partial unique index stops one card being assigned to two people. It applies
 * only to real card numbers — an employee with no card (field absent) never
 * collides, so validation stores an empty card as undefined, not "".
 */
import mongoose from 'mongoose';

const nfcEmployeeSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NfcCompany',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true },
    phone: { type: String, trim: true },
    idNumber: { type: String, trim: true }, // Iqama / national ID
    nfcCardNumber: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// One card ↔ one person. Partial so only real (string) card numbers are unique;
// people without a card (field absent) are excluded.
nfcEmployeeSchema.index(
  { nfcCardNumber: 1 },
  { unique: true, partialFilterExpression: { nfcCardNumber: { $type: 'string' } } }
);
nfcEmployeeSchema.index({ name: 1 });

export default mongoose.model('NfcEmployee', nfcEmployeeSchema);
