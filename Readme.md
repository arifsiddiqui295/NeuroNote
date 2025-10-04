git clone https://github.com/arifsiddiqui295/NeuroNote.git
cd NeuroNote


# Navigate to the server directory
cd server

# Install dependencies
npm install

# Create a .env file in the /server directory and add the following:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_strong_secret_key_of_your_choice
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Start the backend server
npm start


# Navigate to the client directory from the root
cd client

# Install dependencies
npm install

# Create a .env file in the /client directory and add the following:
VITE_API_URL=http://localhost:5000

# Start the frontend development server
npm run dev