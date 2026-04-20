class User < ApplicationRecord
  has_secure_password

  DEFAULT_REMINDER_DAYS_BEFORE = 14
  DEFAULT_REMINDER_ENABLED = true
  DEFAULT_REMINDER_FEED_WINDOW_DAYS = 60

  has_many :people, dependent: :destroy

  before_validation :normalize_email

  validates :name, presence: true
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :email, uniqueness: { case_sensitive: false }
  validates :password, length: { minimum: 8 }, if: -> { password.present? }
  validates :default_reminder_days_before, numericality: { greater_than_or_equal_to: 0, only_integer: true }
  validates :reminder_feed_window_days, numericality: { greater_than_or_equal_to: 1, less_than_or_equal_to: 365, only_integer: true }

  private

  def normalize_email
    self.email = email.to_s.strip.downcase.presence
  end
end
