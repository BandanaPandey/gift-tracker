class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAILER_FROM_EMAIL", "reminders@gift-tracker.local")
  layout "mailer"
end
