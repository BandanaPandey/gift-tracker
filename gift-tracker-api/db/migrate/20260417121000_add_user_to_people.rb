class AddUserToPeople < ActiveRecord::Migration[8.1]
  def change
    add_reference :people, :user, foreign_key: true
    add_index :people, [ :user_id, :name ]
  end
end
