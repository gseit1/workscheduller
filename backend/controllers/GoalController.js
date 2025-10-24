class GoalController {
  constructor(goalModel) {
    this.goalModel = goalModel;
  }

  async getGoals(req, res) {
    try {
      const { status, category } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (category) filters.category = category;

      const goals = await this.goalModel.findByUser(req.userId, filters);

      res.json({
        success: true,
        goals
      });
    } catch (error) {
      console.error('Get goals error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async createGoal(req, res) {
    try {
      const { title, description, targetAmount, currentAmount, deadline, category, isShared } = req.body;

      if (!title || !targetAmount || !deadline) {
        return res.status(400).json({ error: 'Title, target amount, and deadline are required' });
      }

      const goal = await this.goalModel.create({
        userId: req.userId,
        title,
        description,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline,
        category: category || 'general',
        isShared: isShared || false
      });

      res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        goal
      });
    } catch (error) {
      console.error('Create goal error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async updateGoal(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Remove userId if present in body
      delete updateData.userId;

      const result = await this.goalModel.update(id, req.userId, updateData);

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json({
        success: true,
        message: 'Goal updated successfully'
      });
    } catch (error) {
      console.error('Update goal error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async updateProgress(req, res) {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (amount === undefined) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      const result = await this.goalModel.updateProgress(id, req.userId, parseFloat(amount));

      if (!result) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json({
        success: true,
        message: 'Goal progress updated successfully'
      });
    } catch (error) {
      console.error('Update goal progress error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async deleteGoal(req, res) {
    try {
      const { id } = req.params;

      const result = await this.goalModel.delete(id, req.userId);

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.json({
        success: true,
        message: 'Goal deleted successfully'
      });
    } catch (error) {
      console.error('Delete goal error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = GoalController;
