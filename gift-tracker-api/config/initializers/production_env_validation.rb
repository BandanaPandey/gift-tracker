if Rails.env.production?
  required_env_vars = %w[
    DATABASE_URL
    FRONTEND_APP_URL
    APP_HOST
    MAILER_FROM_EMAIL
    SMTP_ADDRESS
  ]

  missing_env_vars = required_env_vars.select { |key| ENV[key].blank? }

  if missing_env_vars.any?
    raise "Missing required production environment variables: #{missing_env_vars.join(', ')}"
  end
end
