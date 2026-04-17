module Api
  module V1
    class AuthController < ApplicationController
      before_action :authenticate_user!, only: :me

      def signup
        user = User.new(signup_params)

        if user.save
          render json: auth_payload(user), status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def login
        user = User.find_by(email: login_params[:email].to_s.strip.downcase)

        if user&.authenticate(login_params[:password])
          render json: auth_payload(user)
        else
          render json: { error: "Email or password is invalid" }, status: :unauthorized
        end
      end

      def me
        render json: { user: user_payload(current_user) }
      end

      private

      def signup_params
        params.require(:user).permit(:name, :email, :password, :password_confirmation)
      end

      def login_params
        params.require(:session).permit(:email, :password)
      end

      def auth_payload(user)
        {
          token: AuthToken.issue_for(user),
          user: user_payload(user)
        }
      end

      def user_payload(user)
        {
          id: user.id,
          name: user.name,
          email: user.email
        }
      end
    end
  end
end
