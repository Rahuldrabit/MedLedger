# EHR Blockchain System - Frontend

React frontend application for the blockchain-based Electronic Health Record system.

## Features

- 🔐 **JWT Authentication** - Secure login/logout
- 👤 **Patient Portal** - Upload EHR, manage consents, view records
- 👨‍⚕️ **Doctor Portal** - Access patient records with consent
- 👨‍💼 **Admin Portal** - System monitoring and audit logs
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Material-UI** - Modern, professional interface

## Tech Stack

- **Framework**: React 18
- **UI Library**: Material-UI 5
- **Routing**: React Router DOM 6
- **HTTP Client**: Axios
- **State Management**: Context API
- **Notifications**: Notistack
- **Charts**: Recharts
- **File Upload**: React Dropzone

## Installation

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at http://localhost:3001

## Environment Variables

Create a `.env` file:

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_NAME=EHR Blockchain System
REACT_APP_VERSION=1.0.0
```

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Layout.js           # Main layout with sidebar
│   │   └── PrivateRoute.js     # Protected route wrapper
│   ├── context/
│   │   └── AuthContext.js      # Authentication state
│   ├── pages/
│   │   ├── Auth/
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   ├── Patient/
│   │   │   ├── Dashboard.js
│   │   │   ├── Records.js
│   │   │   ├── Consents.js
│   │   │   └── UploadEHR.js
│   │   ├── Doctor/
│   │   │   ├── Dashboard.js
│   │   │   ├── Patients.js
│   │   │   └── Records.js
│   │   └── Admin/
│   │       ├── Dashboard.js
│   │       ├── Audit.js
│   │       └── Stats.js
│   ├── services/
│   │   └── api.js              # API service layer
│   ├── App.js                  # Main app component
│   └── index.js                # Entry point
└── package.json
```

## User Flows

### Patient Flow
1. Login → Dashboard
2. Upload EHR → File encrypted and stored on IPFS
3. Grant consent to doctor
4. View records and audit logs

### Doctor Flow
1. Login → Dashboard
2. View accessible patients
3. Request/view patient records (with consent)
4. Download encrypted files

### Admin Flow
1. Login → Dashboard
2. View system statistics
3. Browse audit logs
4. Monitor compliance

## Pages

### Authentication

#### Login (`/login`)
- User ID and password
- Demo account credentials
- Redirect based on role

#### Register (`/register`)
- User registration form
- Role selection (patient/doctor/admin)

### Patient Pages

#### Dashboard (`/patient`)
- Statistics cards
- Quick actions
- Recent activity

#### My Records (`/patient/records`)
- List all uploaded EHRs
- View details
- Access audit logs

#### Consents (`/patient/consents`)
- Grant doctor access
- View active consents
- Revoke access

#### Upload EHR (`/patient/upload`)
- Drag & drop file upload
- Record type input
- Automatic encryption

### Doctor Pages

#### Dashboard (`/doctor`)
- Patient list
- Recent accesses
- Consent status

#### Patients (`/doctor/patients`)
- All accessible patients
- Consent expiry info

#### Patient Records (`/doctor/patient/:id`)
- View patient's shared records
- Download encrypted files

### Admin Pages

#### Dashboard (`/admin`)
- System overview
- User statistics

#### Audit Logs (`/admin/audit`)
- All system actions
- Filter by user/action/record
- Export capability

#### Statistics (`/admin/stats`)
- Usage charts
- Success rate
- Action breakdown

## Components

### Layout
Responsive layout with:
- App bar with user menu
- Collapsible side drawer
- Role-based navigation menus

### PrivateRoute
Protected route wrapper:
- Checks authentication
- Enforces role-based access
- Redirects unauthorized users

## API Integration

All API calls go through `services/api.js`:

```javascript
// Example: Upload EHR
import { patientAPI } from './services/api';

const formData = new FormData();
formData.append('file', file);
formData.append('recordType', type);

const response = await patientAPI.uploadEHR(formData);
```

## State Management

Uses React Context API for global state:

- **AuthContext**: User authentication and authorization

## Building for Production

```bash
# Create production build
npm run build

# Serve build folder
serve -s build
```

Build output goes to `build/` directory.

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Formatting
```bash
npm run format
```

## Deployment

### Option 1: Static Hosting
Deploy `build/` folder to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

### Option 2: Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npx", "serve", "-s", "build", "-l", "3001"]
```

## Troubleshooting

### "Proxy error" on API calls
- Ensure backend is running on port 3000
- Check `proxy` in package.json

### Material-UI styles not loading
- Clear node_modules and reinstall
- Check emotion dependencies

### Build fails
- Check Node version (≥16)
- Delete node_modules and package-lock.json
- Run `npm install` again

## License

MIT
