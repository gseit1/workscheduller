const { ObjectId } = require('mongodb');

class CalendarEventModel {
  constructor(db) {
    this.collection = db.collection('calendar_events');
  }

  async createIndexes() {
    await this.collection.createIndex({ userId: 1, startDate: -1 });
    await this.collection.createIndex({ userId: 1, eventType: 1 });
  }

  async create(eventData) {
    const event = {
      userId: new ObjectId(eventData.userId),
      title: eventData.title,
      description: eventData.description || '',
      eventType: eventData.eventType || 'work', // 'work', 'meeting', 'personal', etc.
      startDate: new Date(eventData.startDate),
      endDate: eventData.endDate ? new Date(eventData.endDate) : new Date(eventData.startDate),
      startTime: eventData.startTime || null,
      endTime: eventData.endTime || null,
      isAllDay: eventData.isAllDay || false,
      priority: eventData.priority || 'normal', // 'low', 'normal', 'high'
      status: eventData.status || 'scheduled', // 'scheduled', 'completed', 'cancelled'
      reminderMinutes: eventData.reminderMinutes || null,
      location: eventData.location || '',
      attendees: eventData.attendees || [],
      color: eventData.color || '#2563eb',
      course: eventData.course || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.collection.insertOne(event);
    return { ...event, _id: result.insertedId };
  }

  async findByUser(userId, filters = {}) {
    const query = { userId: new ObjectId(userId) };
    
    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0);
      query.startDate = { $gte: startDate, $lte: endDate };
    }
    
    if (filters.start_date && filters.end_date) {
      query.startDate = { 
        $gte: new Date(filters.start_date), 
        $lte: new Date(filters.end_date) 
      };
    }
    
    if (filters.date) {
      const date = new Date(filters.date);
      query.startDate = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lte: new Date(date.setHours(23, 59, 59, 999))
      };
    }
    
    if (filters.eventType) {
      query.eventType = filters.eventType;
    }
    
    const events = await this.collection
      .find(query)
      .sort({ startDate: 1, startTime: 1 })
      .toArray();
    
    return events;
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
}

module.exports = CalendarEventModel;
