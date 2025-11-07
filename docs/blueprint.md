# **App Name**: RentalFlow Manager

## Core Features:

- Tenant Dashboard: Display current and past invoices with filtering by year; show outstanding debt clearly. I18n is used
- Payment Submission: Tenants submit payments by selecting invoices, entering amounts, and uploading payment receipts (simulated file upload); i18n is used
- Admin Dashboard: Display income summary, cash flow report, and simulated notifications for unverified payments.
- Tenant Management: View, add, and edit tenant details, including property assignment; i18n is used
- Monthly Invoice Generation: Generate invoices for each tenant, incorporating fixed rent and utility fees, using Firestore data. i18n is used.
- Payment Verification Tool: Admins review payment proofs and update invoice statuses (PAID/PENDING) using uploaded data, including simulating the usage of a tool for determining the accuracy of the receipts.
- Expense Tracking: Admins log expenses (fixed services or maintenance costs) associated with each property; i18n is used

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to convey trust and professionalism.
- Background color: Light gray (#F5F5F5), providing a clean and neutral backdrop.
- Accent color: Vibrant orange (#FF9800) to highlight important actions and notifications.
- Body and headline font: 'Inter' sans-serif for a modern, neutral, and readable interface.
- Note: currently only Google Fonts are supported.
- Use lucide-react icons for visual clarity in navigation and action buttons.
- Fully responsive layout, optimized for mobile usability with clear content hierarchy.
- Subtle transitions and animations to enhance user experience (e.g., loading states, form feedback).