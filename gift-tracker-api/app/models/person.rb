class Person < ApplicationRecord
  has_many :occasions, dependent: :destroy
  has_many :gift_ideas, dependent: :destroy

  validates :name, presence: true
end
