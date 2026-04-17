class ProcessQueuedRemindersJob < ApplicationJob
  queue_as :default

  def perform(limit: 25)
    ReminderNotificationProcessor.process(limit: limit)
  end
end
