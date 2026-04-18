class ReminderNotificationScheduler
  def self.schedule_for(target_date = Date.current, user: nil)
    new(target_date, user: user).schedule
  end

  def initialize(target_date, user: nil)
    @target_date = target_date
    @user = user
  end

  def schedule
    due_occasions.map do |occasion|
      ReminderNotification.find_or_create_by(
        occasion: occasion,
        reminder_date: occasion.reminder_date,
        channel: "email"
      ) do |notification|
        notification.status = "queued"
      end
    end
  end

  private

  attr_reader :target_date
  attr_reader :user

  def due_occasions
    scope = Occasion.includes(:person).upcoming(target_date)
    scope = scope.for_user(user) if user.present?

    scope.select do |occasion|
      occasion.reminder_enabled? && occasion.reminder_date == target_date
    end
  end
end
