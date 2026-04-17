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
  end

  test "returns current user for a valid token" do
    get "/api/v1/auth/me", headers: auth_headers_for(users(:one))

    assert_response :success
    assert_equal users(:one).email, json_response["user"]["email"]
  end

  test "rejects current user request without token" do
    get "/api/v1/auth/me"

    assert_response :unauthorized
  end
end
