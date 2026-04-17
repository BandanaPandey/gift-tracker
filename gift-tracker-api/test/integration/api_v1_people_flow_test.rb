require "test_helper"

class ApiV1PeopleFlowTest < ActionDispatch::IntegrationTest
  test "lists people with nested occasions and gift ideas" do
    get "/api/v1/people", headers: auth_headers_for(users(:one))

    assert_response :success

    payload = json_response
    assert_equal 1, payload.length
    assert_equal "Alex Johnson", payload.first["name"]
    assert_equal "alex@example.com", payload.first["email"]
    assert_equal "Alex Birthday", payload.first["occasions"].first["title"]
    assert_equal "Ceramic planter set", payload.first["gift_ideas"].first["title"]
  end

  test "shows a person" do
    get "/api/v1/people/#{people(:one).id}", headers: auth_headers_for(users(:one))

    assert_response :success
    assert_equal people(:one).id, json_response["id"]
  end

  test "creates a person" do
    assert_difference("Person.count", 1) do
      post "/api/v1/people", params: {
        person: {
          name: "Priya Shah",
          email: "priya@example.com",
          relationship: "Cousin",
          notes: "Loves self-care gifts",
          interests: "Skincare, tea"
        }
      }, as: :json, headers: auth_headers_for(users(:one))
    end

    assert_response :created
    assert_equal "Priya Shah", json_response["name"]
    assert_equal "priya@example.com", json_response["email"]
  end

  test "returns validation errors when creating an invalid person" do
    post "/api/v1/people", params: {
      person: {
        relationship: "Sibling"
      }
    }, as: :json, headers: auth_headers_for(users(:one))

    assert_response :unprocessable_entity
    assert_includes json_response["errors"], "Name can't be blank"
  end

  test "does not show another users person" do
    get "/api/v1/people/#{people(:two).id}", headers: auth_headers_for(users(:one))

    assert_response :not_found
  end
end
