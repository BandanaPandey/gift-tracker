module Api
  module V1
    class GiftIdeasController < BaseController
      def index
        gift_ideas = GiftIdea.includes(:person).recent_first
        gift_ideas = gift_ideas.where(status: params[:status]) if params[:status].present?

        render json: gift_ideas.map { |gift_idea| gift_idea_payload(gift_idea) }
      end

      def create
        gift_idea = GiftIdea.new(gift_idea_params)

        if gift_idea.save
          render json: gift_idea_payload(gift_idea), status: :created
        else
          render_validation_error(gift_idea)
        end
      end

      def update
        return if performed?

        if gift_idea.update(gift_idea_params)
          render json: gift_idea_payload(gift_idea)
        else
          render_validation_error(gift_idea)
        end
      end

      def destroy
        return if performed?

        gift_idea.destroy
        head :no_content
      end

      private

      def gift_idea
        @gift_idea ||= GiftIdea.includes(:person).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_not_found("Gift idea")
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
