require "test_helper"

class ApiV1PeopleFlowTest < ActionDispatch::IntegrationTest
  test "lists people with nested occasions and gift ideas" do
    get "/api/v1/people"

    assert_response :success

    payload = json_response
    assert_equal 2, payload.length
    assert_equal "Alex Johnson", payload.first["name"]
    assert_equal "Alex Birthday", payload.first["occasions"].first["title"]
    assert_equal "Ceramic planter set", payload.first["gift_ideas"].first["title"]
  end

  test "shows a person" do
    get "/api/v1/people/#{people(:one).id}"

    assert_response :success
    assert_equal people(:one).id, json_response["id"]
  end

  test "creates a person" do
    assert_difference("Person.count", 1) do
      post "/api/v1/people", params: {
        person: {
          name: "Priya Shah",
          relationship: "Cousin",
          notes: "Loves self-care gifts",
          interests: "Skincare, tea"
        }
      }, as: :json
    end

    assert_response :created
    assert_equal "Priya Shah", json_response["name"]
  end

  test "returns validation errors when creating an invalid person" do
    post "/api/v1/people", params: {
      person: {
        relationship: "Sibling"
      }
    }, as: :json

    assert_response :unprocessable_entity
    assert_includes json_response["errors"], "Name can't be blank"
  end
end
