class ReminderNotificationScheduler
  def self.schedule_for(target_date = Date.current)
    new(target_date).schedule
  end

  def initialize(target_date)
    @target_date = target_date
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

  def due_occasions
    Occasion.includes(:person).upcoming(target_date).select do |occasion|
      occasion.reminder_enabled? && occasion.reminder_date == target_date
    end
  end
end
