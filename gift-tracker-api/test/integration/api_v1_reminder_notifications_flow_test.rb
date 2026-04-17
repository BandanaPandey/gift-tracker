require "test_helper"

class ApiV1ReminderNotificationsFlowTest < ActionDispatch::IntegrationTest
  setup do
    ActionMailer::Base.deliveries.clear
  end

  test "lists recent reminder notifications" do
    get "/api/v1/reminder_notifications", headers: auth_headers_for(users(:one))

    assert_response :success
    assert_equal 1, json_response.length
    assert_equal "Alex Johnson", json_response.first["person_name"]
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
      }, as: :json, headers: auth_headers_for(users(:one))
    end

    assert_response :created
    assert_equal "Queue me", json_response["notifications"].first["title"]

    assert_no_difference("ReminderNotification.count") do
      post "/api/v1/reminder_notifications/queue", params: {
        target_date: Date.current.to_s
      }, as: :json, headers: auth_headers_for(users(:one))
    end

    assert_response :created
    assert_equal due_occasion.id, ReminderNotification.order(:created_at).last.occasion_id
  end

  test "processes queued reminders and records sent or skipped results" do
    queue_notification = reminder_notifications(:queued_today)
    no_email_person = Person.create!(
      user: users(:one),
      name: "No Email Person",
      relationship: "Friend"
    )
    no_email_occasion = Occasion.create!(
      person: no_email_person,
      kind: "custom",
      title: "No Email Occasion",
      date: Date.current + 1.day,
      recurring_yearly: false,
      reminder_days_before: 1,
      reminder_enabled: true
    )

    skipped_notification = ReminderNotification.create!(
      occasion: no_email_occasion,
      reminder_date: Date.current,
      channel: "email",
      status: "queued"
    )

    assert_difference("ActionMailer::Base.deliveries.size", 1) do
      post "/api/v1/reminder_notifications/process", as: :json, headers: auth_headers_for(users(:one))
    end

    assert_response :success
    assert_equal 2, json_response["processed_count"]

    queue_notification.reload
    skipped_notification.reload

    assert_equal "sent", queue_notification.status
    assert_not_nil queue_notification.sent_at
    assert_equal "skipped", skipped_notification.status
    assert_equal "No email address set for No Email Person", skipped_notification.error_message
  end
end
