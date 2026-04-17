require "test_helper"

class ReminderNotificationMailerTest < ActionMailer::TestCase
  test "builds a reminder email" do
    email = ReminderNotificationMailer.reminder_email(reminder_notifications(:queued_today))

    assert_emails 1 do
      email.deliver_now
    end

    assert_equal [ "alex@example.com" ], email.to
    assert_equal [ "reminders@gift-tracker.local" ], email.from
    assert_equal "Gift reminder: Alex Birthday is coming up", email.subject
    assert_includes email.body.encoded, "Alex Johnson"
  end
end
