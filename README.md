# 🐺 Wolf Society Esports

Wolf Society Esports is a complete, modern, and dynamic esports organization management platform. It features a public hub, player dashboard, management dashboard, and full CRUD operations for teams, matches, players, content, and contracts.

**Live Demo:** [https://wolfsocietygg.vercel.app](https://wolfsocietygg.vercel.app)

---

## ✨ Features

### Public Pages
- Home with animated hero, feature cards, logo carousel, and interactive components.
- Teams listing with detailed stats.
- Match schedule with live results.
- Content hub with videos and articles.
- Eye‑tracking subscription form, flashlight reveal, and scroll‑driven dock.

### Authentication
- Register / Login (JWT‑based).
- Role‑based access (Player, Content Creator, Manager, Admin).

### Player Dashboard
- View personal stats, match history, and team details.
- Edit own profile (limited fields).

### Management Dashboard
- Full CRUD for Teams, Players, Matches, Announcements, Content, Contracts.
- Admin/Manager only – with proper RLS policies.

### Design
- **Modern light theme** with grainy texture background.
- **Glass‑morphism** cards and smooth animations.
- **Responsive** – works on Android, iOS, and PC.
- **Animated components** (hamburger menu, 3D toggle, glowing buttons, etc.).

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML + CSS + JavaScript (Vanilla) |
| Backend | Node.js + Express |
| Database | PostgreSQL (Supabase) |
| Authentication | JWT (bcrypt) |
| Animations | GSAP + ScrollTrigger + CSS keyframes |
| Icons | Lucide (via CDN) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 🚀 Deployment Instructions

### 1. Supabase (Database)

1. Create a free account at [supabase.com](https://supabase.com).
2. Create a new project and copy your **Project URL** and **Service Role Key**.
3. Go to **SQL Editor** and run the `schema.sql` file (provided in the repository).
4. Enable RLS on all tables and run the RLS policies (also provided).

### 2. Backend (Render)

1. Push the `backend/` folder to your GitHub repository.
2. Sign up at [render.com](https://render.com) (free tier).
3. Create a new **Web Service**, connect your repo, set **Root Directory** to `backend/`.
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET` (long random string)
   - `FRONTEND_URL` (your Vercel frontend URL)
5. Deploy – you’ll get a backend URL (e.g., `https://wolf-backend.onrender.com`).

### 3. Frontend (Vercel)

1. Upload the `index.html` file to a GitHub repository.
2. Sign up at [vercel.com](https://vercel.com) (free).
3. Import the repository, set the root to the folder containing `index.html`.
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` (or update `CONFIG.API_BASE` directly in the HTML to your backend URL)
5. Deploy – your frontend is live.

---

## 🔧 Environment Variables

### Vercel Frontend

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://wolf-backend.onrender.com/api` |

### Render Backend

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` |
| `JWT_SECRET` | `your-super-secret-key` |
| `FRONTEND_URL` | `https://wolf-society.vercel.app` |

---

## 🔐 Security

- Row Level Security (RLS) policies restrict data access.
- JWT authentication with bcrypt password hashing.
- CORS configured to only allow your frontend domain.
- Rate limiting on API endpoints.

---

## 🧪 Testing

- Use the test credentials to log in:
  - **Admin**: `admin@wolfsociety.gg` / `admin123`
  - **Player**: `player@wolfsociety.gg` / `player123`

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)

---

## 🐺 Contact

- Website: [https://wolfsocietygg.vercel.app](https://wolfsocietygg.vercel.app)
- Email: [hello@wolfsociety.in](mailto:hello@wolfsociety.in)
