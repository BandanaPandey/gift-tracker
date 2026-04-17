class ReminderNotification < ApplicationRecord
  belongs_to :occasion

  CHANNELS = %w[email].freeze
  STATUSES = %w[queued sent failed skipped].freeze

  validates :channel, presence: true, inclusion: { in: CHANNELS }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :reminder_date, presence: true

  scope :recent_first, -> { order(created_at: :desc) }
  scope :queued, -> { where(status: "queued") }

  delegate :person, to: :occasion
end
