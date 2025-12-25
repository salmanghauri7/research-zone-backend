# 1. Use the lightweight alpine image
FROM node:20-alpine

# 2. Use /app as the working directory (Standard practice)
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install production dependencies
RUN npm install --production

# 5. Copy everything from your local NODE-BACKEND to /app
COPY . .

# 6. Expose your port
EXPOSE 5000

# 7. CRITICAL FIX: Point to the actual location of server.js
# Since server.js is inside the src folder, we call it like this:
CMD ["node", "src/server.js"]