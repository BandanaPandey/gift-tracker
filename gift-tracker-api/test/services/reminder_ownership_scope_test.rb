require "test_helper"

class ReminderOwnershipScopeTest < ActiveSupport::TestCase
  test "scheduler only queues reminders for the requested user" do
    due_for_user_one = Occasion.create!(
      person: people(:one),
      kind: "custom",
      title: "User one reminder",
      date: Date.current + 5.days,
      recurring_yearly: false,
      reminder_days_before: 5,
      reminder_enabled: true
    )
    Occasion.create!(
      person: people(:two),
      kind: "custom",
      title: "User two reminder",
      date: Date.current + 5.days,
      recurring_yearly: false,
      reminder_days_before: 5,
      reminder_enabled: true
    )

    notifications = ReminderNotificationScheduler.schedule_for(Date.current, user: users(:one))

    assert_equal [due_for_user_one], notifications.map(&:occasion)
  end

  test "processor only processes queued reminders for the requested user" do
    user_one_notification = ReminderNotification.create!(
      occasion: occasions(:one),
      reminder_date: Date.current,
      channel: "email",
      status: "queued"
    )
    user_two_notification = ReminderNotification.create!(
      occasion: occasions(:two),
      reminder_date: Date.current,
      channel: "email",
      status: "queued"
    )

    ReminderNotificationProcessor.process(limit: 10, user: users(:one))

    assert_not_equal "queued", user_one_notification.reload.status
    assert_equal "queued", user_two_notification.reload.status
  end
end
