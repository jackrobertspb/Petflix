# Environment Variables Template

Create a `.env` file in the project root with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration
JWT_SECRET=your-secure-random-jwt-secret-here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
```

## Notes
- Copy this template and create a `.env` file in the project root
- Replace placeholder values with your actual credentials
- Never commit the `.env` file to version control

