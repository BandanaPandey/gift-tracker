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
end
