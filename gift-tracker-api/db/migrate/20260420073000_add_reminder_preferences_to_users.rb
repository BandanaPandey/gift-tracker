class AddReminderPreferencesToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :default_reminder_days_before, :integer, null: false, default: 14
    add_column :users, :default_reminder_enabled, :boolean, null: false, default: true
    add_column :users, :reminder_feed_window_days, :integer, null: false, default: 60
  end
end
