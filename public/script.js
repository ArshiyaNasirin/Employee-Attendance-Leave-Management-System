// Global variables
let currentUser = null;
let authToken = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

// Initialize application
function initializeApp() {
    // Check for existing token
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        showDashboard();
    } else {
        showLogin();
    }
    
    // Event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
        });
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Punch in/out buttons
    document.getElementById('punchInBtn').addEventListener('click', () => handlePunch('in'));
    document.getElementById('punchOutBtn').addEventListener('click', () => handlePunch('out'));
    
    // Leave request form
    document.getElementById('leaveRequestForm').addEventListener('submit', handleLeaveRequest);
    
    // Employee form
    document.getElementById('addEmployeeForm').addEventListener('submit', handleAddEmployee);
}

// Update current time
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString();
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// Show login screen
function showLogin() {
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('dashboardScreen').classList.remove('active');
}

// Show dashboard
function showDashboard() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('dashboardScreen').classList.add('active');
    
    // Update user info
    document.getElementById('userName').textContent = currentUser.name;
    
    // Show/hide admin elements
    if (currentUser.role === 'admin') {
        document.body.classList.add('admin');
    } else {
        document.body.classList.remove('admin');
    }
    
    // Load dashboard data
    loadDashboardData();
    loadAttendanceData();
    loadLeaveRequests();
    
    if (currentUser.role === 'admin') {
        loadEmployees();
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            
            // Store in localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showToast('Login successful!', 'success');
            showDashboard();
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle logout
function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showLogin();
    showToast('Logged out successfully', 'success');
}

// Show section
function showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        attendance: 'Attendance',
        leave: 'Leave Management',
        employees: 'Employee Management',
        reports: 'Reports & Analytics'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName];
    
    // Show section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}Section`).classList.add('active');
    
    // Load section-specific data
    if (sectionName === 'attendance') {
        loadAttendanceData();
    } else if (sectionName === 'leave') {
        loadLeaveRequests();
    } else if (sectionName === 'employees' && currentUser.role === 'admin') {
        loadEmployees();
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (currentUser.role === 'admin') {
                document.getElementById('totalEmployees').textContent = data.totalEmployees || 0;
                document.getElementById('presentToday').textContent = data.presentToday || 0;
                document.getElementById('pendingLeaves').textContent = data.pendingLeaves || 0;
                document.getElementById('avgHours').textContent = (data.avgHours || 0).toFixed(1);
            } else {
                document.getElementById('totalEmployees').textContent = data.daysPresent || 0;
                document.getElementById('presentToday').textContent = (data.totalHours || 0).toFixed(1);
                document.getElementById('pendingLeaves').textContent = data.pendingLeaves || 0;
                document.getElementById('avgHours').textContent = '0';
                
                // Update labels for employee view
                document.querySelector('.stat-card:nth-child(1) p').textContent = 'Days Present (30d)';
                document.querySelector('.stat-card:nth-child(2) p').textContent = 'Total Hours (30d)';
            }
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Handle punch in/out
async function handlePunch(type) {
    showLoading(true);
    
    try {
        const response = await fetch('/api/attendance/punch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ type })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(data.message, 'success');
            
            // Update button states
            if (type === 'in') {
                document.getElementById('punchInBtn').disabled = true;
                document.getElementById('punchOutBtn').disabled = false;
                document.getElementById('attendanceStatus').textContent = 'Punched In';
                document.getElementById('attendanceStatus').className = 'status-badge present';
            } else {
                document.getElementById('punchInBtn').disabled = false;
                document.getElementById('punchOutBtn').disabled = true;
                document.getElementById('attendanceStatus').textContent = 'Punched Out';
                document.getElementById('attendanceStatus').className = 'status-badge';
            }
            
            // Reload attendance data
            loadAttendanceData();
            loadDashboardData();
        } else {
            showToast(data.error || 'Operation failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Load attendance data
async function loadAttendanceData() {
    try {
        const response = await fetch('/api/attendance', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const tbody = document.getElementById('attendanceTable');
            tbody.innerHTML = '';
            
            data.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(record.date)}</td>
                    <td>${record.punch_in || '-'}</td>
                    <td>${record.punch_out || '-'}</td>
                    <td>${record.total_hours ? record.total_hours + ' hrs' : '-'}</td>
                    <td><span class="status-badge ${record.status}">${record.status}</span></td>
                `;
                tbody.appendChild(row);
            });
            
            // Check if user is currently punched in
            const today = new Date().toISOString().split('T')[0];
            const todayRecord = data.find(record => record.date === today);
            
            if (todayRecord && todayRecord.punch_in && !todayRecord.punch_out) {
                document.getElementById('punchInBtn').disabled = true;
                document.getElementById('punchOutBtn').disabled = false;
                document.getElementById('attendanceStatus').textContent = 'Punched In';
                document.getElementById('attendanceStatus').className = 'status-badge present';
            } else {
                document.getElementById('punchInBtn').disabled = false;
                document.getElementById('punchOutBtn').disabled = true;
                document.getElementById('attendanceStatus').textContent = 'Not Punched In';
                document.getElementById('attendanceStatus').className = 'status-badge';
            }
        }
    } catch (error) {
        console.error('Error loading attendance data:', error);
    }
}

// Show leave form
function showLeaveForm() {
    document.getElementById('leaveForm').style.display = 'block';
    document.getElementById('startDate').min = new Date().toISOString().split('T')[0];
    document.getElementById('endDate').min = new Date().toISOString().split('T')[0];
}

// Hide leave form
function hideLeaveForm() {
    document.getElementById('leaveForm').style.display = 'none';
    document.getElementById('leaveRequestForm').reset();
}

// Handle leave request
async function handleLeaveRequest(e) {
    e.preventDefault();
    
    const formData = {
        leave_type: document.getElementById('leaveType').value,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        reason: document.getElementById('leaveReason').value
    };
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/leave-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Leave request submitted successfully!', 'success');
            hideLeaveForm();
            loadLeaveRequests();
            loadDashboardData();
        } else {
            showToast(data.error || 'Failed to submit leave request', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Load leave requests
async function loadLeaveRequests() {
    try {
        const response = await fetch('/api/leave-requests', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const tbody = document.getElementById('leaveRequestsTable');
            tbody.innerHTML = '';
            
            data.forEach(request => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    ${currentUser.role === 'admin' ? `<td>${request.employee_name || 'N/A'}</td>` : ''}
                    <td>${request.leave_type}</td>
                    <td>${formatDate(request.start_date)}</td>
                    <td>${formatDate(request.end_date)}</td>
                    <td><span class="status-badge ${request.status}">${request.status}</span></td>
                    <td>${formatDate(request.applied_at)}</td>
                    ${currentUser.role === 'admin' ? `
                        <td>
                            ${request.status === 'pending' ? `
                                <button class="btn-secondary" onclick="updateLeaveStatus(${request.id}, 'approved')" style="background: #27ae60; margin-right: 5px;">Approve</button>
                                <button class="btn-secondary" onclick="updateLeaveStatus(${request.id}, 'rejected')" style="background: #e74c3c;">Reject</button>
                            ` : '-'}
                        </td>
                    ` : ''}
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading leave requests:', error);
    }
}

// Update leave status (Admin only)
async function updateLeaveStatus(requestId, status) {
    showLoading(true);
    
    try {
        const response = await fetch(`/api/leave-requests/${requestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast(`Leave request ${status} successfully!`, 'success');
            loadLeaveRequests();
            loadDashboardData();
        } else {
            showToast(data.error || 'Failed to update leave request', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Show employee form
function showEmployeeForm() {
    document.getElementById('employeeForm').style.display = 'block';
}

// Hide employee form
function hideEmployeeForm() {
    document.getElementById('employeeForm').style.display = 'none';
    document.getElementById('addEmployeeForm').reset();
}

// Handle add employee
async function handleAddEmployee(e) {
    e.preventDefault();
    
    const formData = {
        employee_id: document.getElementById('employeeId').value,
        name: document.getElementById('employeeName').value,
        email: document.getElementById('employeeEmail').value,
        department: document.getElementById('employeeDepartment').value,
        password: document.getElementById('employeePassword').value
    };
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Employee added successfully!', 'success');
            hideEmployeeForm();
            loadEmployees();
            loadDashboardData();
        } else {
            showToast(data.error || 'Failed to add employee', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Load employees (Admin only)
async function loadEmployees() {
    try {
        const response = await fetch('/api/employees', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const tbody = document.getElementById('employeesTable');
            tbody.innerHTML = '';
            
            data.forEach(employee => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${employee.employee_id}</td>
                    <td>${employee.name}</td>
                    <td>${employee.email}</td>
                    <td>${employee.department}</td>
                    <td>${formatDate(employee.created_at)}</td>
                    <td>
                        <button class="btn-secondary" style="background: #3498db;">View</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Add some demo activity data
function loadRecentActivity() {
    const activities = [
        { icon: 'clock', title: 'Punched In', time: '9:00 AM' },
        { icon: 'calendar', title: 'Leave Request Submitted', time: 'Yesterday' },
        { icon: 'user-check', title: 'Attendance Marked', time: '2 days ago' }
    ];
    
    const container = document.getElementById('recentActivity');
    container.innerHTML = '';
    
    activities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.time}</p>
            </div>
        `;
        container.appendChild(item);
    });
}

// Load recent activity when dashboard loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadRecentActivity, 1000);
});