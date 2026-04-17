require "test_helper"

class OccasionTest < ActiveSupport::TestCase
  test "is valid with fixture data" do
    assert occasions(:one).valid?
  end

  test "requires an allowed kind" do
    occasion = Occasion.new(
      person: people(:one),
      kind: "graduation",
      title: "Graduation party",
      date: Date.new(2099, 5, 1)
    )

    assert_not occasion.valid?
    assert_includes occasion.errors[:kind], "is not included in the list"
  end

  test "requires a non-negative reminder lead time" do
    occasion = Occasion.new(
      person: people(:one),
      kind: "birthday",
      title: "Invalid reminder",
      date: Date.new(2099, 5, 1),
      reminder_days_before: -1
    )

    assert_not occasion.valid?
    assert_includes occasion.errors[:reminder_days_before], "must be greater than or equal to 0"
  end

  test "upcoming scope only returns future occasions ordered by date" do
    past_occasion = Occasion.create!(
      person: people(:one),
      kind: "custom",
      title: "Past occasion",
      date: Date.current - 2.days,
      recurring_yearly: false
    )
    later_occasion = Occasion.create!(
      person: people(:one),
      kind: "custom",
      title: "Later occasion",
      date: Date.current + 5.days,
      recurring_yearly: false
    )
    sooner_occasion = Occasion.create!(
      person: people(:two),
      kind: "custom",
      title: "Sooner occasion",
      date: Date.current + 1.day,
      recurring_yearly: false
    )

    results = Occasion.upcoming.to_a

    assert_not_includes results, past_occasion
    assert_equal [sooner_occasion, later_occasion], results.first(2)
  end

  test "calculates reminder date and days remaining" do
    travel_date = Date.current + 20.days
    occasion = Occasion.new(
      person: people(:one),
      kind: "custom",
      title: "Trip planning",
      date: travel_date,
      reminder_days_before: 7,
      reminder_enabled: true
    )

    assert_equal travel_date - 7.days, occasion.reminder_date
    assert_equal 13, occasion.days_until_reminder
    assert_equal 20, occasion.days_until_occurrence
  end
end
