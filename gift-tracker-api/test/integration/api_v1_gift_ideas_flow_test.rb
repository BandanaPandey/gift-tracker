require "test_helper"

class ApiV1GiftIdeasFlowTest < ActionDispatch::IntegrationTest
  test "lists gift ideas and can filter by status" do
    get "/api/v1/gift_ideas", params: { status: "idea" }, headers: auth_headers_for(users(:one))

    assert_response :success
    assert_equal 1, json_response.length
    assert_equal "Ceramic planter set", json_response.first["title"]
  end

  test "creates a gift idea" do
    assert_difference("GiftIdea.count", 1) do
      post "/api/v1/gift_ideas", params: {
        gift_idea: {
          person_id: people(:one).id,
          title: "Weekend getaway voucher",
          url: "https://example.com/getaway",
          price_cents: 12000,
          notes: "Could split cost with friends",
          status: "considering"
        }
      }, as: :json, headers: auth_headers_for(users(:one))
    end

    assert_response :created
    assert_equal "considering", json_response["status"]
  end

  test "updates a gift idea" do
    patch "/api/v1/gift_ideas/#{gift_ideas(:one).id}", params: {
      gift_idea: {
        status: "bought"
      }
    }, as: :json, headers: auth_headers_for(users(:one))

    assert_response :success
    assert_equal "bought", json_response["status"]
    assert_equal "bought", gift_ideas(:one).reload.status
  end

  test "returns validation errors when creating an invalid gift idea" do
    post "/api/v1/gift_ideas", params: {
      gift_idea: {
        person_id: people(:one).id,
        title: "",
        status: "unknown"
      }
    }, as: :json, headers: auth_headers_for(users(:one))

    assert_response :unprocessable_entity
    assert_includes json_response["errors"], "Title can't be blank"
  end

  test "does not update another users gift idea" do
    patch "/api/v1/gift_ideas/#{gift_ideas(:two).id}", params: {
      gift_idea: {
        status: "archived"
      }
    }, as: :json, headers: auth_headers_for(users(:one))

    assert_response :not_found
  end
end
