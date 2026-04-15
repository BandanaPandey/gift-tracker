require "test_helper"

class ApiV1OccasionsFlowTest < ActionDispatch::IntegrationTest
  test "lists occasions in chronological order" do
    get "/api/v1/occasions"

    assert_response :success
    assert_equal "Alex Birthday", json_response.first["title"]
  end

  test "lists upcoming occasions with a limit" do
    get "/api/v1/occasions/upcoming", params: { limit: 1 }

    assert_response :success
    assert_equal 1, json_response.length
    assert_equal "Alex Birthday", json_response.first["title"]
  end

  test "creates an occasion" do
    assert_difference("Occasion.count", 1) do
      post "/api/v1/occasions", params: {
        occasion: {
          person_id: people(:one).id,
          kind: "custom",
          title: "Graduation celebration",
          date: "2099-09-01",
          recurring_yearly: false
        }
      }, as: :json
    end

    assert_response :created
    assert_equal "Graduation celebration", json_response["title"]
  end

  test "returns validation errors when creating an invalid occasion" do
    post "/api/v1/occasions", params: {
      occasion: {
        person_id: people(:one).id,
        kind: "invalid-kind",
        title: "",
        date: nil
      }
    }, as: :json

    assert_response :unprocessable_entity
    assert_includes json_response["errors"], "Kind is not included in the list"
  end
end
