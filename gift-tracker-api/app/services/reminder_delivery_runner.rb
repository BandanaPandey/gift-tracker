class ReminderDeliveryRunner
  def self.run(target_date: Date.current, limit: 25)
    queued_notifications = ReminderNotificationScheduler.schedule_for(target_date)
    processed_notifications = ReminderNotificationProcessor.process(limit: limit)

    {
      target_date: target_date,
      queued_count: queued_notifications.count { |notification| notification.status == "queued" },
      processed_count: processed_notifications.count,
      sent_count: processed_notifications.count { |notification| notification.status == "sent" },
      skipped_count: processed_notifications.count { |notification| notification.status == "skipped" },
      failed_count: processed_notifications.count { |notification| notification.status == "failed" }
    }
  end
end
