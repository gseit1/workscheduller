const { ObjectId } = require('mongodb');

class GoalModel {
  constructor(db) {
    this.collection = db.collection('goals');
  }

  async createIndexes() {
    await this.collection.createIndex({ userId: 1, deadline: -1 });
    await this.collection.createIndex({ userId: 1, status: 1 });
  }

  async create(goalData) {
    const goal = {
      userId: new ObjectId(goalData.userId),
      title: goalData.title,
      description: goalData.description || '',
      targetAmount: goalData.targetAmount,
      currentAmount: goalData.currentAmount || 0,
      deadline: new Date(goalData.deadline),
      status: goalData.status || 'active', // 'active', 'completed', 'cancelled'
      category: goalData.category || 'general',
      isShared: goalData.isShared || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.collection.insertOne(goal);
    return { ...goal, _id: result.insertedId };
  }

  async findByUser(userId, filters = {}) {
    const query = { userId: new ObjectId(userId) };
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    const goals = await this.collection
      .find(query)
      .sort({ deadline: 1 })
      .toArray();
    
    return goals;
  }

  async findById(id) {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async update(id, userId, updateData) {
    return await this.collection.updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(userId) },
      { 
        $set: { 
          ...updateData,
          updatedAt: new Date() 
        } 
      }
    );
  }

  async updateProgress(id, userId, amount) {
    const goal = await this.findById(id);
    if (!goal) return null;
    
    const newAmount = goal.currentAmount + amount;
    const status = newAmount >= goal.targetAmount ? 'completed' : 'active';
    
    return await this.collection.updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(userId) },
      { 
        $set: { 
          currentAmount: newAmount,
          status,
          updatedAt: new Date() 
        } 
      }
    );
  }

  async delete(id, userId) {
    return await this.collection.deleteOne({ 
      _id: new ObjectId(id), 
      userId: new ObjectId(userId) 
    });
  }
}

module.exports = GoalModel;
