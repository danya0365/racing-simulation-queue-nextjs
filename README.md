# 🏎️ Racing Queue - ระบบจองคิว Racing Simulator

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)

ระบบจองคิวสำหรับร้านเกม Racing Simulation - ง่าย รวดเร็ว สะดวก

## ✨ Features

### 🎮 สำหรับลูกค้า (`/customer`)
- เลือกเครื่อง Racing Simulator ที่ต้องการจอง
- ดูสถานะเครื่อง (ว่าง/กำลังใช้งาน/ซ่อมบำรุง)
- กรอกข้อมูลจองคิวง่ายๆ
- ติดตามสถานะคิวแบบ Real-time

### ⚙️ สำหรับแอดมิน (`/backend`)
- Dashboard แสดงภาพรวม
- จัดการคิว (เริ่ม/เสร็จสิ้น/ยกเลิก)
- จัดการเครื่องเล่น (เปิด/ปิด/ซ่อมบำรุง)

### 🎨 Design
- **Racing Theme**: สีสันสดใส Neon Glow
- **Dark Mode**: รองรับโหมดมืด
- **Animations**: ใช้ react-spring สำหรับ micro-interactions
- **Full-screen Layout**: ออกแบบแบบ Web App

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build
```

เข้าใช้งานที่ http://localhost:3000

## 📁 Project Structure

```
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home page
│   ├── customer/                 # Customer routes
│   │   ├── page.tsx              # Booking page
│   │   └── queue/[id]/page.tsx   # Queue status page
│   └── backend/                  # Admin routes
│       └── page.tsx              # Admin dashboard
├── src/
│   ├── application/              # Application layer
│   │   └── repositories/         # Repository interfaces
│   ├── infrastructure/           # Infrastructure layer
│   │   └── repositories/mock/    # Mock implementations
│   └── presentation/             # Presentation layer
│       ├── components/           # UI Components
│       ├── presenters/           # Presenter pattern
│       └── providers/            # Context providers
└── public/styles/                # TailwindCSS styles
```

## 🏗️ Architecture

โปรเจคนี้ใช้ **Clean Architecture** pattern:

```
┌─────────────────────────────────────────────┐
│            Presentation Layer               │
│   (Components, Presenters, Views)           │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│            Application Layer                │
│        (Repository Interfaces)              │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│           Infrastructure Layer              │
│   (Mock Repositories / Supabase)            │
└─────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React Framework |
| **TypeScript** | Type Safety |
| **TailwindCSS 4** | Styling |
| **react-spring** | Animations |
| **next-themes** | Dark Mode |
| **Supabase** | Database (optional) |
| **Zustand** | State Management |

## 📝 Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run type-check       # Run TypeScript check
npm run lint             # Run ESLint
npm run supabase-start   # Start local Supabase
npm run supabase-reset   # Reset Supabase database
```

## 🎯 Routes

| Route | Description |
|-------|-------------|
| `/` | Home page with machine overview |
| `/customer` | Customer booking page |
| `/customer/queue/[id]` | Queue status page |
| `/backend` | Admin dashboard |

## 🌙 Dark Mode

รองรับ Dark Mode โดยใช้ `next-themes`:
- คลิกปุ่ม Theme Toggle ที่ Header
- บันทึก preference ไว้ใน localStorage
- รองรับ System preference

## 📦 Data Models

### Machine
```typescript
interface Machine {
  id: string;
  name: string;
  description: string;
  position: number;
  status: 'available' | 'occupied' | 'maintenance';
  isActive: boolean;
}
```

### Queue
```typescript
interface Queue {
  id: string;
  machineId: string;
  customerName: string;
  customerPhone: string;
  bookingTime: string;
  duration: number;
  status: 'waiting' | 'playing' | 'completed' | 'cancelled';
  position: number;
}
```

## 🔧 Configuration

### Environment Variables

สำหรับ Supabase integration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📄 License

MIT License

---

Made with ❤️ by Racing Queue Team
