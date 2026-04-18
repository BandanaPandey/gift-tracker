module Api
  module V1
    class OccasionsController < BaseController
      def index
        occasions = Occasion.includes(:person)
          .for_user(current_user)
          .chronological

        render json: occasions.map { |occasion| occasion_payload(occasion) }
      end

      def upcoming
        limit = params.fetch(:limit, 10).to_i.clamp(1, 50)
        occasions = Occasion.includes(:person)
          .for_user(current_user)
          .upcoming
          .limit(limit)

        render json: occasions.map { |occasion| occasion_payload(occasion) }
      end

      def reminders
        window_days = params.fetch(:window_days, 30).to_i.clamp(1, 365)
        occasions = Occasion.includes(:person).for_user(current_user).upcoming.select do |occasion|
          occasion.reminder_due_within?(window_days)
        end

        render json: occasions
          .sort_by(&:reminder_date)
          .map { |occasion| reminder_payload(occasion) }
      end

      def create
        person_record = person
        return if performed?

        occasion = person_record.occasions.new(occasion_params.except(:person_id))

        if occasion.save
          render json: occasion_payload(occasion), status: :created
        else
          render_validation_error(occasion)
        end
      end

      def update
        occasion_record = occasion
        return if performed?

        if occasion_record.update(occasion_params)
          render json: occasion_payload(occasion_record)
        else
          render_validation_error(occasion_record)
        end
      end

      def destroy
        occasion_record = occasion
        return if performed?

        occasion_record.destroy
        head :no_content
      end

      private

      def occasion
        @occasion ||= Occasion.includes(:person).for_user(current_user).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_not_found("Occasion")
      end

      def person
        @person ||= Person.for_user(current_user).find(occasion_params[:person_id])
      rescue ActiveRecord::RecordNotFound
        render_not_found("Person")
      end

      def occasion_params
        params.require(:occasion).permit(
          :person_id,
          :kind,
          :title,
          :date,
          :recurring_yearly,
          :reminder_days_before,
          :reminder_enabled
        )
      end

      def occasion_payload(occasion)
        {
          id: occasion.id,
          person_id: occasion.person_id,
          person_name: occasion.person.name,
          kind: occasion.kind,
          title: occasion.title,
          date: occasion.date,
          recurring_yearly: occasion.recurring_yearly,
          reminder_days_before: occasion.reminder_days_before,
          reminder_enabled: occasion.reminder_enabled,
          created_at: occasion.created_at,
          updated_at: occasion.updated_at
        }
      end

      def reminder_payload(occasion)
        occasion_payload(occasion).merge(
          reminder_date: occasion.reminder_date,
          days_until_reminder: occasion.days_until_reminder,
          days_until_occurrence: occasion.days_until_occurrence
        )
      end
    end
  end
end
