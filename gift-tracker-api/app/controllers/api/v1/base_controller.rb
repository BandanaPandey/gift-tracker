module Api
  module V1
    class BaseController < ApplicationController
      private

      def render_not_found(resource_name)
        render json: { error: "#{resource_name} not found" }, status: :not_found
      end

      def render_validation_error(record)
        render json: { errors: record.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end
end
