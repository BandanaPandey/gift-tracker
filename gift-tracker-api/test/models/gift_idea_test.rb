require "test_helper"

class GiftIdeaTest < ActiveSupport::TestCase
  test "is valid with fixture data" do
    assert gift_ideas(:one).valid?
  end

  test "requires an allowed status" do
    gift_idea = GiftIdea.new(
      person: people(:one),
      title: "Mystery box",
      status: "pending"
    )

    assert_not gift_idea.valid?
    assert_includes gift_idea.errors[:status], "is not included in the list"
  end

  test "requires a non-negative price when present" do
    gift_idea = GiftIdea.new(
      person: people(:one),
      title: "Negative price gift",
      status: "idea",
      price_cents: -5
    )

    assert_not gift_idea.valid?
    assert_includes gift_idea.errors[:price_cents], "must be greater than or equal to 0"
  end

  test "for_user scope only returns owned gift ideas" do
    assert_equal [gift_ideas(:one)], GiftIdea.for_user(users(:one)).to_a
  end
end
