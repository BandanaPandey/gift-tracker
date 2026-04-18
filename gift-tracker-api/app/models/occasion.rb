class Occasion < ApplicationRecord
  belongs_to :person
  has_many :reminder_notifications, dependent: :destroy

  KINDS = %w[birthday anniversary holiday custom].freeze

  validates :title, :date, presence: true
  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :reminder_days_before, numericality: { greater_than_or_equal_to: 0, only_integer: true }

  scope :chronological, -> { order(:date) }
  scope :upcoming, ->(from_date = Date.current) { where("date >= ?", from_date).order(:date) }
  scope :for_user, ->(user) { joins(:person).where(people: { user_id: user.id }) }

  delegate :user, to: :person

  def reminder_date
    date - reminder_days_before.days
  end

  def reminder_due_within?(window_days, from_date = Date.current)
    return false unless reminder_enabled?

    reminder_date <= (from_date + window_days.days)
  end

  def days_until_occurrence(from_date = Date.current)
    (date - from_date).to_i
  end

  def days_until_reminder(from_date = Date.current)
    (reminder_date - from_date).to_i
  end
end
