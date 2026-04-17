class Person < ApplicationRecord
  has_many :occasions, dependent: :destroy
  has_many :gift_ideas, dependent: :destroy

  validates :name, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }, allow_blank: true
end
