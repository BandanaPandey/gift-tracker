class ReminderNotificationProcessor
  def self.process(limit: 25, user: nil)
    scope = ReminderNotification.queued.recent_first
    scope = scope.joins(occasion: :person).where(people: { user_id: user.id }) if user.present?

    scope.limit(limit).map do |notification|
      new(notification).process
    end
  end

  def initialize(notification)
    @notification = notification
  end

  def process
    if notification.person.email.blank?
      notification.update!(status: "skipped", error_message: "No email address set for #{notification.person.name}")
      return notification
    end

    ReminderNotificationMailer.reminder_email(notification).deliver_now

    notification.update!(
      status: "sent",
      sent_at: Time.current,
      error_message: nil
    )

    notification
  rescue StandardError => error
    notification.update!(
      status: "failed",
      error_message: error.message
    )
    notification
  end

  private

  attr_reader :notification
end
