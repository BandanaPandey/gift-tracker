require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "is valid with fixture data" do
    assert users(:one).valid?
  end

  test "normalizes email before validation" do
    user = User.create!(
      name: "Priya Shah",
      email: " PRIYA@EXAMPLE.COM ",
      password: "password123",
      password_confirmation: "password123"
    )

    assert_equal "priya@example.com", user.email
  end

  test "requires unique email" do
    user = User.new(
      name: "Another Maya",
      email: users(:one).email.upcase,
      password: "password123",
      password_confirmation: "password123"
    )

    assert_not user.valid?
    assert_includes user.errors[:email], "has already been taken"
  end
end
