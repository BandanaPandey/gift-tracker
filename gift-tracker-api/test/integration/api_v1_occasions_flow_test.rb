require "test_helper"

class ApiV1OccasionsFlowTest < ActionDispatch::IntegrationTest
  test "lists occasions in chronological order" do
    get "/api/v1/occasions", headers: auth_headers_for(users(:one))

    assert_response :success
    assert_equal "Alex Birthday", json_response.first["title"]
    assert_equal 21, json_response.first["reminder_days_before"]
  end

  test "lists upcoming occasions with a limit" do
    get "/api/v1/occasions/upcoming", params: { limit: 1 }, headers: auth_headers_for(users(:one))

    assert_response :success
    assert_equal 1, json_response.length
    assert_equal "Alex Birthday", json_response.first["title"]
  end

  test "lists reminder feed entries within the requested window" do
    Occasion.create!(
      person: people(:one),
      kind: "custom",
      title: "Reminder test occasion",
      date: Date.current + 20.days,
      recurring_yearly: false,
      reminder_days_before: 7,
      reminder_enabled: true
    )

    get "/api/v1/occasions/reminders", params: { window_days: 30 }, headers: auth_headers_for(users(:one))

    assert_response :success
    assert_equal "Reminder test occasion", json_response.first["title"]
    assert_equal 7, json_response.first["reminder_days_before"]
    assert json_response.first.key?("reminder_date")
  end

  test "creates an occasion" do
    assert_difference("Occasion.count", 1) do
      post "/api/v1/occasions", params: {
        occasion: {
          person_id: people(:one).id,
          kind: "custom",
          title: "Graduation celebration",
          date: "2099-09-01",
          recurring_yearly: false,
          reminder_days_before: 30,
          reminder_enabled: true
        }
      }, as: :json, headers: auth_headers_for(users(:one))
    end

    assert_response :created
    assert_equal "Graduation celebration", json_response["title"]
    assert_equal 30, json_response["reminder_days_before"]
  end

  test "returns validation errors when creating an invalid occasion" do
    post "/api/v1/occasions", params: {
      occasion: {
        person_id: people(:one).id,
        kind: "invalid-kind",
        title: "",
        date: nil
      }
    }, as: :json, headers: auth_headers_for(users(:one))

    assert_response :unprocessable_entity
    assert_includes json_response["errors"], "Kind is not included in the list"
  end

  test "does not create an occasion for another users person" do
    post "/api/v1/occasions", params: {
      occasion: {
        person_id: people(:two).id,
        kind: "birthday",
        title: "Blocked",
        date: "2099-01-01"
      }
    }, as: :json, headers: auth_headers_for(users(:one))

    assert_response :not_found
  end
end
