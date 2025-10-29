
# 🧾 BookIt — Experiences & Slot Booking System

**BookIt** is a full-stack booking demo app for reserving experiences and time slots.  
It includes a **Next.js 16 (App Router)** frontend, an **Express.js backend**, and a **Supabase database** for real-time data management.

---

## 🚀 Features

✅ Browse & search experiences dynamically  
✅ View available slots with live remaining capacity  
✅ Secure checkout form with validation  
✅ Optional promo code discount system  
✅ Prevents double-booking for the same slot  
✅ Data persistence using Supabase  
✅ Fully responsive design (TailwindCSS)  
✅ Deployed easily to **Vercel (frontend)** + **Render/Heroku (backend)**

---

## 🗂️ Project Structure

```

BookIt/
├── app/                # Next.js frontend (App Router)
│   ├── checkout/       # Checkout page
│   ├── experience/     # Experience detail pages
│   ├── result/         # Booking confirmation screen
│   ├── globals.css     # Tailwind global styles
│   └── layout.tsx      # Root layout + Navbar
│
├── backend/            # Express.js backend
│   ├── index.js        # Main Express server
│   ├── supabaseServer.js
│   └── .env.local      # Backend environment file
│
├── public/             # Static assets (logos, images)
├── next.config.mjs     # Next.js configuration
├── package.json
└── README.md

````

---

## ⚙️ Prerequisites

Before you begin, make sure you have:

- **Node.js** v18+  
- **npm** or **yarn**  
- **Supabase account** → [https://supabase.com](https://supabase.com)

---

## 🔧 Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Siddhivinayak06/BookIt.git
cd BookIt
````

---

### 2. Install dependencies

```bash
npm install
```

or

```bash
yarn install
```

---

### 3. Set up Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. In the **SQL Editor**, run the following schema setup (simplified example):

```sql
create table experiences (
  id serial primary key,
  title text not null,
  slug text,
  description text,
  image_url text,
  price_cents integer not null,
  created_at timestamptz default now()
);

create table slots (
  id serial primary key,
  experience_id integer references experiences(id),
  slot_at timestamptz not null,
  capacity integer not null,
  created_at timestamptz default now()
);

create table bookings (
  id serial primary key,
  slot_id integer references slots(id),
  email text not null,
  name text not null,
  phone text,
  quantity integer not null,
  created_at timestamptz default now()
);

create table promos (
  id serial primary key,
  code text unique not null,
  type text check (type in ('flat', 'percentage')),
  value integer not null,
  active boolean default true,
  expires_at timestamptz
);
```

---

### 4. Create Supabase RPC Functions

#### `get_slots_with_remaining`

```sql
create or replace function get_slots_with_remaining(p_experience_id integer)
returns table(id integer, slot_at timestamptz, capacity integer, remaining integer)
language sql as $$
  select s.id, s.slot_at, s.capacity,
         s.capacity - coalesce(sum(b.quantity), 0) as remaining
  from slots s
  left join bookings b on s.id = b.slot_id
  where s.experience_id = p_experience_id
  group by s.id;
$$;
```

#### `rpc_create_booking`

```sql
create or replace function rpc_create_booking(
  p_slot_id integer,
  p_name text,
  p_email text,
  p_phone text,
  p_quantity integer,
  p_promo_code text default null,
  p_expected_total_cents bigint
)
returns json as $$
declare
  v_promo record;
  v_booking_id integer;
begin
  -- Optional promo
  if p_promo_code is not null and trim(p_promo_code) <> '' then
    select * into v_promo from promos
    where upper(code) = upper(trim(p_promo_code)) and active = true;
  end if;

  insert into bookings (slot_id, name, email, phone, quantity)
  values (p_slot_id, p_name, p_email, p_phone, p_quantity)
  returning id into v_booking_id;

  return json_build_object('booking_id', v_booking_id);
end;
$$ language plpgsql;
```

---

### 5. Configure environment variables

#### 📁 `.env.local` (for both frontend and backend)

```bash
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

---

## ▶️ Run Locally

### Start backend server:

```bash
cd backend
npm run dev
# or
node index.js
```

### Start frontend (Next.js app):

```bash
npm run dev
```

Frontend: **[http://localhost:3000](http://localhost:3000)**
Backend: **[http://localhost:4000](http://localhost:4000)**

---

## 🧠 Common Issues

| Problem                                | Fix                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `Slot not found`                       | Make sure the slot exists and experience_id matches                    |
| `record "v_promo" is not assigned yet` | Ensure promo code is optional (`if condition` guards added)            |
| TypeScript build fails on Vercel       | Use `String(value)` instead of raw array element types                 |
| CORS blocked                           | Set `CORS_ORIGIN=http://localhost:3000` or `*` in backend `.env.local` |

---

## ☁️ Deployment

### Frontend → **Vercel**

* Connect your GitHub repo
* Set environment variables under **Project Settings → Environment Variables**
* Deploy!

### Backend → **Render / Railway / Heroku**

* Deploy the backend folder
* Add `.env.local` values
* Expose port `4000`

---

## 📸 Preview

![Checkout Page Preview](./docs/checkout-preview.png)

---

## 🧑‍💻 Author

**Siddhivinayak Sawant**
📍 Fr. C. Rodrigues Institute of Technology (FCRIT), Navi Mumbai
💻 [GitHub](https://github.com/Siddhivinayak06)

---

## 📄 License

MIT License © 2025 — BookIt Project Team

```

---


