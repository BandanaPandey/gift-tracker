class CreateOccasions < ActiveRecord::Migration[8.1]
  def change
    create_table :occasions do |t|
      t.references :person, null: false, foreign_key: true
      t.string :kind, null: false
      t.string :title, null: false
      t.date :date, null: false
      t.boolean :recurring_yearly, null: false, default: true

      t.timestamps
    end

    add_index :occasions, :date
  end
end
