# ⛽ Ceypetco Fuel:X – Fuel Station Management System

Ceypetco Fuel:X is a responsive, modern fuel station management web application designed to replace manual logbooks with a digital solution. It supports user login, summary reporting, employee tracking, and daily fuel operations.

> 💻 Developed using **React.js** | 🚀 Deployed via **GitHub** + optional Vercel/Netlify  
> 🎯 Goal: To improve data accuracy, reduce human error, and streamline operations for Ceypetco stations.

---

## 📌 Features

- 🔐 User Login & Signup with validation
- 🗓️ Daily, Monthly, and Yearly Summary Records
- 💰 Income & Expense Entry Module
- 🧾 Employee Attendance and Salary Calculation
- 📊 Modern UI with responsive design
- 💾 LocalStorage used to mock login authentication

---

## 📂 Folder Structure

CeypetcoWeb/
├── public/
│ └── index.html
├── src/
│ ├── Pages/
│ │ ├── Browserdetails/
| | |── DailyDetails/
| | ├── EmployeeProfile/
| | ├── Fueltypes/
| | ├── Home/
| | ├── Landingpage/
| | ├── Payment/
├ | |── Login/
│ │ ├── Signup/
│ │ ├── Summary/
│ │ ├── SummaryDailyRecords/
│ │ └── IncomeExpenses/
│ ├── Components/
│ ├── App.js
│ └── index.js
├── README.md
├── package.json
└── .gitignore


---

## 🚀 How to Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/Yasmiwijethunga/Ceypetco-Fuel-X.git
cd Ceypetco-Fuel-X

### 2. Install dependencies
npm install

### 3. Start the development server
npm start

Open http://localhost:3000 to view the app in your browser.

✅ Future Enhancements

Connect with a real backend (Node.js + MySQL)

Integrate mobile meter reading app

Add graphical dashboard (Chart.js or D3.js)



