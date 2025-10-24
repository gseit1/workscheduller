class CalendarController {
  constructor(calendarEventModel) {
    this.calendarEventModel = calendarEventModel;
  }

  async getEvents(req, res) {
    try {
      const { month, year, start_date, end_date, date, eventType } = req.query;
      
      const filters = {};

      if (month && year) {
        filters.month = parseInt(month);
        filters.year = parseInt(year);
      }

      if (start_date && end_date) {
        filters.start_date = start_date;
        filters.end_date = end_date;
      }

      if (date) {
        filters.date = date;
      }

      if (eventType) {
        filters.eventType = eventType;
      }

      const events = await this.calendarEventModel.findByUser(req.userId, filters);

      res.json({
        success: true,
        events
      });
    } catch (error) {
      console.error('Get events error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async createEvent(req, res) {
    try {
      const { 
        title, description, eventType, startDate, endDate, 
        startTime, endTime, isAllDay, priority, status,
        reminderMinutes, location, attendees, color, course
      } = req.body;

      if (!title || !startDate) {
        return res.status(400).json({ error: 'Title and start date are required' });
      }

      const event = await this.calendarEventModel.create({
        userId: req.userId,
        title,
        description,
        eventType: eventType || 'work',
        startDate,
        endDate,
        startTime,
        endTime,
        isAllDay: isAllDay || false,
        priority: priority || 'normal',
        status: status || 'scheduled',
        reminderMinutes,
        location,
        attendees,
        color,
        course
      });

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        event
      });
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Remove userId if present in body
      delete updateData.userId;

      const result = await this.calendarEventModel.update(id, req.userId, updateData);

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json({
        success: true,
        message: 'Event updated successfully'
      });
    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async deleteEvent(req, res) {
    try {
      const { id } = req.params;

      const result = await this.calendarEventModel.delete(id, req.userId);

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = CalendarController;
