class AddReminderFieldsToOccasions < ActiveRecord::Migration[8.1]
  def change
    add_column :occasions, :reminder_days_before, :integer, null: false, default: 14
    add_column :occasions, :reminder_enabled, :boolean, null: false, default: true
  end
end
