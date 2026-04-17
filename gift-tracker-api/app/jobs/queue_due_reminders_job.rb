class QueueDueRemindersJob < ApplicationJob
  queue_as :default

  def perform(target_date = Date.current)
    ReminderNotificationScheduler.schedule_for(target_date)
  end
end
