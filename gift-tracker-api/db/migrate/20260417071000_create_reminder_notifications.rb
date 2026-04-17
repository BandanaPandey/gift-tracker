class CreateReminderNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :reminder_notifications do |t|
      t.references :occasion, null: false, foreign_key: true
      t.date :reminder_date, null: false
      t.string :channel, null: false, default: "email"
      t.string :status, null: false, default: "queued"
      t.datetime :sent_at
      t.text :error_message

      t.timestamps
    end

    add_index :reminder_notifications, [:occasion_id, :reminder_date, :channel],
      unique: true,
      name: "index_reminder_notifications_uniqueness"
  end
end
