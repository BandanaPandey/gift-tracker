require "test_helper"

class ApiV1ReminderNotificationsFlowTest < ActionDispatch::IntegrationTest
  test "lists recent reminder notifications" do
    get "/api/v1/reminder_notifications"

    assert_response :success
    assert_equal 2, json_response.length
    assert_includes json_response.map { |entry| entry["person_name"] }, "Marcus Chen"
    assert_includes json_response.map { |entry| entry["person_name"] }, "Alex Johnson"
  end

  test "queues due reminders for a target date without duplicating existing notifications" do
    due_occasion = Occasion.create!(
      person: people(:one),
      kind: "custom",
      title: "Queue me",
      date: Date.current + 14.days,
      recurring_yearly: false,
      reminder_days_before: 14,
      reminder_enabled: true
    )

    assert_difference("ReminderNotification.count", 1) do
      post "/api/v1/reminder_notifications/queue", params: {
        target_date: Date.current.to_s
      }, as: :json
    end

    assert_response :created
    assert_equal "Queue me", json_response["notifications"].first["title"]

    assert_no_difference("ReminderNotification.count") do
      post "/api/v1/reminder_notifications/queue", params: {
        target_date: Date.current.to_s
      }, as: :json
    end

    assert_response :created
    assert_equal due_occasion.id, ReminderNotification.order(:created_at).last.occasion_id
  end
end
