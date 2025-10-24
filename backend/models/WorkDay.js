const { ObjectId } = require('mongodb');

class WorkDayModel {
  constructor(db) {
    this.collection = db.collection('work_days');
  }

  async createIndexes() {
    await this.collection.createIndex({ userId: 1, workDate: -1 });
    await this.collection.createIndex({ userId: 1, workDate: 1 }, { unique: true });
  }

  async create(workDayData) {
    const workDay = {
      userId: new ObjectId(workDayData.userId),
      workDate: new Date(workDayData.workDate),
      hoursWorked: workDayData.hoursWorked,
      hourlyRate: workDayData.hourlyRate,
      tipsAmount: workDayData.tipsAmount || 0,
      notes: workDayData.notes || '',
      paymentStatus: workDayData.paymentStatus || 'pending',
      paymentDate: workDayData.paymentDate || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.collection.insertOne(workDay);
    return { ...workDay, _id: result.insertedId };
  }

  async findByUser(userId, filters = {}) {
    const query = { userId: new ObjectId(userId) };
    
    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0);
      query.workDate = { $gte: startDate, $lte: endDate };
    }
    
    if (filters.startDate && filters.endDate) {
      query.workDate = { 
        $gte: new Date(filters.startDate), 
        $lte: new Date(filters.endDate) 
      };
    }
    
    const skip = filters.skip || 0;
    const limit = filters.limit || 30;
    
    const workDays = await this.collection
      .find(query)
      .sort({ workDate: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await this.collection.countDocuments(query);
    
    return { workDays, total };
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

  async getMonthlyStats(userId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const stats = await this.collection.aggregate([
      {
        $match: {
          userId: new ObjectId(userId),
          workDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$hoursWorked' },
          totalEarnings: { $sum: { $multiply: ['$hoursWorked', '$hourlyRate'] } },
          totalTips: { $sum: '$tipsAmount' },
          daysWorked: { $sum: 1 },
          avgHoursPerDay: { $avg: '$hoursWorked' }
        }
      }
    ]).toArray();
    
    return stats[0] || {
      totalHours: 0,
      totalEarnings: 0,
      totalTips: 0,
      daysWorked: 0,
      avgHoursPerDay: 0
    };
  }
}

module.exports = WorkDayModel;
