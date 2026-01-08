# Employee Attendance & Leave Management System

A modern, full-stack web application for managing employee attendance and leave requests with role-based access control.

## 🚀 Features

### For Employees:
- **Attendance Tracking**: Punch in/out with automatic time calculation
- **Leave Management**: Submit leave requests with different types
- **Personal Dashboard**: View attendance history and leave status
- **Real-time Updates**: Live clock and status updates

### For Administrators:
- **Employee Management**: Add and manage employee accounts
- **Attendance Monitoring**: View all employee attendance records
- **Leave Approval**: Approve or reject leave requests
- **Analytics Dashboard**: View comprehensive statistics and reports

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js with Express.js
- **Database**: SQLite (for easy local setup)
- **Authentication**: JWT (JSON Web Tokens)
- **UI/UX**: Modern responsive design with CSS Grid/Flexbox

## 📦 Installation & Setup

1. **Clone or Download** the project to your local machine

2. **Navigate to the project directory**:
   ```bash
   cd "employement attendance and leave management system"
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

## 🔐 Default Login Credentials

### Administrator Account:
- **Email**: admin@company.com
- **Password**: admin123

### Demo Employee Account:
You can create employee accounts through the admin panel after logging in as admin.

## 📱 Usage Guide

### Getting Started:
1. Open the application in your web browser
2. Log in using the admin credentials
3. Create employee accounts from the "Employee Management" section
4. Employees can then log in and start using the system

### Key Features:

#### Attendance Management:
- Click "Punch In" to start your workday
- Click "Punch Out" to end your workday
- View your attendance history in the Attendance section

#### Leave Requests:
- Navigate to "Leave Management"
- Click "New Leave Request"
- Fill in the details and submit
- Track the status of your requests

#### Admin Functions:
- Manage all employees from the "Employees" section
- View and approve/reject leave requests
- Monitor attendance across the organization
- Access analytics and reports

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface with gradient backgrounds
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Interactive Elements**: Smooth animations and hover effects
- **Real-time Updates**: Live clock and status indicators
- **Toast Notifications**: User-friendly success/error messages
- **Loading States**: Visual feedback during operations

## 🗄 Database Schema

The application automatically creates the following tables:

### Users Table:
- Employee information and authentication
- Role-based access (admin/employee)
- Department and contact details

### Attendance Table:
- Daily punch in/out records
- Automatic calculation of work hours
- Attendance status tracking

### Leave Requests Table:
- Leave applications with types and dates
- Approval workflow management
- Request history and status

## 🔧 Configuration

### Environment Variables:
You can modify the following in `server.js`:
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: JWT signing secret
- Database file location

### Customization:
- **Styling**: Modify `public/styles.css` for UI changes
- **Features**: Add new functionality in `public/script.js`
- **API**: Extend backend routes in `server.js`

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (HTML/CSS/JS) │◄──►│   (Node.js)     │◄──►│   (SQLite)      │
│                 │    │   Express API   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Deployment

For production deployment:

1. **Environment Setup**:
   - Set production environment variables
   - Configure proper JWT secrets
   - Set up SSL certificates

2. **Database**:
   - Consider migrating to PostgreSQL/MySQL for production
   - Set up proper backup strategies

3. **Security**:
   - Implement rate limiting
   - Add input validation
   - Set up proper CORS policies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Ensure all dependencies are installed
3. Verify the server is running on the correct port
4. Check database permissions

## 🔮 Future Enhancements

- **Mobile App**: React Native/Flutter mobile application
- **Advanced Analytics**: Charts and detailed reporting
- **Notifications**: Email/SMS notifications for leave approvals
- **Biometric Integration**: Fingerprint/face recognition for attendance
- **Shift Management**: Support for different work shifts
- **Payroll Integration**: Connect with payroll systems
- **API Documentation**: Swagger/OpenAPI documentation

---

**Developed with ❤️ for modern workforce management**