import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/auth.model.js';
import FarmerDetail from './models/farmerDetail.model.js';
import ExpertDetail from './models/expertDetail.model.js';
import Post from './models/post.model.js';
import Crop from './models/crop.model.js';
import Task from './models/task.model.js';
import Appointment from './models/appointmentModel.js';
import Irrigation from './models/irrigation.model.js';

dotenv.config();

const seed = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/agriconnect';
    await mongoose.connect(mongoUrl);
    console.log('🌱 Connected to MongoDB for seeding...');

    const hashedPassword = await bcrypt.hash('password123', 12);

    // 1. Seed or update Farmer Ramu
    let farmer = await User.findOne({ email: 'ramu@gmail.com' });
    if (!farmer) {
      farmer = await User.create({
        name: 'Ramu Kumar',
        email: 'ramu@gmail.com',
        password: hashedPassword,
        role: 'farmer'
      });
      console.log('✅ Created Farmer Ramu');
    } else {
      farmer.password = hashedPassword;
      farmer.name = 'Ramu Kumar';
      await farmer.save();
      console.log('✅ Updated Farmer Ramu password to password123');
    }

    // 2. Seed or update Expert Geethu
    let expert = await User.findOne({ email: 'geethu@gmail.com' });
    if (!expert) {
      expert = await User.create({
        name: 'Dr. Geethu Sharma',
        email: 'geethu@gmail.com',
        password: hashedPassword,
        role: 'expert'
      });
      console.log('✅ Created Expert Dr. Geethu');
    } else {
      expert.password = hashedPassword;
      expert.name = 'Dr. Geethu Sharma';
      await expert.save();
      console.log('✅ Updated Expert Dr. Geethu password to password123');
    }

    // 3. Farmer Details
    await FarmerDetail.deleteMany({ user: farmer._id });
    await FarmerDetail.create({
      user: farmer._id,
      phone: '9876543210',
      address: 'Green Valley Farm, District 4',
      region: 'Karnataka',
      climate: 'Tropical Semi-Arid',
      cropNames: ['Tomato', 'Ragi', 'Wheat'],
      amountOfLand: 5.5,
      otherDetails: 'Focusing on organic horticulture and precision drip irrigation.'
    });
    console.log('✅ Seeded Farmer details');

    // 4. Expert Details
    await ExpertDetail.deleteMany({ userId: expert._id });
    await ExpertDetail.create({
      userId: expert._id,
      expertStats: {
        successfulAppointments: 14,
        farmersHelped: 12,
        experience: 8,
        rating: 4.9
      },
      appointmentStats: {
        totalAppointments: 16,
        satisfactionRating: 4.8,
        adviceAreas: ['Crop Protection', 'Pest Control', 'Soil Fertility', 'Drip Irrigation']
      },
      blogEngagement: { views: 350, comments: 24, likes: 88 }
    });
    console.log('✅ Seeded Expert details');

    // 5. Sample Posts (Blogs)
    await Post.deleteMany({ author: expert._id });
    await Post.create([
      {
        title: 'Integrated Pest Management for Summer Crops',
        content: `Integrated Pest Management (IPM) is an effective and environmentally sensitive approach to pest control. 
By combining biological controls, trap crops, and targeted eco-friendly sprays, farmers can protect tomato and chilli crops from early leaf blight and wilt diseases without heavy synthetic chemicals.

Key Tips:
1. Use yellow sticky traps to monitor aphid populations early.
2. Maintain soil aeration and avoid waterlogging.
3. Apply Neem seed kernel extract (NSKE 5%) at first sight of pest infestation.`,
        author: expert._id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Maximizing Crop Yields with Smart Drip Irrigation',
        content: `Efficient water management is the key to sustainable agriculture. Drip irrigation reduces water wastage by deliver water directly to crop roots.

Benefits:
- Saves up to 45% water compared to flood irrigation.
- Enables precise fertigation (delivering dissolved fertilizers via irrigation lines).
- Minimizes weed growth between rows.`,
        author: expert._id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('✅ Seeded Expert blog posts');

    // 6. Sample Crops for Farmer Ramu
    await Crop.deleteMany({ user: farmer._id });
    await Crop.create([
      {
        name: 'Organic Tomatoes',
        growthProgress: 75,
        yieldData: [
          { month: 'Jan', yield: 120 },
          { month: 'Feb', yield: 150 },
          { month: 'Mar', yield: 210 },
          { month: 'Apr', yield: 280 }
        ],
        user: farmer._id
      },
      {
        name: 'Finger Millet (Ragi)',
        growthProgress: 40,
        yieldData: [
          { month: 'Jan', yield: 80 },
          { month: 'Feb', yield: 95 },
          { month: 'Mar', yield: 130 }
        ],
        user: farmer._id
      }
    ]);
    console.log('✅ Seeded Crops data');

    const tomatoCrop = await Crop.findOne({ name: 'Organic Tomatoes', user: farmer._id });
    const ragiCrop = await Crop.findOne({ name: 'Finger Millet (Ragi)', user: farmer._id });

    await Irrigation.deleteMany({ user: farmer._id });
    if (tomatoCrop && ragiCrop) {
      await Irrigation.create([
        { crop: tomatoCrop._id, user: farmer._id, month: 'Jan', waterUsage: 450, forecastedUsage: 500 },
        { crop: tomatoCrop._id, user: farmer._id, month: 'Feb', waterUsage: 520, forecastedUsage: 550 },
        { crop: tomatoCrop._id, user: farmer._id, month: 'Mar', waterUsage: 610, forecastedUsage: 600 },
        { crop: tomatoCrop._id, user: farmer._id, month: 'Apr', waterUsage: 700, forecastedUsage: 650 },
        { crop: ragiCrop._id, user: farmer._id, month: 'Jan', waterUsage: 300, forecastedUsage: 350 },
        { crop: ragiCrop._id, user: farmer._id, month: 'Feb', waterUsage: 380, forecastedUsage: 400 },
        { crop: ragiCrop._id, user: farmer._id, month: 'Mar', waterUsage: 420, forecastedUsage: 450 }
      ]);
      console.log('✅ Seeded Irrigation water usage data');
    }

    // 7. Sample Tasks for Farmer Ramu
    await Task.deleteMany({ user: farmer._id });
    await Task.create([
      {
        title: 'Apply Bio-Fertilizer to Tomato Field',
        description: 'Dose 5kg organic compost mixed with Trichoderma around tomato roots.',
        date: new Date(),
        isCompleted: false,
        user: farmer._id
      },
      {
        title: 'Inspect Drip Emitters & Filters',
        description: 'Flush drip lines to remove sediment build-up.',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        isCompleted: true,
        user: farmer._id
      }
    ]);
    console.log('✅ Seeded Tasks data');

    // 8. Sample Appointment
    await Appointment.deleteMany({ farmerId: farmer._id });
    await Appointment.create({
      farmerId: farmer._id,
      expertId: expert._id,
      status: 'accepted',
      date: new Date()
    });
    console.log('✅ Seeded Appointment data');

    console.log('\n🎉 SEEDING COMPLETE!');
    console.log('-------------------------------------------');
    console.log('Demo Credentials for Tomorrow:');
    console.log('👨‍🌾 Farmer Login:');
    console.log('   Email: ramu@gmail.com');
    console.log('   Password: password123');
    console.log('   Role: Farmer');
    console.log('\n👨‍🔬 Expert Login:');
    console.log('   Email: geethu@gmail.com');
    console.log('   Password: password123');
    console.log('   Role: Agriculture Expert');
    console.log('-------------------------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seed();
