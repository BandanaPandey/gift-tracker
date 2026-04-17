module Api
  module V1
    class GiftIdeasController < BaseController
      def index
        gift_ideas = GiftIdea.includes(:person)
          .joins(:person)
          .where(people: { user_id: current_user.id })
          .recent_first
        gift_ideas = gift_ideas.where(status: params[:status]) if params[:status].present?

        render json: gift_ideas.map { |gift_idea| gift_idea_payload(gift_idea) }
      end

      def create
        person_record = person
        return if performed?

        gift_idea = person_record.gift_ideas.new(gift_idea_params.except(:person_id))

        if gift_idea.save
          render json: gift_idea_payload(gift_idea), status: :created
        else
          render_validation_error(gift_idea)
        end
      end

      def update
        gift_idea_record = gift_idea
        return if performed?

        if gift_idea_record.update(gift_idea_params)
          render json: gift_idea_payload(gift_idea_record)
        else
          render_validation_error(gift_idea_record)
        end
      end

      def destroy
        gift_idea_record = gift_idea
        return if performed?

        gift_idea_record.destroy
        head :no_content
      end

      private

      def gift_idea
        @gift_idea ||= GiftIdea.includes(:person).joins(:person).where(people: { user_id: current_user.id }).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_not_found("Gift idea")
      end

      def person
        @person ||= current_user.people.find(gift_idea_params[:person_id])
      rescue ActiveRecord::RecordNotFound
        render_not_found("Person")
      end

      def gift_idea_params
        params.require(:gift_idea).permit(:person_id, :title, :url, :price_cents, :notes, :status)
      end

      def gift_idea_payload(gift_idea)
        {
          id: gift_idea.id,
          person_id: gift_idea.person_id,
          person_name: gift_idea.person.name,
          title: gift_idea.title,
          url: gift_idea.url,
          price_cents: gift_idea.price_cents,
          notes: gift_idea.notes,
          status: gift_idea.status,
          created_at: gift_idea.created_at,
          updated_at: gift_idea.updated_at
        }
      end
    end
  end
end
