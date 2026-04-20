require "test_helper"

class ApiV1AuthFlowTest < ActionDispatch::IntegrationTest
  test "signs up a new user" do
    assert_difference("User.count", 1) do
      post "/api/v1/auth/signup", params: {
        user: {
          name: "Priya Shah",
          email: "priya@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      }, as: :json
    end

    assert_response :created
    assert json_response["token"].present?
    assert_equal "Priya Shah", json_response["user"]["name"]
    assert_equal 14, json_response["user"]["default_reminder_days_before"]
    assert_equal true, json_response["user"]["default_reminder_enabled"]
    assert_equal 60, json_response["user"]["reminder_feed_window_days"]
  end

  test "logs in an existing user" do
    post "/api/v1/auth/login", params: {
      session: {
        email: users(:one).email,
        password: "password123"
      }
    }, as: :json

    assert_response :success
    assert json_response["token"].present?
    assert_equal users(:one).email, json_response["user"]["email"]
    assert_equal 14, json_response["user"]["default_reminder_days_before"]
  end

  test "returns current user for a valid token" do
    get "/api/v1/auth/me", headers: auth_headers_for(users(:one))

    assert_response :success
    assert_equal users(:one).email, json_response["user"]["email"]
    assert_equal 60, json_response["user"]["reminder_feed_window_days"]
  end

  test "updates reminder preferences for current user" do
    patch "/api/v1/auth/me", params: {
      user: {
        default_reminder_days_before: 30,
        default_reminder_enabled: false,
        reminder_feed_window_days: 120
      }
    }, as: :json, headers: auth_headers_for(users(:one))

    assert_response :success
    assert_equal 30, json_response["user"]["default_reminder_days_before"]
    assert_equal false, json_response["user"]["default_reminder_enabled"]
    assert_equal 120, json_response["user"]["reminder_feed_window_days"]
    assert_equal 30, users(:one).reload.default_reminder_days_before
  end

  test "rejects current user request without token" do
    get "/api/v1/auth/me"

    assert_response :unauthorized
  end
end
