require "test_helper"

class RunDailyReminderCycleJobTest < ActiveJob::TestCase
  setup do
    ActionMailer::Base.deliveries.clear
    reminder_notifications(:queued_today).update!(status: "sent", sent_at: Time.current)
  end

  test "queues and processes due reminders for a target date" do
    person = Person.create!(
      name: "Aarav Mehta",
      email: "aarav@example.com",
      relationship: "Friend"
    )
    occasion = Occasion.create!(
      person: person,
      kind: "birthday",
      title: "Aarav Birthday",
      date: Date.current + 7.days,
      recurring_yearly: false,
      reminder_days_before: 7,
      reminder_enabled: true
    )

    result = RunDailyReminderCycleJob.perform_now(Date.current, limit: 10)

    assert_equal Date.current, result[:target_date]
    assert_equal 1, result[:queued_count]
    assert_equal 1, result[:processed_count]
    assert_equal 1, result[:sent_count]
    assert_equal 0, result[:skipped_count]
    assert_equal 1, ActionMailer::Base.deliveries.size

    notification = ReminderNotification.find_by!(occasion: occasion)
    assert_equal "sent", notification.status
    assert_not_nil notification.sent_at
  end
end
