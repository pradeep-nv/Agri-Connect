import mongoose from 'mongoose';

const marketPriceSchema = new mongoose.Schema({
  state: { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  market: { type: String, required: true },
  commodity: { type: String, required: true, index: true },
  variety: { type: String },
  minPrice: { type: Number, required: true },
  maxPrice: { type: Number, required: true },
  modalPrice: { type: Number, required: true },
  arrivalDate: { type: String }
}, { timestamps: true });

export default mongoose.model('MarketPrice', marketPriceSchema);
