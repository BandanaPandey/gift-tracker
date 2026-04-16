# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_04_16_071000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "gift_ideas", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "notes"
    t.bigint "person_id", null: false
    t.integer "price_cents"
    t.string "status", default: "idea", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.string "url"
    t.index ["person_id"], name: "index_gift_ideas_on_person_id"
    t.index ["status"], name: "index_gift_ideas_on_status"
  end

  create_table "occasions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.string "kind", null: false
    t.bigint "person_id", null: false
    t.boolean "recurring_yearly", default: true, null: false
    t.integer "reminder_days_before", default: 14, null: false
    t.boolean "reminder_enabled", default: true, null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_occasions_on_date"
    t.index ["person_id"], name: "index_occasions_on_person_id"
  end

  create_table "people", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "interests"
    t.string "name", null: false
    t.text "notes"
    t.string "relationship"
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_people_on_name"
  end

  add_foreign_key "gift_ideas", "people"
  add_foreign_key "occasions", "people"
end
