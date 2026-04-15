class CreateGiftIdeas < ActiveRecord::Migration[8.1]
  def change
    create_table :gift_ideas do |t|
      t.references :person, null: false, foreign_key: true
      t.string :title, null: false
      t.string :url
      t.integer :price_cents
      t.text :notes
      t.string :status, null: false, default: "idea"

      t.timestamps
    end

    add_index :gift_ideas, :status
  end
end
