const { ObjectId } = require('mongodb');

class ExpenseModel {
  constructor(db) {
    this.collection = db.collection('expenses');
  }

  async createIndexes() {
    await this.collection.createIndex({ userId: 1, expenseDate: -1 });
    await this.collection.createIndex({ userId: 1, type: 1 });
    await this.collection.createIndex({ userId: 1, category: 1 });
  }

  async create(expenseData) {
    const expense = {
      userId: new ObjectId(expenseData.userId),
      type: expenseData.type, // 'income' or 'expense'
      category: expenseData.category,
      description: expenseData.description,
      amount: expenseData.amount,
      expenseDate: new Date(expenseData.expenseDate),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.collection.insertOne(expense);
    return { ...expense, _id: result.insertedId };
  }

  async findByUser(userId, filters = {}) {
    const query = { userId: new ObjectId(userId) };
    
    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.category) {
      query.category = filters.category;
    }
    
    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0);
      query.expenseDate = { $gte: startDate, $lte: endDate };
    }
    
    if (filters.year && !filters.month) {
      const startDate = new Date(filters.year, 0, 1);
      const endDate = new Date(filters.year, 11, 31);
      query.expenseDate = { $gte: startDate, $lte: endDate };
    }
    
    const skip = filters.skip || 0;
    const limit = filters.limit || 30;
    
    const expenses = await this.collection
      .find(query)
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await this.collection.countDocuments(query);
    
    return { expenses, total };
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

  async delete(id, userId) {
    return await this.collection.deleteOne({ 
      _id: new ObjectId(id), 
      userId: new ObjectId(userId) 
    });
  }

  async getMonthlySummary(userId, filters = {}) {
    const query = { userId: new ObjectId(userId) };
    
    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0);
      query.expenseDate = { $gte: startDate, $lte: endDate };
    }
    
    if (filters.type) {
      query.type = filters.type;
    }
    
    const summary = await this.collection.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    return summary;
  }

  async getCategorySummary(userId, filters = {}) {
    const query = { userId: new ObjectId(userId) };
    
    if (filters.year) {
      const startDate = new Date(filters.year, 0, 1);
      const endDate = new Date(filters.year, 11, 31);
      query.expenseDate = { $gte: startDate, $lte: endDate };
    }
    
    const summary = await this.collection.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]).toArray();
    
    return summary;
  }
}

module.exports = ExpenseModel;
