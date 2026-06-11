import mongoose from 'mongoose';
async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/plis');
  const user = await mongoose.connection.collection('users').findOne({});
  console.log('USER_ID:', user._id.toString());
  process.exit(0);
}
run();
