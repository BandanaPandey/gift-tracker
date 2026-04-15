class GiftIdea < ApplicationRecord
  belongs_to :person

  STATUSES = %w[idea considering bought given archived].freeze

  validates :title, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :price_cents, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :recent_first, -> { order(created_at: :desc) }
end
