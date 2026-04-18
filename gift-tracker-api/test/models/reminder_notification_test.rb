require "test_helper"

class ReminderNotificationTest < ActiveSupport::TestCase
  test "is valid with fixture data" do
    assert reminder_notifications(:queued_today).valid?
  end

  test "requires a valid status" do
    notification = ReminderNotification.new(
      occasion: occasions(:one),
      reminder_date: Date.current,
      channel: "email",
      status: "processing"
    )

    assert_not notification.valid?
    assert_includes notification.errors[:status], "is not included in the list"
  end

  test "returns only queued notifications from queued scope" do
    assert_equal [ reminder_notifications(:queued_today) ], ReminderNotification.queued.to_a
  end

  test "for_user scope only returns owned notifications" do
    assert_equal [reminder_notifications(:queued_today)], ReminderNotification.for_user(users(:one)).to_a
  end
end
