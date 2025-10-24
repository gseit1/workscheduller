class ExpenseController {
  constructor(expenseModel) {
    this.expenseModel = expenseModel;
  }

  async getExpenses(req, res) {
    try {
      const { type, category, month, year, limit, skip } = req.query;
      
      const filters = {
        limit: parseInt(limit) || 30,
        skip: parseInt(skip) || 0
      };

      if (type) filters.type = type;
      if (category) filters.category = category;
      if (month) filters.month = parseInt(month);
      if (year) filters.year = parseInt(year);

      const result = await this.expenseModel.findByUser(req.userId, filters);

      res.json({
        success: true,
        expenses: result.expenses,
        total: result.total
      });
    } catch (error) {
      console.error('Get expenses error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async createExpense(req, res) {
    try {
      const { type, category, description, amount, expenseDate } = req.body;

      if (!type || !category || !description || !amount || !expenseDate) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const expense = await this.expenseModel.create({
        userId: req.userId,
        type,
        category,
        description,
        amount: parseFloat(amount),
        expenseDate
      });

      res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        expense
      });
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async updateExpense(req, res) {
    try {
      const { id } = req.params;
      const { type, category, description, amount, expenseDate } = req.body;

      const updateData = {};
      if (type) updateData.type = type;
      if (category) updateData.category = category;
      if (description) updateData.description = description;
      if (amount) updateData.amount = parseFloat(amount);
      if (expenseDate) updateData.expenseDate = new Date(expenseDate);

      const result = await this.expenseModel.update(id, req.userId, updateData);

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      res.json({
        success: true,
        message: 'Expense updated successfully'
      });
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async deleteExpense(req, res) {
    try {
      const { id } = req.params;

      const result = await this.expenseModel.delete(id, req.userId);

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      res.json({
        success: true,
        message: 'Expense deleted successfully'
      });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getSummary(req, res) {
    try {
      const { month, year } = req.query;

      const filters = {};
      if (month) filters.month = parseInt(month);
      if (year) filters.year = parseInt(year);

      const summary = await this.expenseModel.getMonthlySummary(req.userId, filters);

      res.json({
        success: true,
        summary
      });
    } catch (error) {
      console.error('Get summary error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getCategorySummary(req, res) {
    try {
      const { year } = req.query;

      const filters = {};
      if (year) filters.year = parseInt(year);

      const summary = await this.expenseModel.getCategorySummary(req.userId, filters);

      res.json({
        success: true,
        categories: summary
      });
    } catch (error) {
      console.error('Get category summary error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = ExpenseController;
