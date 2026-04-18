class BackfillAndEnforcePeopleUserId < ActiveRecord::Migration[8.1]
  class MigrationUser < ApplicationRecord
    self.table_name = "users"

    has_many :people, class_name: "BackfillAndEnforcePeopleUserId::MigrationPerson", foreign_key: :user_id
  end

  class MigrationPerson < ApplicationRecord
    self.table_name = "people"

    belongs_to :user, class_name: "BackfillAndEnforcePeopleUserId::MigrationUser", optional: true
  end

  def up
    legacy_user = MigrationUser.find_or_create_by!(email: "legacy-import@gift-tracker.local") do |user|
      user.name = "Legacy Imported Data"
      user.password_digest = BCrypt::Password.create(SecureRandom.base58(24))
    end

    MigrationPerson.where(user_id: nil).update_all(user_id: legacy_user.id)

    change_column_null :people, :user_id, false
  end

  def down
    change_column_null :people, :user_id, true
  end
end
