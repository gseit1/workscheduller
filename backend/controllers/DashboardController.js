class DashboardController {
  constructor(workDayModel, expenseModel, goalModel) {
    this.workDayModel = workDayModel;
    this.expenseModel = expenseModel;
    this.goalModel = goalModel;
  }

  async getOverview(req, res) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Get current month work stats
      const workStats = await this.workDayModel.getMonthlyStats(
        req.userId,
        currentMonth,
        currentYear
      );

      // Get recent work days
      const recentWork = await this.workDayModel.findByUser(req.userId, {
        limit: 5,
        skip: 0
      });

      // Get current month expenses
      const expensesResult = await this.expenseModel.findByUser(req.userId, {
        month: currentMonth,
        year: currentYear,
        limit: 100
      });

      // Calculate expense totals
      const expensesByType = expensesResult.expenses.reduce((acc, exp) => {
        if (!acc[exp.type]) acc[exp.type] = 0;
        acc[exp.type] += exp.amount;
        return acc;
      }, {});

      // Get active goals
      const goals = await this.goalModel.findByUser(req.userId, { status: 'active' });

      res.json({
        success: true,
        currentMonth: {
          work: {
            totalHours: workStats.totalHours || 0,
            totalEarnings: workStats.totalEarnings || 0,
            totalTips: workStats.totalTips || 0,
            daysWorked: workStats.daysWorked || 0,
            avgHoursPerDay: workStats.avgHoursPerDay || 0
          },
          expenses: {
            total: expensesByType.expense || 0,
            income: expensesByType.income || 0,
            net: (expensesByType.income || 0) - (expensesByType.expense || 0)
          }
        },
        recentActivity: recentWork.workDays || [],
        activeGoals: goals || [],
        summary: {
          totalEarnings: (workStats.totalEarnings || 0) + (workStats.totalTips || 0),
          totalExpenses: expensesByType.expense || 0,
          netIncome: (workStats.totalEarnings || 0) + (workStats.totalTips || 0) - (expensesByType.expense || 0)
        }
      });
    } catch (error) {
      console.error('Dashboard overview error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async getYearlyStats(req, res) {
    try {
      const { year } = req.query;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();

      const monthlyData = [];

      // Get stats for each month
      for (let month = 1; month <= 12; month++) {
        const workStats = await this.workDayModel.getMonthlyStats(
          req.userId,
          month,
          targetYear
        );

        const expenseSummary = await this.expenseModel.getMonthlySummary(req.userId, {
          month,
          year: targetYear
        });

        const expenses = expenseSummary.find(s => s._id === 'expense')?.total || 0;
        const income = expenseSummary.find(s => s._id === 'income')?.total || 0;

        monthlyData.push({
          month,
          hours: workStats.totalHours || 0,
          earnings: workStats.totalEarnings || 0,
          tips: workStats.totalTips || 0,
          expenses,
          income,
          net: (workStats.totalEarnings || 0) + (workStats.totalTips || 0) - expenses
        });
      }

      res.json({
        success: true,
        year: targetYear,
        monthlyData
      });
    } catch (error) {
      console.error('Yearly stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

module.exports = DashboardController;
