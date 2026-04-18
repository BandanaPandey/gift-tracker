require "test_helper"

class PersonTest < ActiveSupport::TestCase
  test "is valid with fixture data" do
    assert people(:one).valid?
  end

  test "requires a name" do
    person = Person.new(user: users(:one), relationship: "Friend")

    assert_not person.valid?
    assert_includes person.errors[:name], "can't be blank"
  end

  test "allows blank email but rejects invalid email" do
    assert people(:two).valid?

    people(:one).email = "not-an-email"

    assert_not people(:one).valid?
    assert_includes people(:one).errors[:email], "is invalid"
  end

  test "requires a user owner" do
    person = Person.new(name: "Ownerless")

    assert_not person.valid?
    assert_includes person.errors[:user], "must exist"
  end

  test "for_user scope only returns owned records" do
    assert_equal [people(:one)], Person.for_user(users(:one)).to_a
  end

  test "destroys dependent occasions and gift ideas" do
    person = people(:one)

    assert_difference("Occasion.count", -1) do
      assert_difference("GiftIdea.count", -1) do
        person.destroy
      end
    end
  end
end
