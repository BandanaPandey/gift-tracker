class ReminderNotificationMailer < ApplicationMailer
  def reminder_email(notification)
    @notification = notification
    @occasion = notification.occasion
    @person = @occasion.person

    mail(
      to: @person.email,
      subject: "Gift reminder: #{@occasion.title} is coming up"
    )
  end
end
