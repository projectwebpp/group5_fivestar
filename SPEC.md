SQLite + DBMCP

Filesystem MCP Server
npm install -g @modelcontextprotocol/server-filesystem

DBMCP (Database MCP Server)
https://github.com/AbdelilahOu/DBMcp
API Endpoints + กรณีขอบเขต (Edge Cases)

โครงหลัก

แนะนำให้แยกเป็น 5 กลุ่ม:

expenses — รายการค่าใช้จ่าย
categories — หมวดหมู่
budgets — งบประมาณ
reports — สรุปผล/กราฟ
recurring — รายจ่ายประจำ

1. Expenses API
   POST /api/expenses

ใช้เพิ่มรายการค่าใช้จ่าย

Request

{
"amount": 120.5,
"currency": "THB",
"categoryId": 2,
"description": "ข้าวกลางวัน",
"expenseDate": "2026-05-08",
"isRecurring": false
}

Response

{
"id": 101,
"amount": 120.5,
"currency": "THB",
"categoryId": 2,
"description": "ข้าวกลางวัน",
"expenseDate": "2026-05-08",
"isRecurring": false,
"createdAt": "2026-05-08T10:30:00Z"
}
GET /api/expenses

ใช้ดึงรายการทั้งหมด หรือกรองตามช่วงเวลา / หมวดหมู่

Query ที่รองรับ

from=2026-05-01
to=2026-05-31
categoryId=2
currency=THB
page=1
limit=20

ตัวอย่าง

GET /api/expenses?from=2026-05-01&to=2026-05-31&categoryId=2
GET /api/expenses/:id

ใช้ดูรายละเอียดรายการเดียว

PUT /api/expenses/:id

ใช้แก้ไขรายการค่าใช้จ่าย

Request

{
"amount": 150,
"description": "ข้าวกลางวัน + ชานม",
"categoryId": 2
}
DELETE /api/expenses/:id

ใช้ลบรายการค่าใช้จ่าย

2. Categories API
   POST /api/categories

สร้างหมวดหมู่ใหม่

{
"name": "อาหาร",
"icon": "utensils",
"color": "#F59E0B"
}
GET /api/categories

ดึงหมวดหมู่ทั้งหมด

PUT /api/categories/:id

แก้ไขหมวดหมู่

DELETE /api/categories/:id

ลบหมวดหมู่

3. Budgets API
   POST /api/budgets

ตั้งงบประมาณรายเดือน

{
"month": "2026-05",
"categoryId": 2,
"limitAmount": 5000,
"currency": "THB"
}
GET /api/budgets?month=2026-05

ดูงบทั้งหมดของเดือนนั้น

PUT /api/budgets/:id

แก้งบ

DELETE /api/budgets/:id

ลบงบ

4. Reports API

อันนี้ไว้ทำกราฟและสรุปผล

GET /api/reports/monthly-summary?month=2026-05

สรุปยอดรายเดือน

Response

{
"month": "2026-05",
"totalExpense": 12850,
"currency": "THB",
"byCategory": [
{ "categoryId": 1, "categoryName": "อาหาร", "amount": 5200 },
{ "categoryId": 2, "categoryName": "เดินทาง", "amount": 1800 }
]
}
GET /api/reports/trend?from=2026-01-01&to=2026-05-31

ใช้ทำกราฟแนวโน้มรายวัน/รายเดือน

GET /api/reports/category-breakdown?month=2026-05

ใช้ทำ pie chart

GET /api/reports/export/csv?month=2026-05

ดาวน์โหลดไฟล์ CSV

5. Recurring Expenses API
   POST /api/recurring

สร้างรายจ่ายประจำ

{
"name": "ค่าเน็ต",
"amount": 599,
"currency": "THB",
"categoryId": 4,
"repeatType": "monthly",
"startDate": "2026-05-01",
"nextRunDate": "2026-06-01"
}
GET /api/recurring

ดูรายการ recurring ทั้งหมด

PUT /api/recurring/:id

แก้ไขรายการประจำ

DELETE /api/recurring/:id

ลบรายการประจำ

6. Notifications / Budget Alert
   GET /api/alerts/budget-status?month=2026-05

เช็กว่างบใกล้เต็มหรือยัง

Response

{
"month": "2026-05",
"limit": 5000,
"spent": 4600,
"remaining": 400,
"warningLevel": "near-limit"
}
โครง Database ที่ควรมี
expenses
id
amount
currency
category_id
description
expense_date
is_recurring
created_at
updated_at
categories
id
name
icon
color
budgets
id
month
category_id
limit_amount
currency
recurring_expenses
id
name
amount
currency
category_id
repeat_type
start_date
next_run_date
is_active
ถ้าจะทำให้ API ดูดีและใช้งานง่าย

แนะนำมาตรฐานนี้ด้วย:

ใช้ GET สำหรับอ่าน
ใช้ POST สำหรับสร้าง
ใช้ PUT/PATCH สำหรับแก้
ใช้ DELETE สำหรับลบ
ทุก response ใส่ success, data, message
รองรับ pagination
รองรับ filter ตามวันที่/หมวดหมู่/สกุลเงิน
ตัวอย่าง response มาตรฐาน
{
"success": true,
"data": [],
"message": "Fetched expenses successfully"
}
ถ้าจะเอาไปทำ MVP ก่อน

เอาแค่ 4 endpoint นี้ก็พอเริ่มได้เลย:

POST /api/expenses
GET /api/expenses
DELETE /api/expenses/:id
GET /api/reports/monthly-summary?month=YYYY-MM

ถ้าจะต่อ ฉันจัดให้ได้ทันทีเป็น API Spec แบบเต็ม พร้อม Swagger/OpenAPI หรือจะเอาเป็น โครง FastAPI / Express.js ก็ได้เหมือนกัน

API Endpoints + กรณี ขอบเขต (Edge Cases) ของงานนี้
Thought for a couple of seconds

ได้เลย นี่คือ API Endpoints + Edge Cases สำหรับ Project B: Expense Tracker แบบเอาไปทำจริงได้เลย ไม่หลุด ไม่มั่ว ไม่ทำงานเหมือนแอปที่พังตอนสิ้นเดือน 😌

1. โครง API Endpoints หลัก
   Expenses

ใช้จัดการรายการค่าใช้จ่ายทั้งหมด

POST /api/expenses

เพิ่มรายการค่าใช้จ่าย

Body

{
"amount": 120.5,
"currency": "THB",
"categoryId": 2,
"description": "ข้าวกลางวัน",
"expenseDate": "2026-05-08",
"notes": "กินกับเพื่อน",
"isRecurring": false
}
GET /api/expenses

ดูรายการทั้งหมด พร้อม filter ได้

Query

from=2026-05-01
to=2026-05-31
categoryId=2
currency=THB
minAmount=50
maxAmount=1000
page=1
limit=20
sortBy=expenseDate
sortOrder=desc
GET /api/expenses/:id

ดูรายละเอียดรายการเดียว

PUT /api/expenses/:id

แก้ไขรายการแบบเต็ม

PATCH /api/expenses/:id

แก้บาง field

DELETE /api/expenses/:id

ลบรายการ

Categories

ใช้จัดการหมวดหมู่

POST /api/categories

สร้างหมวดหมู่

{
"name": "อาหาร",
"icon": "utensils",
"color": "#F59E0B"
}
GET /api/categories

ดูหมวดหมู่ทั้งหมด

PUT /api/categories/:id

แก้หมวดหมู่

DELETE /api/categories/:id

ลบหมวดหมู่

Budgets

ใช้ตั้งงบประมาณรายเดือนหรือรายหมวด

POST /api/budgets

ตั้งงบ

{
"month": "2026-05",
"categoryId": 2,
"limitAmount": 5000,
"currency": "THB"
}
GET /api/budgets?month=2026-05

ดูงบทั้งหมดของเดือนนั้น

GET /api/budgets/:id

ดูงบรายการเดียว

PUT /api/budgets/:id

แก้งบ

DELETE /api/budgets/:id

ลบงบ

Reports

ใช้ทำสรุปผล / กราฟ

GET /api/reports/monthly-summary?month=2026-05

สรุปยอดรวมรายเดือน

GET /api/reports/category-breakdown?month=2026-05

สรุปแยกตามหมวด

GET /api/reports/trend?from=2026-01-01&to=2026-05-31

ดูแนวโน้มรายวัน/รายเดือน

GET /api/reports/export/csv?month=2026-05

ดาวน์โหลด CSV

GET /api/reports/dashboard?month=2026-05

รวมทุกอย่างใน endpoint เดียวสำหรับหน้า dashboard

Recurring Expenses

ใช้กับค่าใช้จ่ายรายประจำ

POST /api/recurring

สร้างรายการรายจ่ายประจำ

{
"name": "ค่าเน็ต",
"amount": 599,
"currency": "THB",
"categoryId": 4,
"repeatType": "monthly",
"startDate": "2026-05-01",
"nextRunDate": "2026-06-01",
"isActive": true
}
GET /api/recurring

ดูรายการ recurring ทั้งหมด

GET /api/recurring/:id

ดูรายการเดียว

PUT /api/recurring/:id

แก้รายการ recurring

DELETE /api/recurring/:id

ลบรายการ recurring

POST /api/recurring/:id/run

สร้าง expense จาก recurring ทันที

Alerts / Notifications

ใช้แจ้งเตือนงบใกล้เต็มหรือเกินงบ

GET /api/alerts/budget-status?month=2026-05

เช็กสถานะงบ

GET /api/alerts?month=2026-05

ดูรายการแจ้งเตือนทั้งหมด

POST /api/alerts/test

ทดสอบแจ้งเตือน

Multi-currency

ถ้ารองรับหลายสกุลเงินจริง ควรมี endpoints แบบนี้ด้วย

GET /api/currencies

ดูสกุลเงินที่รองรับ

GET /api/exchange-rates?base=THB

ดึงอัตราแลกเปลี่ยน

POST /api/exchange-rates/refresh

รีเฟรชเรตล่าสุด

2. Edge Cases สำคัญของงานนี้

อันนี้แหละที่ทำให้โปรเจกต์ดู “เป็นงานจริง” ไม่ใช่แค่ CRUD เล่น ๆ

A) ข้อมูล expense

1. จำนวนเงินติดลบ หรือเป็นศูนย์
   amount <= 0 ควร reject
   status: 400 Bad Request
2. จำนวนเงินเป็นข้อความ
   เช่น "abc"
   ต้อง validate เป็นตัวเลข
3. จำนวนเงินทศนิยมเกิน
   เช่น 120.999999
   ควรกำหนด precision เช่น 2 ตำแหน่ง
4. วันที่อนาคต
   ถ้า expenseDate อยู่ในอนาคต อาจ:
   อนุญาตถ้าเป็น planned expense
   หรือ reject ถ้าโปรเจกต์ต้องการเฉพาะข้อมูลย้อนหลัง/ปัจจุบัน
5. วันที่ไม่ถูก format
   เช่น 2026/05/08 หรือ 08-05-2026
   ควรบังคับ ISO YYYY-MM-DD
6. categoryId ไม่มีอยู่จริง
   ต้องเช็ก foreign key
   ถ้าไม่เจอ category → 404 หรือ 400
7. description ว่าง
   ถ้าบังคับต้องมีรายละเอียด ก็ reject
   ถ้าไม่บังคับ ให้ default เป็น - หรือ null
8. ค่าเงินไม่รองรับ
   เช่น XYZ
   ต้อง validate currency code
   B) การแก้ไขรายการ
9. ลบรายการที่ไม่มีอยู่
   404 Not Found
10. แก้รายการที่ถูกลบไปแล้ว
    ต้องเช็กว่า record ยังอยู่จริง
11. แก้บาง field แล้วทำให้ข้อมูลไม่สอดคล้อง

ตัวอย่าง:

แก้ amount ได้
แต่ currency หาย
หรือ categoryId เป็นค่าที่ไม่มีอยู่ 4. อัปเดต record พร้อมกันหลายคน
ถ้ามี multi-user ควรมี updatedAt หรือ optimistic locking
กันข้อมูลทับกันแบบเงียบ ๆ
C) หมวดหมู่

1. ลบ category ที่ยังถูกใช้อยู่

ต้องกำหนด policy:

ห้ามลบถ้ายังมี expense ใช้อยู่
หรืออนุญาตแล้ว set expense เป็น uncategorized 2. หมวดหมู่ซ้ำ
เช่น “อาหาร” กับ “อาหาร ”
ควร trim และ normalize ก่อนเช็กซ้ำ 3. ชื่อหมวดหมู่ยาวเกิน
จำกัดความยาว เช่น 50 ตัวอักษร 4. icon/color ไม่ถูก format
color ควรเป็น hex ที่ valid
icon ควรเป็นค่าที่ระบบรองรับ
D) Budgets

1. งบเป็นศูนย์หรือติดลบ
   reject ทันที
2. ตั้งงบซ้ำเดือนเดิม + หมวดเดิม

ต้องเลือกแนวทาง:

อนุญาตอันเดียวต่อ month/category
หรือให้หลายงบได้ แต่ต้องมี priority 3. ใช้จ่ายเกินงบ
ต้องให้รายงานขึ้นสถานะ:
safe
warning
over-budget 4. งบสกุลเงินไม่ตรงกับค่าใช้จ่าย
ถ้ามีหลาย currency ต้องแปลงก่อนรวมยอด
ไม่งั้นยอดรวมจะมั่วแบบบัญชีผี 5. ยอดรายเดือนข้ามเดือน
เช่น expense วันที่ 31 ตอนดึก อาจนับผิดเดือนถ้า timezone ไม่ชัด
ต้องกำหนด timezone ชัดเจน
E) Recurring Expenses

1. รอบซ้ำไม่ถูกต้อง
   monthly / weekly / daily ควร validate ค่าที่รับได้เท่านั้น
2. startDate มากกว่า nextRunDate
   ต้องเช็กความสมเหตุสมผล
3. ระบบสร้าง expense ซ้ำ
   ถ้า scheduler รันซ้ำ อาจ generate record ซ้ำ
   ต้องมี unique key เช่น recurringId + runDate
4. recurring ถูกปิดใช้งานแต่ยังถูก generate
   ต้องเช็ก isActive
5. เปลี่ยนค่า recurring ระหว่างรอรัน
   ถ้าแก้ amount ก่อนรอบถัดไป ต้องนิยามชัดว่า
   ใช้ค่าล่าสุด
   หรือใช้ค่าตั้งแต่ครั้งแรก
   F) รายงาน / กราฟ
6. ไม่มีข้อมูลในช่วงนั้น
   ควรคืนค่าเป็น empty array ไม่ใช่ error
7. ข้อมูลเยอะมาก
   ต้องรองรับ pagination หรือ aggregation ฝั่ง server
8. ค่ารวมไม่ตรงเพราะ currency หลายสกุล
   ต้องแปลงเป็น base currency ก่อนสรุป
9. กราฟรายเดือนข้ามปี
   เช่น Dec → Jan
   ต้อง format เดือนให้ถูก ไม่งั้นกราฟเรียงผิด
   G) CSV Export
10. มีอักขระพิเศษใน description
    เช่น comma, quote, newline
    ต้อง escape ให้ถูก ไม่งั้น CSV แตก
11. ข้อมูลเยอะมาก
    ควร export แบบ streaming ถ้าปริมาณมาก
12. ไม่มีข้อมูล
    ควรยัง export ไฟล์ได้ หรือคืน empty CSV ที่มี header
13. ชื่อไฟล์ชนกัน
    เช่น expense-2026-05.csv
    อาจใช้ timestamp ต่อท้าย
    H) Timezone / วันที่

อันนี้สำคัญมาก เพราะ expense tracker พังง่ายสุดตรงนี้

ปัญหาที่เจอได้
user อยู่ไทย แต่ server ใช้ UTC
รายการตอน 00:30 อาจถูกนับผิดวัน
รายเดือนอาจหลุดไปเดือนก่อน/เดือนถัดไป
ทางแก้
เก็บเวลาแบบ UTC ใน DB
แสดงผลตาม timezone ผู้ใช้
ใช้ field แบบ expenseDate แยกจาก createdAt
I) Validation / Security

1. Input ไม่ครบ
   amount ไม่มี
   categoryId ไม่มี
   date ไม่มี
2. SQL Injection
   ต้องใช้ parameterized query / ORM
3. ค่า string ยาวเกิน
   description ยาวจน DB พังหน้าแหก
4. API ถูกยิงถี่เกิน
   ควรมี rate limit ถ้าทำเป็น production
5. Unauthorized access
   ถ้ามีหลายผู้ใช้ ต้องแยกข้อมูลตาม userId

3) Response Pattern ที่แนะนำ

ใช้ pattern เดียวทุก endpoint จะอ่านง่ายมาก

{
"success": true,
"message": "Expense created successfully",
"data": {
"id": 1
}
}

ตอน error:

{
"success": false,
"message": "Validation failed",
"errors": [
{
"field": "amount",
"message": "Amount must be greater than 0"
}
]
} 4) Status Code ที่ควรใช้
200 OK — ดึงข้อมูลสำเร็จ
201 Created — สร้างรายการสำเร็จ
400 Bad Request — ข้อมูลไม่ผ่าน validation
401 Unauthorized — ยังไม่ล็อกอิน
403 Forbidden — ไม่มีสิทธิ์
404 Not Found — ไม่เจอข้อมูล
409 Conflict — ข้อมูลซ้ำ
422 Unprocessable Entity — ข้อมูลรูปแบบถูก แต่ logic ไม่ผ่าน
500 Internal Server Error — ฝั่ง server พัง 5) MVP ที่ควรมีจริง ๆ ก่อน

ถ้าจะทำให้เสร็จเร็วแต่ดูครบ ใช้แค่นี้ก่อน:

POST /api/expenses
GET /api/expenses
DELETE /api/expenses/:id
GET /api/reports/monthly-summary?month=YYYY-MM
POST /api/categories
GET /api/categories

แค่นี้ก็ทำเดโมได้แล้ว

6. ตัวอย่าง Edge Case แบบเขียนใส่เอกสารได้เลย

- Reject amount <= 0
- Reject invalid date format
- Prevent duplicate category names
- Prevent deleting category in use unless reassigned
- Handle empty report result gracefully
- Convert all amounts to base currency before aggregation
- Prevent recurring jobs from creating duplicate expenses
- Use UTC in database and timezone-aware display on UI

# Expense Tracker - MoSCoW Requirements Analysis

## Must Have (Essential Features)

**Expense Logging System** (Create, Read, Delete)

- Add new expenses with amount and description
- View existing expenses
- Delete expenses

**Basic Category System** (Category Tagging)

- Assign expenses to predefined categories
- Tag expenses with multiple categories if needed

**Monthly Total Calculation**

- Calculate total expenses per month
- Display monthly summaries

**Date Data Storage** (Date Truncation)

- Store and manage expense dates
- Maintain date consistency for reporting

---

## Should Have (High Priority Features)

**Summary Graphs** (Pie Chart by Category)

- Visualize expense distribution by category
- Interactive pie chart with category breakdowns

**Date Range Filtering System**

- Filter expenses by custom date ranges
- View expenses between specific start and end dates

**Average Calculations**

- Calculate daily average expenses
- Calculate monthly average expenses
- Display average metrics alongside totals

---

## Could Have (Nice-to-Have Features)

**Monthly Budget Management**

- Set monthly budget limits per category
- Track spending against budget
- Alert notifications when approaching budget limit

**CSV Export Functionality**

- Export expense data to CSV format
- Download data for external analysis

**Recurring Expenses Management**

- Create recurring expense entries
- Manage subscription-based or regular payments
- Auto-populate recurring expenses

---

## Won't Have (Out of Scope for This Phase)

**AI Receipt Scanning** (OCR)

- Optical Character Recognition for receipt images
- Automated expense data extraction from receipts

**Automatic Cross-Bank Sync System**

- Synchronize data across multiple bank accounts
- Real-time transaction integration from banks

---

## Summary

**Total Must Have**: 4 major feature groups
**Total Should Have**: 3 major feature groups
**Total Could Have**: 3 major feature groups
**Total Won't Have**: 2 out of scope items

This prioritization ensures a minimum viable product (MVP) with essential expense tracking capabilities, followed by analytical features, and optional enhancements for future phases.

## Goal

**Build an Expense Tracker for individual users to accurately monitor monthly spending and visualize financial status.**
**Problem Statement (Why):** To eliminate the risk of errors in manual financial aggregation and complex calculations, which often lead to inaccurate financial tracking.
**Target Benefit:** Provide users with real-time monthly financial insights and a structured system for categorized expense management.

## Tech Stack

Front: React(NodeJS TypeScript)
Back: Laravel(PHP)
DB: MySQL

Expense Tracker - Data Models Design

1. Core Data Models
   1.1 Expense Model
   interface Expense {
   id: string; // Unique identifier (UUID or auto-increment)
   amount: number; // Expense amount (in THB or currency)
   description: string; // Expense description/name
   category: string; // Category ID reference
   date: Date; // Date of expense
   createdAt: Date; // Timestamp when created
   updatedAt: Date; // Timestamp when last updated
   notes?: string; // Optional additional notes
   tags?: string[]; // Optional additional tags
   isRecurring?: boolean; // Flag for recurring expenses
   recurringId?: string; // Reference to recurring expense template
   }

Database Table: expenses

| Column      | Type          | Constraints               |
| ----------- | ------------- | ------------------------- |
| id          | UUID/INT      | PRIMARY KEY               |
| amount      | DECIMAL(10,2) | NOT NULL                  |
| description | VARCHAR(255)  | NOT NULL                  |
| category_id | UUID/INT      | NOT NULL, FOREIGN KEY     |
| date        | DATE          | NOT NULL                  |
| notes       | TEXT          | NULL                      |
| created_at  | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |
| updated_at  | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP |

1.2 Category Model
interface Category {
id: string; // Unique identifier
name: string; // Category name (e.g., "Food", "Transport")
description?: string; // Optional description
color?: string; // Color code for UI display (HEX: #FF5733)
icon?: string; // Icon identifier for display
budget?: number; // Optional monthly budget
createdAt: Date; // Created timestamp
}

Database Table: categories

| Column      | Type          | Constraints      |
| ----------- | ------------- | ---------------- |
| id          | UUID/INT      | PRIMARY KEY      |
| name        | VARCHAR(50)   | NOT NULL, UNIQUE |
| description | TEXT          | NULL             |
| color       | VARCHAR(7)    | NULL (HEX color) |
| icon        | VARCHAR(50)   | NULL             |
| budget      | DECIMAL(10,2) | NULL             |
| created_at  | TIMESTAMP     | DEFAULT NOW()    |

Default Categories:

🍔 Food (อาหาร)
🚗 Transport (ขนส่ง)
🏠 Housing (ที่อยู่อาศัย)
📚 Education (การศึกษา)
💊 Health (สุขภาพ)
🎮 Entertainment (ความบันเทิง)
💳 Shopping (ช้อปปิ้ง)
🔌 Utilities (สาธารณูปโภค)
💼 Business (ธุรกิจ)
🎁 Other (อื่นๆ)

1.3 Recurring Expense Model
interface RecurringExpense {
id: string; // Unique identifier
expenseId: string; // Reference to expense template
frequency: "daily" | "weekly" | "monthly" | "yearly";
startDate: Date; // When recurring starts
endDate?: Date; // Optional end date
nextDueDate: Date; // Next scheduled date
isActive: boolean; // Whether this is still active
createdAt: Date;
}

Database Table: recurring_expenses

| Column        | Type      | Constraints           |
| ------------- | --------- | --------------------- |
| id            | UUID/INT  | PRIMARY KEY           |
| expense_id    | UUID/INT  | NOT NULL, FOREIGN KEY |
| frequency     | ENUM      | NOT NULL              |
| start_date    | DATE      | NOT NULL              |
| end_date      | DATE      | NULL                  |
| next_due_date | DATE      | NOT NULL              |
| is_active     | BOOLEAN   | DEFAULT TRUE          |
| created_at    | TIMESTAMP | DEFAULT NOW()         |

2. Calculated/Aggregate Models (Not persisted, calculated on-the-fly)
   2.1 Monthly Summary Model
   interface MonthlySummary {
   month: string; // Format: "YYYY-MM"
   year: number; // Year number
   totalExpense: number; // Sum of all expenses
   categoryBreakdown: {
   categoryName: string;
   amount: number;
   percentage: number;
   }[];
   averageDailyExpense: number; // Total / days in month
   averageMonthlyExpense?: number;// For trend analysis
   }

2.2 Category Summary Model
interface CategorySummary {
categoryId: string;
categoryName: string;
categoryColor: string;
totalAmount: number; // Sum for period
percentage: number; // % of total
transactionCount: number; // Number of transactions
averagePerTransaction: number; // Average transaction size
budget?: number; // Monthly budget if set
budgetUsedPercentage?: number; // % of budget used
budgetRemaining?: number; // Budget - spent
isOverBudget?: boolean; // Flag if over budget
}

2.3 Date Range Summary Model
interface DateRangeSummary {
startDate: Date;
endDate: Date;
daysInRange: number;
totalExpense: number;
averageDailyExpense: number;
totalTransactions: number;
categoryBreakdown: CategorySummary[];
dailyBreakdown?: {
date: Date;
amount: number;
}[];
}

2.4 Expense Report Model
interface ExpenseReport {
reportType: "monthly" | "weekly" | "custom";
period: string; // e.g., "January 2025" or "2025-01-01 to 2025-01-31"
generatedAt: Date;
summary: {
totalExpense: number;
totalTransactions: number;
averagePerDay: number;
averagePerTransaction: number;
};
categoryData: CategorySummary[];
topCategories: CategorySummary[]; // Top 5 by amount
trends?: {
comparison: "vs previous month" | "vs same month last year";
percentageChange: number;
};
}

3. Filter/Query Models
   3.1 Expense Filter Model
   interface ExpenseFilter {
   startDate?: Date; // Filter from date
   endDate?: Date; // Filter to date
   categoryId?: string; // Filter by category
   categoryIds?: string[]; // Filter by multiple categories
   minAmount?: number; // Minimum amount filter
   maxAmount?: number; // Maximum amount filter
   searchText?: string; // Search in description/notes
   sortBy?: "date" | "amount" | "category";
   sortOrder?: "asc" | "desc";
   limit?: number; // Pagination limit
   offset?: number; // Pagination offset
   }

3.2 Budget Alert Model
interface BudgetAlert {
id: string;
categoryId: string;
threshold: number; // Alert when reached % of budget
isActive: boolean;
lastAlertDate?: Date;
alertType: "warning" | "critical"; // 75% or 100%
}

4. Relationship Diagram
   ┌─────────────────┐
   │ CATEGORIES │
   ├─────────────────┤
   │ id (PK) │
   │ name │
   │ color │
   │ icon │
   │ budget │
   └────────┬────────┘
   │
   │ (1:N)
   │
   ┌────────▼────────────────────┐
   │ EXPENSES │
   ├─────────────────────────────┤
   │ id (PK) │
   │ amount │
   │ description │
   │ category_id (FK) │
   │ date │
   │ recurring_id (FK, optional) │
   │ notes │
   │ created_at │
   │ updated_at │
   └────────┬────────────────────┘
   │
   │ (1:N)
   │
   ┌────────▼────────────────┐
   │ RECURRING_EXPENSES │
   ├─────────────────────────┤
   │ id (PK) │
   │ expense_id (FK) │
   │ frequency │
   │ start_date │
   │ end_date (optional) │
   │ next_due_date │
   │ is_active │
   └─────────────────────────┘

5. Database Initialization Scripts
   5.1 Create Tables (SQL)
   -- Create Categories Table
   CREATE TABLE categories (
   id INTEGER PRIMARY KEY AUTO_INCREMENT,
   name VARCHAR(50) NOT NULL UNIQUE,
   description TEXT,
   color VARCHAR(7),
   icon VARCHAR(50),
   budget DECIMAL(10, 2),
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   INDEX idx_name (name)
   );

-- Create Expenses Table
CREATE TABLE expenses (
id INTEGER PRIMARY KEY AUTO_INCREMENT,
amount DECIMAL(10, 2) NOT NULL,
description VARCHAR(255) NOT NULL,
category_id INTEGER NOT NULL,
date DATE NOT NULL,
notes TEXT,
recurring_id INTEGER,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
FOREIGN KEY (recurring_id) REFERENCES recurring_expenses(id) ON DELETE SET NULL,
INDEX idx_date (date),
INDEX idx_category_id (category_id),
INDEX idx_created_at (created_at)
);

-- Create Recurring Expenses Table
CREATE TABLE recurring_expenses (
id INTEGER PRIMARY KEY AUTO_INCREMENT,
expense_id INTEGER NOT NULL,
frequency ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
start_date DATE NOT NULL,
end_date DATE,
next_due_date DATE NOT NULL,
is_active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
INDEX idx_next_due_date (next_due_date),
INDEX idx_is_active (is_active)
);

-- Create Budget Alerts Table
CREATE TABLE budget_alerts (
id INTEGER PRIMARY KEY AUTO_INCREMENT,
category_id INTEGER NOT NULL,
threshold INTEGER NOT NULL DEFAULT 75,
is_active BOOLEAN DEFAULT TRUE,
last_alert_date TIMESTAMP,
alert_type ENUM('warning', 'critical') NOT NULL,
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
INDEX idx_category_id (category_id)
);

5.2 Insert Default Categories
INSERT INTO categories (name, icon, color, budget) VALUES
('Food', '🍔', '#FF6B6B', 5000),
('Transport', '🚗', '#4ECDC4', 2000),
('Housing', '🏠', '#FFE66D', 10000),
('Education', '📚', '#95E1D3', 3000),
('Health', '💊', '#F38181', 2000),
('Entertainment', '🎮', '#AA96DA', 2000),
('Shopping', '💳', '#FCBAD3', 4000),
('Utilities', '🔌', '#A8D8EA', 1500),
('Business', '💼', '#C1D82F', 5000),
('Other', '🎁', '#999999', NULL);

6. TypeScript Interfaces Summary
   // Main Data Models

- Expense
- Category
- RecurringExpense

// Aggregate Models

- MonthlySummary
- CategorySummary
- DateRangeSummary
- ExpenseReport

// Query/Filter Models

- ExpenseFilter
- BudgetAlert

// Response Models

- ApiResponse<T>
- PaginatedResponse<T>

7. Validation Rules
   Expense Validation
   amount: Must be positive number > 0, max 2 decimal places
   description: Required, 1-255 characters
   category: Must exist in categories table
   date: Cannot be in future, must be valid date format
   notes: Optional, max 1000 characters

Category Validation
name: Required, unique, 1-50 characters
color: Optional, must be valid HEX format (#RRGGBB)
budget: Optional, must be positive if provided

Recurring Expense Validation
frequency: Must be one of: daily, weekly, monthly, yearly
startDate: Must be valid date
endDate: If provided, must be after startDate
nextDueDate: Must be after startDate

8. Data Storage Options
   Option A: SQLite (Recommended for MVP)
   Simple setup, no server needed
   File-based storage
   Good for desktop/local apps
   File: expense_tracker.db

Option B: PostgreSQL
Better for multi-user scenarios
Advanced features and scalability
Recommended for production

Option C: MongoDB (NoSQL)
Flexible schema
Good for rapid prototyping
Different query patterns

Recommendation: Use SQLite for MVP, migrate to PostgreSQL if needed.

9. Sample Data
   {
   "categories": [
   {
   "id": 1,
   "name": "Food",
   "icon": "🍔",
   "color": "#FF6B6B",
   "budget": 5000
   }
   ],
   "expenses": [
   {
   "id": 1,
   "amount": 250,
   "description": "Lunch at Warorot",
   "category_id": 1,
   "date": "2025-01-15",
   "notes": "pad krapow moo",
   "created_at": "2025-01-15T12:30:00Z"
   }
   ]
   }

10. Future Enhancements
    User Model: For multi-user support
    Transaction History: Track all changes
    Attachments: Store receipt images
    Tags: More flexible categorization
    Analytics: Advanced metrics and predictions
