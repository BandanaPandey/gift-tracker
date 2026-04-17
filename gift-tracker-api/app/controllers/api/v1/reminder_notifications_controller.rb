module Api
  module V1
    class ReminderNotificationsController < BaseController
      def index
        notifications = ReminderNotification.includes(occasion: :person)
          .joins(occasion: :person)
          .where(people: { user_id: current_user.id })
          .recent_first
          .limit(limit)

        render json: notifications.map { |notification| notification_payload(notification) }
      end

      def queue
        target_date = params[:target_date].present? ? Date.parse(params[:target_date]) : Date.current
        notifications = ReminderNotificationScheduler.schedule_for(target_date, user: current_user)

        render json: {
          target_date: target_date,
          queued_count: notifications.count,
          notifications: notifications.map { |notification| notification_payload(notification) }
        }, status: :created
      rescue Date::Error
        render json: { errors: ["Target date is invalid"] }, status: :unprocessable_entity
      end

      def process_queue
        notifications = ReminderNotificationProcessor.process(limit: limit, user: current_user)

        render json: {
          processed_count: notifications.count,
          sent_count: notifications.count { |notification| notification.status == "sent" },
          skipped_count: notifications.count { |notification| notification.status == "skipped" },
          notifications: notifications.map { |notification| notification_payload(notification) }
        }
      end

      private

      def limit
        params.fetch(:limit, 12).to_i.clamp(1, 50)
      end

      def notification_payload(notification)
        {
          id: notification.id,
          occasion_id: notification.occasion_id,
          person_name: notification.person.name,
          title: notification.occasion.title,
          occasion_date: notification.occasion.date,
          reminder_date: notification.reminder_date,
          channel: notification.channel,
          status: notification.status,
          sent_at: notification.sent_at,
          error_message: notification.error_message,
          created_at: notification.created_at
        }
      end
    end
  end
end
