module Api
  module V1
    class PeopleController < BaseController
      def index
        people = Person.for_user(current_user).includes(:occasions, :gift_ideas).order(:name)

        render json: people.map { |person| person_payload(person) }
      end

      def show
        person_record = person
        return if performed?

        render json: person_payload(person_record)
      end

      def create
        person = current_user.people.new(person_params)

        if person.save
          render json: person_payload(person), status: :created
        else
          render_validation_error(person)
        end
      end

      def update
        person_record = person
        return if performed?

        if person_record.update(person_params)
          render json: person_payload(person_record)
        else
          render_validation_error(person_record)
        end
      end

      def destroy
        person_record = person
        return if performed?

        person_record.destroy
        head :no_content
      end

      private

      def person
        @person ||= Person.for_user(current_user).includes(:occasions, :gift_ideas).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_not_found("Person")
      end

      def person_params
        params.require(:person).permit(:name, :email, :relationship, :notes, :interests)
      end

      def person_payload(person)
        {
          id: person.id,
          name: person.name,
          email: person.email,
          relationship: person.relationship,
          notes: person.notes,
          interests: person.interests,
          created_at: person.created_at,
          updated_at: person.updated_at,
          occasions: person.occasions.chronological.map { |occasion| occasion_payload(occasion) },
          gift_ideas: person.gift_ideas.recent_first.map { |gift_idea| gift_idea_payload(gift_idea) }
        }
      end

      def occasion_payload(occasion)
        {
          id: occasion.id,
          person_id: occasion.person_id,
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

      def gift_idea_payload(gift_idea)
        {
          id: gift_idea.id,
          person_id: gift_idea.person_id,
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
