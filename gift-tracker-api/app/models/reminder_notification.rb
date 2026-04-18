class ReminderNotification < ApplicationRecord
  belongs_to :occasion

  CHANNELS = %w[email].freeze
  STATUSES = %w[queued sent failed skipped].freeze

  validates :channel, presence: true, inclusion: { in: CHANNELS }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :reminder_date, presence: true

  scope :recent_first, -> { order(created_at: :desc) }
  scope :queued, -> { where(status: "queued") }
  scope :for_user, ->(user) { joins(occasion: :person).where(people: { user_id: user.id }) }

  delegate :person, to: :occasion
  delegate :user, to: :person
end
