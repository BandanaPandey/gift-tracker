namespace :reminders do
  desc "Queue and process reminder emails for the target date"
  task run_daily: :environment do
    target_date = ENV["TARGET_DATE"].present? ? Date.parse(ENV["TARGET_DATE"]) : Date.current
    limit = ENV.fetch("REMINDER_PROCESS_LIMIT", 25).to_i

    result = ReminderDeliveryRunner.run(target_date: target_date, limit: limit)

    puts "Reminder cycle complete for #{result[:target_date]}"
    puts "Queued: #{result[:queued_count]}"
    puts "Processed: #{result[:processed_count]}"
    puts "Sent: #{result[:sent_count]}"
    puts "Skipped: #{result[:skipped_count]}"
    puts "Failed: #{result[:failed_count]}"
  end
end
