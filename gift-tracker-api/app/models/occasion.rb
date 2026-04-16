class Occasion < ApplicationRecord
  belongs_to :person

  KINDS = %w[birthday anniversary holiday custom].freeze

  validates :title, :date, presence: true
  validates :kind, presence: true, inclusion: { in: KINDS }
  validates :reminder_days_before, numericality: { greater_than_or_equal_to: 0, only_integer: true }

  scope :chronological, -> { order(:date) }
  scope :upcoming, ->(from_date = Date.current) { where("date >= ?", from_date).order(:date) }
end
