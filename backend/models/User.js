const { ObjectId } = require('mongodb');

class UserModel {
  constructor(db) {
    this.collection = db.collection('users');
  }

  async createIndexes() {
    await this.collection.createIndex({ email: 1 }, { unique: true });
    await this.collection.createIndex({ username: 1 }, { unique: true });
  }

  async create(userData) {
    const user = {
      username: userData.username,
      email: userData.email,
      password: userData.password, // Should be hashed before passing here
      hourlyRate: userData.hourlyRate || 15,
      currency: userData.currency || 'EUR',
      avatar: userData.avatar || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async findByEmail(email) {
    return await this.collection.findOne({ email });
  }

  async findByUsername(username) {
    return await this.collection.findOne({ username });
  }

  async findById(id) {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async updateHourlyRate(userId, hourlyRate) {
    return await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          hourlyRate, 
          updatedAt: new Date() 
        } 
      }
    );
  }

  async update(userId, updateData) {
    return await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          ...updateData,
          updatedAt: new Date() 
        } 
      }
    );
  }
}

module.exports = UserModel;
