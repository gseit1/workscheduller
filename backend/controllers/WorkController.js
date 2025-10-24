class WorkController {
  constructor(workDayModel) {
    this.workDayModel = workDayModel;
  }

  async getWorkDays(req, res) {
    try {
      const { month, year, limit, skip } = req.query;
      
      const filters = {
        limit: parseInt(limit) || 30,
        skip: parseInt(skip) || 0
      };

      if (month && year) {
        filters.month = parseInt(month);
        filters.year = parseInt(year);
      }

      const result = await this.workDayModel.findByUser(req.userId, filters);

      res.json({
        success: true,
        workDays: result.workDays,
        total: result.total
      });
    } catch (error) {
      console.error('Get work days error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async createWorkDay(req, res) {
    try {
      const { workDate, hoursWorked, hourlyRate, tipsAmount, notes, paymentStatus } = req.body;

      if (!workDate || !hoursWorked || !hourlyRate) {
        return res.status(400).json({ error: 'Work date, hours worked, and hourly rate are required' });
      }

      const workDay = await this.workDayModel.create({
        userId: req.userId,
        workDate,
        hoursWorked: parseFloat(hoursWorked),
        hourlyRate: parseFloat(hourlyRate),
        tipsAmount: parseFloat(tipsAmount) || 0,
        notes,
        paymentStatus: paymentStatus || 'pending'
      });

      res.status(201).json({
        success: true,
        message: 'Work day created successfully',
        workDay
      });
    } catch (error) {
      console.error('Create work day error:', error);
      if (error.code === 11000) {
        return res.status(400).json({ error: 'A work entry already exists for this date' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  }

  async updateWorkDay(req, res) {
    try {
      const { id } = req.params;
      const { hoursWorked, hourlyRate, tipsAmount, notes, paymentStatus, paymentDate } = req.body;

      const updateData = {};
      if (hoursWorked !== undefined) updateData.hoursWorked = parseFloat(hoursWorked);
      if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate);
      if (tipsAmount !== undefined) updateData.tipsAmount = parseFloat(tipsAmount);
      if (notes !== undefined) updateData.notes = notes;
      if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
      if (paymentDate !== undefined) updateData.paymentDate = paymentDate ? new Date(paymentDate) : null;

      const result = await this.workDayModel.update(id, req.userId, updateData);

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Work day not found' });
      }

      res.json({
        success: true,
        message: 'Work day updated successfully'
      });
    } catch (error) {
      console.error('Update work day error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async deleteWorkDay(req, res) {
    try {
      const { id } = req.params;

      const result = await this.workDayModel.delete(id, req.userId);

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Work day not found' });
      }

      res.json({
        success: true,
        message: 'Work day deleted successfully'
      });
    } catch (error) {
      console.error('Delete work day error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getMonthlyStats(req, res) {
    try {
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).json({ error: 'Month and year are required' });
      }

      const stats = await this.workDayModel.getMonthlyStats(
        req.userId,
        parseInt(month),
        parseInt(year)
      );

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Get monthly stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = WorkController;
