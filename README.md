# 🐐 Goat Farm Investment System

Complete web application for managing goat farm investments with role-based access (Admin, Investor, Farm Manager).

## System Architecture

### Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (Modules)
- **Backend**: Firebase Authentication + Firestore Database
- **Build Tool**: Vite

### User Roles

#### 👨‍💼 Admin
- Add new goats to inventory
- Approve/reject investor investments
- Record profit distributions
- View all users and investments
- Dashboard with system statistics

#### 💰 Investor
- Create new investments (minimum PKR 1000)
- View investment history and status
- Track profit earnings
- Request withdrawals
- View transaction history

#### 👨‍🌾 Farm Manager
- Update goat health status
- Manage goat inventory
- Track active investments
- Monitor farm operations

## Firestore Database Structure

### Collections

```
users/
├── uid (document ID)
├── email
├── name
├── role (admin, investor, manager)
├── status
├── investmentTotal
├── profitTotal
└── createdAt

investments/
├── id (auto)
├── userId
├── amount
├── status (pending, approved, active)
├── createdAt
├── approvedBy
└── approvedAt

goats/
├── id (auto)
├── breed
├── age
├── price
├── healthStatus (healthy, sick, recovering)
├── linkedInvestors[]
├── createdAt
├── lastUpdated
└── notes

profits/
├── id (auto)
├── investmentId
├── userId
├── totalProfit
├── investorShare (30%)
├── farmCost (30%)
├── adminProfit (40%)
└── distributedAt

withdrawals/
├── id (auto)
├── userId
├── amount
├── status (pending, approved, rejected)
├── requestedAt
└── approvedAt
```

## Profit Distribution System

When admin records profit:
- **Investor**: 30% of total profit
- **Farm Cost**: 30% of total profit
- **Admin Profit**: 40% of total profit

Example: If total profit is PKR 100,000:
- Investor gets: PKR 30,000
- Farm cost: PKR 30,000
- Admin gets: PKR 40,000

## File Structure

```
goatfarm/
├── index.html                 # Login page
├── admin.html                 # Admin dashboard
├── investor.html              # Investor dashboard
├── manager.html               # Farm manager dashboard
├── src/
│   ├── main.js               # Login logic & routing
│   ├── auth.js               # Authentication functions
│   ├── firestore-config.js   # Firebase initialization
│   ├── utils.js              # Business logic functions
│   ├── admin-dashboard.js    # Admin page logic
│   ├── investor-dashboard.js # Investor page logic
│   └── manager-dashboard.js  # Manager page logic
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies
└── public/                    # Static assets
```

## Features Implemented

✅ **Authentication**
- Firebase Auth with email/password
- Role-based access control
- Auto-redirect based on role

✅ **Investment System**
- Create investments
- Admin approval workflow
- Investment history tracking

✅ **Goat Management**
- Add goats to inventory
- Health status tracking
- Inventory management

✅ **Profit Distribution**
- Automatic profit calculation
- 30-30-40 distribution system
- Profit recording & tracking

✅ **Dashboards**
- Admin: Statistics, investments, goats, profit distribution
- Investor: Investments, profits, withdrawals
- Manager: Goat health, inventory, active investments

✅ **Data Management**
- Firestore integration
- Real-time data updates
- Transaction history

## How to Use

### 1. Signup (Investor)
- Go to http://localhost:5173/
- Fill in Name, Email, Password
- Click "Sign Up"
- You'll be automatically redirected to Investor Dashboard

### 2. Login (Admin/Investor)
- Go to http://localhost:5173/
- Enter Email & Password
- Click "Login"
- Dashboard loads based on your role

### 3. Admin Actions
- **Add Goat**: Fill breed, age, price, health status
- **Approve Investment**: Review pending investments and click "Approve"
- **Record Profit**: Select investment, enter total profit (auto-calculates distribution)

### 4. Investor Actions
- **Create Investment**: Enter amount and submit (minimum PKR 1000)
- **View Profits**: Check profit history and distribution breakdown
- **Request Withdrawal**: Enter amount and request (admin will process)

### 5. Farm Manager Actions
- **Update Health**: Select goat and update health status
- **Add Notes**: Document goat condition and treatment

## Setup Instructions

### Prerequisites
- Node.js installed
- Firebase project created
- Firebase credentials configured

### Installation
```bash
npm install
npm run dev
```

### Firebase Setup
1. Create Firestore Database in Firebase Console
2. Enable Authentication (Email/Password)
3. Update credentials in `src/firestore-config.js`

## API Functions

### Authentication (`auth.js`)
- `signup(email, password, name, role)`
- `login(email, password)`
- `logout()`
- `getCurrentUser()`
- `getUserRole(uid)`

### Business Logic (`utils.js`)
- `createInvestment(userId, amount)`
- `approveInvestment(investmentId, adminId)`
- `addGoat(breed, age, price, healthStatus)`
- `recordProfit(investmentId, userId, totalProfit)`
- `calculateProfitDistribution(totalProfit)`
- `getUserInvestments(userId)`
- `getAllGoats()`
- `createWithdrawal(userId, amount)`

## Future Enhancements

🔄 Planned features:
- Email notifications
- SMS alerts
- PDF reports
- Advanced analytics
- Mobile app
- Payment gateway integration
- Real-time profit updates
- Automated profit distribution

## Support

For issues or questions, check browser console for error messages and Firebase logs.

---

**System Status**: ✅ Fully Functional
**Last Updated**: May 10, 2026
