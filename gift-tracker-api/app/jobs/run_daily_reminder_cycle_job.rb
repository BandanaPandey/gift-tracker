class RunDailyReminderCycleJob < ApplicationJob
  queue_as :default

  def perform(target_date = Date.current, limit: 25)
    ReminderDeliveryRunner.run(target_date: target_date, limit: limit)
  end
end
