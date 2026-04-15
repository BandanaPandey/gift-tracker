class CreatePeople < ActiveRecord::Migration[8.1]
  def change
    create_table :people do |t|
      t.string :name, null: false
      t.string :relationship
      t.text :notes
      t.text :interests

      t.timestamps
    end

    add_index :people, :name
  end
end
