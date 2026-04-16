module Api
  module V1
    class OccasionsController < BaseController
      def index
        occasions = Occasion.includes(:person).chronological

        render json: occasions.map { |occasion| occasion_payload(occasion) }
      end

      def upcoming
        limit = params.fetch(:limit, 10).to_i.clamp(1, 50)
        occasions = Occasion.includes(:person).upcoming.limit(limit)

        render json: occasions.map { |occasion| occasion_payload(occasion) }
      end

      def create
        occasion = Occasion.new(occasion_params)

        if occasion.save
          render json: occasion_payload(occasion), status: :created
        else
          render_validation_error(occasion)
        end
      end

      def update
        return if performed?

        if occasion.update(occasion_params)
          render json: occasion_payload(occasion)
        else
          render_validation_error(occasion)
        end
      end

      def destroy
        return if performed?

        occasion.destroy
        head :no_content
      end

      private

      def occasion
        @occasion ||= Occasion.includes(:person).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_not_found("Occasion")
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
    end
  end
end
